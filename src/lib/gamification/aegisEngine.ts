import {
  db,
  aegisBarriers,
  aegisCracks,
  budgets,
  transactions,
  categories,
} from "@/lib/db";
import { eq, and, gte, lte } from "drizzle-orm";
import crypto from "crypto";
import { redeemFrostShards } from "./frostEngine";

export interface AegisStatusDetails {
  status: "intact" | "minor_cracked" | "major_cracked" | "shattered";
  label: string;
  description: string;
  color: string;
  glowColor: string;
  badge: string;
}

export function getAegisStatusDetails(integrity: number): AegisStatusDetails {
  if (integrity >= 100) {
    return {
      status: "intact",
      label: "Aegis Utuh (100% Integritas)",
      description: "Perisai anggaran berdiri kokoh tanpa retakan. Pertahankan hingga akhir bulan!",
      color: "#88C0D0",
      glowColor: "rgba(136, 192, 208, 0.4)",
      badge: "Utuh Sempurna",
    };
  }
  if (integrity >= 75) {
    return {
      status: "minor_cracked",
      label: "Retak Ringan",
      description: "Ada sedikit overspend (≤ 10%). Dapat diperbaiki dengan Rune Frost Shard!",
      color: "#EBCB8B",
      glowColor: "rgba(235, 203, 139, 0.4)",
      badge: "Perlu Perbaikan",
    };
  }
  if (integrity >= 40) {
    return {
      status: "major_cracked",
      label: "Retak Parah",
      description: "Overspend melebihi batas toleransi (> 10%). Integritas perisai melemah permanen.",
      color: "#D08770",
      glowColor: "rgba(208, 135, 112, 0.4)",
      badge: "Kerusakan Mayor",
    };
  }
  return {
    status: "shattered",
    label: "Perisai Hancur",
    description: "Pertahanan anggaran jebol di banyak kategori. Rombak anggaran di bulan berikutnya!",
    color: "#BF616A",
    glowColor: "rgba(191, 97, 106, 0.5)",
    badge: "Hancur",
  };
}

/**
 * Format a Date to YYYY-MM
 */
export function getCurrentMonthStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Evaluate the Aegis Barrier for a user and specific month.
 * Recalculates overspends against category budgets, tracks minor/major cracks, and updates integrity.
 */
export function evaluateAegisBarrier(userId: string, targetMonthStr?: string) {
  const monthStr = targetMonthStr || getCurrentMonthStr();
  const [yearStr, monthNumStr] = monthStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);

  // 1. Get or create barrier for this user & month
  let barrier = db
    .select()
    .from(aegisBarriers)
    .where(
      and(eq(aegisBarriers.userId, userId), eq(aegisBarriers.month, monthStr))
    )
    .get();

  if (!barrier) {
    const newBarrierId = crypto.randomUUID();
    db.insert(aegisBarriers)
      .values({
        id: newBarrierId,
        userId,
        month: monthStr,
        integrity: 100,
        trophyAwarded: false,
        createdAt: new Date(),
      })
      .run();

    barrier = db
      .select()
      .from(aegisBarriers)
      .where(eq(aegisBarriers.id, newBarrierId))
      .get()!;
  }

  // 2. Fetch budgets for this month and year
  const userBudgets = db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.userId, userId),
        eq(budgets.month, month),
        eq(budgets.year, year)
      )
    )
    .all();

  // 3. Fetch expenses for this month date range
  const paddedMonth = month.toString().padStart(2, "0");
  const startDateStr = `${year}-${paddedMonth}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDateStr = `${year}-${paddedMonth}-${daysInMonth.toString().padStart(2, "0")}`;

  const monthExpenses = db
    .select({
      categoryId: transactions.categoryId,
      amount: transactions.amount,
      notes: transactions.notes,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "EXPENSE"),
        gte(transactions.date, startDateStr),
        lte(transactions.date, endDateStr)
      )
    )
    .all();

  const spentMap: Record<string, number> = {};
  for (const exp of monthExpenses) {
    if (exp.categoryId && !exp.notes?.startsWith("[Setor Tabungan]")) {
      spentMap[exp.categoryId] = (spentMap[exp.categoryId] || 0) + exp.amount;
    }
  }

  // 4. Fetch existing cracks for this barrier
  const existingCracks = db
    .select()
    .from(aegisCracks)
    .where(eq(aegisCracks.barrierId, barrier.id))
    .all();

  const cracksByCat = new Map<string, typeof aegisCracks.$inferSelect>();
  for (const c of existingCracks) {
    cracksByCat.set(c.categoryId, c);
  }

  const activeCategoryIdsInBudget = new Set<string>();

  // 5. Evaluate each budget category
  for (const b of userBudgets) {
    activeCategoryIdsInBudget.add(b.categoryId);
    const spent = spentMap[b.categoryId] || 0;
    const overspend = Math.max(0, spent - b.amountLimit);
    const existingCrack = cracksByCat.get(b.categoryId);

    if (overspend > 0) {
      const overspendPct = Math.round((overspend / b.amountLimit) * 100);
      const isMinor = overspendPct <= 10;

      if (existingCrack) {
        // Update existing crack
        // If it was minor and now becomes major, it can no longer be repaired!
        const repaired = isMinor ? existingCrack.repaired : false;
        const repairedAt = isMinor ? existingCrack.repairedAt : null;

        db.update(aegisCracks)
          .set({
            overspendAmount: overspend,
            overspendPercentage: overspendPct,
            isMinor,
            repaired,
            repairedAt,
          })
          .where(eq(aegisCracks.id, existingCrack.id))
          .run();
      } else {
        // Insert new crack
        db.insert(aegisCracks)
          .values({
            id: crypto.randomUUID(),
            barrierId: barrier.id,
            categoryId: b.categoryId,
            overspendAmount: overspend,
            overspendPercentage: overspendPct,
            isMinor,
            repaired: false,
            repairedAt: null,
            createdAt: new Date(),
          })
          .run();
      }
    } else {
      // No overspend: if crack exists and wasn't repaired, remove it
      if (existingCrack) {
        db.delete(aegisCracks).where(eq(aegisCracks.id, existingCrack.id)).run();
      }
    }
  }

  // 6. Calculate total integrity penalty
  // Minor crack (unrepaired): -15%
  // Major crack (permanent): -35%
  const currentCracks = db
    .select()
    .from(aegisCracks)
    .where(eq(aegisCracks.barrierId, barrier.id))
    .all();

  let penalty = 0;
  for (const c of currentCracks) {
    if (c.isMinor) {
      if (!c.repaired) {
        penalty += 15;
      }
    } else {
      penalty += 35;
    }
  }

  const finalIntegrity = Math.max(0, 100 - penalty);

  db.update(aegisBarriers)
    .set({ integrity: finalIntegrity })
    .where(eq(aegisBarriers.id, barrier.id))
    .run();

  barrier.integrity = finalIntegrity;
  return { barrier, cracks: currentCracks };
}

export interface EnrichedCrack {
  id: string;
  barrierId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  overspendAmount: number;
  overspendPercentage: number;
  isMinor: boolean;
  repaired: boolean;
  repairedAt: Date | null;
  canRepair: boolean;
}

export interface AegisSummary {
  barrierId: string;
  month: string;
  integrity: number;
  statusDetails: AegisStatusDetails;
  trophyAwarded: boolean;
  activeCracksCount: number;
  repairedCracksCount: number;
  canRepairAny: boolean;
  cracks: EnrichedCrack[];
}

/**
 * Get comprehensive Aegis Barrier summary for the user and month.
 */
export function getUserAegisSummary(
  userId: string,
  targetMonthStr?: string
): AegisSummary {
  const monthStr = targetMonthStr || getCurrentMonthStr();
  const { barrier, cracks } = evaluateAegisBarrier(userId, monthStr);

  // Fetch category info for cracks
  const userCategories = db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .all();

  const catMap = new Map<string, typeof categories.$inferSelect>();
  for (const c of userCategories) {
    catMap.set(c.id, c);
  }

  let activeCracksCount = 0;
  let repairedCracksCount = 0;
  let canRepairAny = false;

  const enrichedCracks: EnrichedCrack[] = cracks.map((c) => {
    const cat = catMap.get(c.categoryId);
    const canRepair = c.isMinor && !c.repaired;

    if (c.repaired) {
      repairedCracksCount++;
    } else {
      activeCracksCount++;
    }

    if (canRepair) {
      canRepairAny = true;
    }

    return {
      id: c.id,
      barrierId: c.barrierId,
      categoryId: c.categoryId,
      categoryName: cat?.name || "Kategori Terhapus",
      categoryIcon: cat?.icon || "alert-circle",
      categoryColor: cat?.color || "#BF616A",
      overspendAmount: c.overspendAmount,
      overspendPercentage: c.overspendPercentage,
      isMinor: c.isMinor,
      repaired: c.repaired,
      repairedAt: c.repairedAt ? new Date(c.repairedAt) : null,
      canRepair,
    };
  });

  const statusDetails = getAegisStatusDetails(barrier.integrity);

  return {
    barrierId: barrier.id,
    month: barrier.month,
    integrity: barrier.integrity,
    statusDetails,
    trophyAwarded: barrier.trophyAwarded,
    activeCracksCount,
    repairedCracksCount,
    canRepairAny,
    cracks: enrichedCracks,
  };
}

/**
 * Repair a minor crack using 1 Frost Shard (Rune of Mending).
 * Major cracks (> 10% overspend) cannot be repaired.
 */
export function repairMinorCrack(
  userId: string,
  crackId: string
): {
  success: boolean;
  newIntegrity?: number;
  message?: string;
  error?: string;
} {
  // 1. Fetch crack and verify ownership via barrier
  const crack = db
    .select({
      id: aegisCracks.id,
      barrierId: aegisCracks.barrierId,
      isMinor: aegisCracks.isMinor,
      repaired: aegisCracks.repaired,
      userId: aegisBarriers.userId,
      month: aegisBarriers.month,
    })
    .from(aegisCracks)
    .innerJoin(aegisBarriers, eq(aegisCracks.barrierId, aegisBarriers.id))
    .where(and(eq(aegisCracks.id, crackId), eq(aegisBarriers.userId, userId)))
    .get();

  if (!crack) {
    return { success: false, error: "Data keretakan perisai tidak ditemukan." };
  }

  if (!crack.isMinor) {
    return {
      success: false,
      error: "Keretakan mayor (> 10% overspend) bersifat permanen dan tidak dapat diperbaiki bulan ini.",
    };
  }

  if (crack.repaired) {
    return {
      success: false,
      error: "Keretakan ini sudah diperbaiki sebelumnya.",
    };
  }

  // 2. Consume 1 Frost Shard (FIFO)
  const redeemResult = redeemFrostShards(userId, 1);
  if (!redeemResult.success) {
    return {
      success: false,
      error: "Dibutuhkan 1 Frost Shard aktif untuk menambal keretakan perisai ini.",
    };
  }

  // 3. Mark crack as repaired
  db.update(aegisCracks)
    .set({
      repaired: true,
      repairedAt: new Date(),
    })
    .where(eq(aegisCracks.id, crack.id))
    .run();

  // 4. Recalculate barrier integrity
  const { barrier } = evaluateAegisBarrier(userId, crack.month);

  return {
    success: true,
    newIntegrity: barrier.integrity,
    message: "Rune of Mending berhasil digunakan! Keretakan perisai telah diperbaiki.",
  };
}

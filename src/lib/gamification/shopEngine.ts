import {
  db,
  vaultShopItems,
  vaultRedemptions,
} from "@/lib/db";
import { eq, and, isNull, or, desc } from "drizzle-orm";
import crypto from "crypto";
import { redeemFrostShards, getUserFrostSummary } from "./frostEngine";

export interface ShopItemMetadata {
  color?: string;
  badge?: string;
  titleKey?: string;
  borderEffect?: string;
}

export const GLOBAL_SHOP_ITEMS: {
  id: string;
  type: "virtual";
  name: string;
  description: string;
  shardCost: number;
  icon: string;
  metadata: string;
}[] = [
  {
    id: "global-rune-bearer",
    type: "virtual",
    name: "Frost Rune Bearer",
    description: "Gelar & Lencana Kehormatan 'ᚱ Rune Bearer' untuk profil Nordik kamu.",
    shardCost: 5,
    icon: "award",
    metadata: JSON.stringify({
      badge: "ᚱ Rune Bearer",
      color: "#88C0D0",
      titleKey: "RUNE_BEARER",
    }),
  },
  {
    id: "global-aurora-avatar",
    type: "virtual",
    name: "Aura Aurora Borealis",
    description: "Efek animasi bingkai avatar berpendar hijau & sian kutub utara.",
    shardCost: 10,
    icon: "sparkles",
    metadata: JSON.stringify({
      borderEffect: "aurora_glow",
      color: "#A3BE8C",
    }),
  },
  {
    id: "global-valhalla-crest",
    type: "virtual",
    name: "Crest of Valhalla",
    description: "Ornamen perisai emas legendaris penanda integritas tabungan tinggi.",
    shardCost: 15,
    icon: "shield",
    metadata: JSON.stringify({
      badge: "⚔️ Valhalla Crest",
      color: "#EBCB8B",
    }),
  },
  {
    id: "global-midgard-guardian",
    type: "virtual",
    name: "Guardian of Midgard",
    description: "Gelar prestise tertinggi bagi master keuangan yang tak tertandingi.",
    shardCost: 20,
    icon: "crown",
    metadata: JSON.stringify({
      badge: "🛡️ Midgard Guardian",
      color: "#81A1C1",
      titleKey: "MIDGARD_GUARDIAN",
    }),
  },
];

/**
 * Ensures global system items are present in the database.
 */
export function seedDefaultShopCatalog() {
  const existingGlobal = db
    .select({ id: vaultShopItems.id })
    .from(vaultShopItems)
    .where(isNull(vaultShopItems.userId))
    .all();

  const existingIds = new Set(existingGlobal.map((i) => i.id));

  for (const item of GLOBAL_SHOP_ITEMS) {
    if (!existingIds.has(item.id)) {
      try {
        db.insert(vaultShopItems)
          .values({
            id: item.id,
            userId: null,
            type: item.type,
            name: item.name,
            description: item.description,
            shardCost: item.shardCost,
            userDefinedCap: null,
            isSeasonal: false,
            availableUntil: null,
            icon: item.icon,
            metadata: item.metadata,
            createdAt: new Date(),
          })
          .run();
      } catch {
        // Ignore duplicate on concurrent startup
      }
    }
  }
}

export interface EnrichedShopItem {
  id: string;
  userId: string | null;
  type: "voucher" | "virtual";
  name: string;
  description: string | null;
  shardCost: number;
  userDefinedCap: number | null;
  isSeasonal: boolean;
  icon: string;
  metadata: ShopItemMetadata | null;
  isOwned?: boolean; // For virtual items
  canAfford: boolean;
}

/**
 * Fetch full shop catalog for a user:
 * - Global virtual items (cosmetics/titles)
 * - User-defined self-reward vouchers
 * - User's current Frost Shard balance & affordability
 */
export function getUserShopCatalog(userId: string) {
  seedDefaultShopCatalog();

  const userSummary = getUserFrostSummary(userId);
  const currentShards = userSummary.balance;

  // Fetch all applicable shop items
  const items = db
    .select()
    .from(vaultShopItems)
    .where(or(isNull(vaultShopItems.userId), eq(vaultShopItems.userId, userId)))
    .orderBy(desc(vaultShopItems.createdAt))
    .all();

  // Fetch user's existing redemptions to check owned virtual items
  const userRedemptions = db
    .select()
    .from(vaultRedemptions)
    .where(eq(vaultRedemptions.userId, userId))
    .all();

  const ownedVirtualItemIds = new Set(
    userRedemptions.map((r) => r.itemId)
  );

  const vouchers: EnrichedShopItem[] = [];
  const virtualItems: EnrichedShopItem[] = [];

  for (const item of items) {
    let parsedMetadata: ShopItemMetadata | null = null;
    if (item.metadata) {
      try {
        parsedMetadata = JSON.parse(item.metadata);
      } catch {}
    }

    const isOwned = item.type === "virtual" && ownedVirtualItemIds.has(item.id);
    const canAfford = currentShards >= item.shardCost;

    const enriched: EnrichedShopItem = {
      id: item.id,
      userId: item.userId,
      type: item.type,
      name: item.name,
      description: item.description,
      shardCost: item.shardCost,
      userDefinedCap: item.userDefinedCap,
      isSeasonal: item.isSeasonal,
      icon: item.icon,
      metadata: parsedMetadata,
      isOwned,
      canAfford,
    };

    if (item.type === "voucher") {
      vouchers.push(enriched);
    } else {
      virtualItems.push(enriched);
    }
  }

  return {
    shardBalance: currentShards,
    vouchers,
    virtualItems,
  };
}

/**
 * Create a new user-defined self-reward voucher (Type A).
 */
export function createUserVoucher(
  userId: string,
  data: {
    name: string;
    description?: string;
    shardCost: number;
    userDefinedCap: number;
    icon?: string;
  }
) {
  const { name, description, shardCost, userDefinedCap, icon } = data;

  if (!name || !name.trim()) {
    throw new Error("Nama voucher hadiah wajib diisi.");
  }

  if (!shardCost || shardCost <= 0) {
    throw new Error("Biaya Frost Shard harus minimal 1.");
  }

  if (!userDefinedCap || userDefinedCap <= 0) {
    throw new Error("Nominal batas belanja (cap) harus lebih dari Rp 0.");
  }

  const newVoucherId = crypto.randomUUID();
  const newVoucher = {
    id: newVoucherId,
    userId,
    type: "voucher" as const,
    name: name.trim(),
    description: description?.trim() || null,
    shardCost: parseInt(shardCost.toString(), 10),
    userDefinedCap: parseInt(userDefinedCap.toString(), 10),
    isSeasonal: false,
    availableUntil: null,
    icon: icon || "gift",
    metadata: null,
    createdAt: new Date(),
  };

  db.insert(vaultShopItems).values(newVoucher).run();
  return newVoucher;
}

/**
 * Delete a user-defined voucher template.
 */
export function deleteUserVoucher(userId: string, voucherId: string) {
  const existing = db
    .select()
    .from(vaultShopItems)
    .where(
      and(
        eq(vaultShopItems.id, voucherId),
        eq(vaultShopItems.userId, userId)
      )
    )
    .get();

  if (!existing) {
    throw new Error("Voucher tidak ditemukan atau bukan milik Anda.");
  }

  db.delete(vaultShopItems).where(eq(vaultShopItems.id, voucherId)).run();
  return { success: true };
}

/**
 * Redeem an item from The Vault Shop:
 * - Deducts shards via strict FIFO
 * - If virtual: ensures not already owned
 * - Adds record to vaultRedemptions
 */
export function redeemShopItem(userId: string, itemId: string) {
  seedDefaultShopCatalog();

  // 1. Fetch item
  const item = db
    .select()
    .from(vaultShopItems)
    .where(
      and(
        eq(vaultShopItems.id, itemId),
        or(isNull(vaultShopItems.userId), eq(vaultShopItems.userId, userId))
      )
    )
    .get();

  if (!item) {
    return { success: false, error: "Item toko tidak ditemukan." };
  }

  // 2. Check if virtual and already owned
  if (item.type === "virtual") {
    const alreadyOwned = db
      .select({ id: vaultRedemptions.id })
      .from(vaultRedemptions)
      .where(
        and(
          eq(vaultRedemptions.userId, userId),
          eq(vaultRedemptions.itemId, itemId)
        )
      )
      .get();

    if (alreadyOwned) {
      return {
        success: false,
        error: "Item virtual ini sudah ada di koleksi inventaris Anda.",
      };
    }
  }

  // 3. Deduct Frost Shards via FIFO
  const redeemResult = redeemFrostShards(userId, item.shardCost);
  if (!redeemResult.success) {
    return {
      success: false,
      error: redeemResult.error || "Jumlah Frost Shard tidak mencukupi.",
    };
  }

  // 4. Record redemption
  const redemptionId = crypto.randomUUID();
  const newRedemption = {
    id: redemptionId,
    userId,
    itemId: item.id,
    shardCost: item.shardCost,
    actualSpentAmount: null,
    transactionId: null,
    status: "ACTIVE" as const,
    redeemedAt: new Date(),
  };

  db.insert(vaultRedemptions).values(newRedemption).run();

  const userSummary = getUserFrostSummary(userId);

  return {
    success: true,
    redemptionId,
    item,
    remainingShards: userSummary.balance,
  };
}

export interface EnrichedRedemption {
  id: string;
  itemId: string;
  name: string;
  type: "voucher" | "virtual";
  description: string | null;
  shardCost: number;
  userDefinedCap: number | null;
  actualSpentAmount: number | null;
  transactionId: string | null;
  status: "ACTIVE" | "USED" | "EXPIRED";
  icon: string;
  metadata: ShopItemMetadata | null;
  redeemedAt: Date;
}

/**
 * Fetch full inventory of the user:
 * - Active Vouchers (ready to be spent guilt-free)
 * - Used Vouchers history
 * - Virtual Perks & Ornaments owned
 */
export function getUserInventory(userId: string) {
  const redemptions = db
    .select({
      id: vaultRedemptions.id,
      itemId: vaultRedemptions.itemId,
      shardCost: vaultRedemptions.shardCost,
      actualSpentAmount: vaultRedemptions.actualSpentAmount,
      transactionId: vaultRedemptions.transactionId,
      status: vaultRedemptions.status,
      redeemedAt: vaultRedemptions.redeemedAt,
      name: vaultShopItems.name,
      type: vaultShopItems.type,
      description: vaultShopItems.description,
      userDefinedCap: vaultShopItems.userDefinedCap,
      icon: vaultShopItems.icon,
      metadata: vaultShopItems.metadata,
    })
    .from(vaultRedemptions)
    .innerJoin(vaultShopItems, eq(vaultRedemptions.itemId, vaultShopItems.id))
    .where(eq(vaultRedemptions.userId, userId))
    .orderBy(desc(vaultRedemptions.redeemedAt))
    .all();

  const activeVouchers: EnrichedRedemption[] = [];
  const usedVouchers: EnrichedRedemption[] = [];
  const virtualCollection: EnrichedRedemption[] = [];

  for (const r of redemptions) {
    let parsedMetadata: ShopItemMetadata | null = null;
    if (r.metadata) {
      try {
        parsedMetadata = JSON.parse(r.metadata);
      } catch {}
    }

    const item: EnrichedRedemption = {
      id: r.id,
      itemId: r.itemId,
      name: r.name,
      type: r.type,
      description: r.description,
      shardCost: r.shardCost,
      userDefinedCap: r.userDefinedCap,
      actualSpentAmount: r.actualSpentAmount,
      transactionId: r.transactionId,
      status: r.status,
      icon: r.icon,
      metadata: parsedMetadata,
      redeemedAt: new Date(r.redeemedAt),
    };

    if (r.type === "voucher") {
      if (r.status === "ACTIVE") {
        activeVouchers.push(item);
      } else {
        usedVouchers.push(item);
      }
    } else {
      virtualCollection.push(item);
    }
  }

  return {
    activeVouchers,
    usedVouchers,
    virtualCollection,
  };
}

/**
 * Link an active voucher redemption to an actual transaction.
 * Marks voucher status as "USED" and records the actual spent amount.
 */
export function applyVoucherToTransaction(
  userId: string,
  redemptionId: string,
  transactionId: string,
  actualSpentAmount: number
) {
  const redemption = db
    .select()
    .from(vaultRedemptions)
    .where(
      and(
        eq(vaultRedemptions.id, redemptionId),
        eq(vaultRedemptions.userId, userId)
      )
    )
    .get();

  if (!redemption) {
    throw new Error("Data penukaran voucher tidak ditemukan.");
  }

  if (redemption.status !== "ACTIVE") {
    throw new Error("Voucher ini sudah digunakan atau tidak lagi aktif.");
  }

  db.update(vaultRedemptions)
    .set({
      status: "USED",
      transactionId,
      actualSpentAmount,
    })
    .where(eq(vaultRedemptions.id, redemptionId))
    .run();

  return { success: true };
}

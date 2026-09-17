import { db, frostShards, transactions, categories } from "@/lib/db";
import { eq, and, gte, lte, asc, sql } from "drizzle-orm";
import crypto from "crypto";
import { toLocalDateString } from "@/lib/utils/dateRange";

/**
 * Add or subtract calendar days to/from a YYYY-MM-DD string in local time.
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toLocalDateString(date);
}

/**
 * Generate an array of date strings [YYYY-MM-DD] inclusive between fromDate and toDate.
 */
export function getDateRangeList(fromDateStr: string, toDateStr: string): string[] {
  const dates: string[] = [];
  let current = fromDateStr;
  while (current <= toDateStr) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

/**
 * Check if a specific date for a user qualifies as a Frost Day.
 * Rule: NO expenses on that date with spendingType 'consumptive' or 'self_reward'.
 * Essential, bill, income, transfer, or 0 expenses all qualify as Frost Days.
 */
export function isDateFrostDay(userId: string, dateStr: string): boolean {
  const expenseTxs = db
    .select({
      id: transactions.id,
      spendingType: categories.spendingType,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.date, dateStr),
        eq(transactions.type, "EXPENSE")
      )
    )
    .all();

  // If any expense has spendingType 'consumptive' or 'self_reward' (or null/unclassified), it breaks the Frost Day
  const hasConsumptiveExpense = expenseTxs.some(
    (tx) =>
      !tx.spendingType ||
      tx.spendingType === "consumptive" ||
      tx.spendingType === "self_reward"
  );

  return !hasConsumptiveExpense;
}

/**
 * Synchronize a single date for a user:
 * - If not a Frost Day: revoke/delete any unredeemed shard for that date.
 * - If it IS a Frost Day and date <= today: issue 1 frost shard (if not already issued).
 */
export function syncFrostShardForDate(
  userId: string,
  dateStr: string,
  customTodayStr?: string
): { date: string; isFrostDay: boolean; action: "awarded" | "revoked" | "kept" | "none" } {
  const todayStr = customTodayStr || toLocalDateString(new Date());
  const isFrost = isDateFrostDay(userId, dateStr);

  const existingShard = db
    .select()
    .from(frostShards)
    .where(and(eq(frostShards.userId, userId), eq(frostShards.date, dateStr)))
    .get();

  if (!isFrost) {
    // If consumptive expense occurred and an unredeemed shard exists, revoke it
    if (existingShard && !existingShard.redeemed) {
      db.delete(frostShards)
        .where(
          and(
            eq(frostShards.id, existingShard.id),
            eq(frostShards.redeemed, false)
          )
        )
        .run();
      return { date: dateStr, isFrostDay: false, action: "revoked" };
    }
    return { date: dateStr, isFrostDay: false, action: "none" };
  }

  // It IS a Frost Day:
  // We award shards for dates up to today (including today, with dynamic revocation if they spend later today)
  if (dateStr <= todayStr) {
    if (!existingShard) {
      const expiresAt = addDays(dateStr, 30);
      db.insert(frostShards)
        .values({
          id: crypto.randomUUID(),
          userId,
          date: dateStr,
          expiresAt,
          redeemed: false,
          redeemedAt: null,
          createdAt: new Date(),
        })
        .run();
      return { date: dateStr, isFrostDay: true, action: "awarded" };
    }
    return { date: dateStr, isFrostDay: true, action: "kept" };
  }

  return { date: dateStr, isFrostDay: true, action: "none" };
}

/**
 * High-performance batch synchronization for the past N days.
 * Performs aggregated queries to avoid N+1 queries.
 */
export function syncUserFrostShards(
  userId: string,
  daysLookback: number = 30,
  customTodayStr?: string
) {
  const todayStr = customTodayStr || toLocalDateString(new Date());
  const startDateStr = addDays(todayStr, -(daysLookback - 1));

  // 1. Fetch all expense transactions in the date range
  const expenseTxs = db
    .select({
      id: transactions.id,
      date: transactions.date,
      spendingType: categories.spendingType,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, startDateStr),
        lte(transactions.date, todayStr),
        eq(transactions.type, "EXPENSE")
      )
    )
    .all();

  // Map dates with consumptive expenses
  const datesWithConsumptiveSpending = new Set<string>();
  for (const tx of expenseTxs) {
    if (
      !tx.spendingType ||
      tx.spendingType === "consumptive" ||
      tx.spendingType === "self_reward"
    ) {
      datesWithConsumptiveSpending.add(tx.date);
    }
  }

  // 2. Fetch existing shards in date range
  const existingShards = db
    .select()
    .from(frostShards)
    .where(
      and(
        eq(frostShards.userId, userId),
        gte(frostShards.date, startDateStr),
        lte(frostShards.date, todayStr)
      )
    )
    .all();

  const shardsByDate = new Map<string, typeof frostShards.$inferSelect>();
  for (const shard of existingShards) {
    shardsByDate.set(shard.date, shard);
  }

  // 3. Process each date in the window
  const allDates = getDateRangeList(startDateStr, todayStr);
  const toInsert: (typeof frostShards.$inferInsert)[] = [];
  const toDeleteIds: string[] = [];

  for (const d of allDates) {
    const isConsumptive = datesWithConsumptiveSpending.has(d);
    const existing = shardsByDate.get(d);

    if (isConsumptive) {
      // If shard exists and not redeemed, mark for removal
      if (existing && !existing.redeemed) {
        toDeleteIds.push(existing.id);
      }
    } else {
      // No consumptive spending: Frost Day!
      if (!existing) {
        toInsert.push({
          id: crypto.randomUUID(),
          userId,
          date: d,
          expiresAt: addDays(d, 30),
          redeemed: false,
          redeemedAt: null,
          createdAt: new Date(),
        });
      }
    }
  }

  // Execute batch inserts & deletes if any
  if (toDeleteIds.length > 0) {
    db.delete(frostShards)
      .where(
        and(
          eq(frostShards.userId, userId),
          sql`${frostShards.id} IN (${sql.join(
            toDeleteIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        )
      )
      .run();
  }

  if (toInsert.length > 0) {
    // Insert individually or in chunks for better-sqlite3
    for (const item of toInsert) {
      try {
        db.insert(frostShards).values(item).run();
      } catch {
        // Ignore duplicate key collision if concurrent
      }
    }
  }
}

export interface FrostDayHistoryItem {
  date: string;
  isFrostDay: boolean;
  isToday: boolean;
  status: "frost" | "spent" | "pending";
  expiresAt: string | null;
  redeemed: boolean;
}

export interface FrostSummary {
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  expiringSoon: number;
  expiredCount: number;
  currentStreak: number;
  longestStreak: number;
  todayStatus: "no_spend_active" | "consumptive_spent";
  history: FrostDayHistoryItem[];
}

/**
 * Get comprehensive Frost Shard summary for the authenticated user:
 * - Active unredeemed balance
 * - Streak calculation
 * - Expiring soon (within 7 days)
 * - 30-day visual history
 */
export function getUserFrostSummary(
  userId: string,
  customTodayStr?: string
): FrostSummary {
  const todayStr = customTodayStr || toLocalDateString(new Date());

  // Ensure last 30 days are synced
  syncUserFrostShards(userId, 30, todayStr);

  const in7DaysStr = addDays(todayStr, 7);

  // Query all shards for user
  const allShards = db
    .select()
    .from(frostShards)
    .where(eq(frostShards.userId, userId))
    .all();

  let balance = 0;
  const totalEarned = allShards.length;
  let totalRedeemed = 0;
  let expiringSoon = 0;
  let expiredCount = 0;

  const shardsByDate = new Map<string, typeof frostShards.$inferSelect>();

  for (const s of allShards) {
    shardsByDate.set(s.date, s);

    if (s.redeemed) {
      totalRedeemed++;
    } else {
      if (s.expiresAt < todayStr) {
        expiredCount++;
      } else {
        // Active shard
        balance++;
        if (s.expiresAt <= in7DaysStr) {
          expiringSoon++;
        }
      }
    }
  }

  // Check today's status
  const todayIsFrost = isDateFrostDay(userId, todayStr);
  const todayStatus: "no_spend_active" | "consumptive_spent" = todayIsFrost
    ? "no_spend_active"
    : "consumptive_spent";

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = todayStr;

  // If today is a Frost Day, include today in the streak
  if (todayIsFrost) {
    currentStreak++;
    checkDate = addDays(checkDate, -1);
  } else {
    // If today had consumptive spending, streak is 0
    checkDate = addDays(checkDate, -1);
  }

  // Count backwards
  if (todayIsFrost) {
    while (true) {
      const isPastFrost = isDateFrostDay(userId, checkDate);
      if (isPastFrost) {
        currentStreak++;
        checkDate = addDays(checkDate, -1);
      } else {
        break;
      }
      // Safety guard against infinite loops
      if (currentStreak > 365) break;
    }
  }

  // Calculate longest streak over last 90 days
  const streakHistoryRange = getDateRangeList(addDays(todayStr, -89), todayStr);
  let longestStreak = 0;
  let runningStreak = 0;

  for (const d of streakHistoryRange) {
    const isFrost = isDateFrostDay(userId, d);
    if (isFrost) {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }

  // Build 30-day visual history
  const historyDates = getDateRangeList(addDays(todayStr, -29), todayStr);
  const history: FrostDayHistoryItem[] = historyDates.map((d) => {
    const shard = shardsByDate.get(d);
    const isToday = d === todayStr;
    const isFrost = isDateFrostDay(userId, d);

    let status: "frost" | "spent" | "pending" = isFrost ? "frost" : "spent";
    if (isToday && isFrost) {
      status = "frost"; // active no-spend day!
    }

    return {
      date: d,
      isFrostDay: isFrost,
      isToday,
      status,
      expiresAt: shard?.expiresAt || null,
      redeemed: !!shard?.redeemed,
    };
  });

  return {
    balance,
    totalEarned,
    totalRedeemed,
    expiringSoon,
    expiredCount,
    currentStreak,
    longestStreak,
    todayStatus,
    history,
  };
}

/**
 * Redeem Frost Shards using strict FIFO (First-In, First-Out) by expiration date.
 * Consumes the shards closest to expiring first.
 */
export function redeemFrostShards(
  userId: string,
  count: number,
  customTodayStr?: string
): {
  success: boolean;
  redeemedCount?: number;
  redeemedShardIds?: string[];
  error?: string;
} {
  if (count <= 0) {
    return { success: false, error: "Jumlah penukaran harus lebih dari 0." };
  }

  const todayStr = customTodayStr || toLocalDateString(new Date());

  // Fetch available active shards ordered by expiration ascending (FIFO)
  const availableShards = db
    .select()
    .from(frostShards)
    .where(
      and(
        eq(frostShards.userId, userId),
        eq(frostShards.redeemed, false),
        gte(frostShards.expiresAt, todayStr)
      )
    )
    .orderBy(asc(frostShards.expiresAt))
    .limit(count)
    .all();

  if (availableShards.length < count) {
    return {
      success: false,
      error: `Jumlah Frost Shard tidak mencukupi (Tersedia: ${availableShards.length}, Dibutuhkan: ${count}).`,
    };
  }

  const shardIds = availableShards.map((s) => s.id);
  const now = new Date();

  db.update(frostShards)
    .set({
      redeemed: true,
      redeemedAt: now,
    })
    .where(
      and(
        eq(frostShards.userId, userId),
        sql`${frostShards.id} IN (${sql.join(
          shardIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      )
    )
    .run();

  return {
    success: true,
    redeemedCount: shardIds.length,
    redeemedShardIds: shardIds,
  };
}

/**
 * Reactive listener: Call whenever a transaction is created, updated, or deleted.
 * Syncs the specific date immediately.
 */
export function onTransactionChanged(
  userId: string,
  dateStr: string,
  customTodayStr?: string
) {
  try {
    syncFrostShardForDate(userId, dateStr, customTodayStr);
  } catch (err) {
    console.error(`[FrostEngine] Error syncing date ${dateStr} for user ${userId}:`, err);
  }
}

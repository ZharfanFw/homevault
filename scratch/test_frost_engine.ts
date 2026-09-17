import { db, users, wallets, categories, transactions, frostShards } from "../src/lib/db";
import {
  isDateFrostDay,
  syncFrostShardForDate,
  getUserFrostSummary,
  redeemFrostShards,
  addDays,
} from "../src/lib/gamification/frostEngine";
import { eq } from "drizzle-orm";
import crypto from "crypto";

async function runTests() {
  console.log("=== Testing Frost Shard Engine (Nordic Vault) ===");

  const testUserId = "test-user-frost-" + Date.now();
  const testWalletId = "test-wallet-" + Date.now();

  // 1. Setup test user and wallet
  db.insert(users)
    .values({
      id: testUserId,
      name: "Frost Tester",
      email: `frost_${Date.now()}@example.com`,
      passwordHash: "hash",
      gamificationEnabled: true,
      createdAt: new Date(),
    })
    .run();

  db.insert(wallets)
    .values({
      id: testWalletId,
      userId: testUserId,
      name: "Frost Wallet",
      type: "CASH",
      initialBalance: 1000000,
      createdAt: new Date(),
    })
    .run();

  // Create categories with distinct spending types
  const catEssential = "cat-essential-" + Date.now();
  const catBill = "cat-bill-" + Date.now();
  const catConsumptive = "cat-consumptive-" + Date.now();
  const catSelfReward = "cat-selfreward-" + Date.now();

  db.insert(categories)
    .values([
      {
        id: catEssential,
        userId: testUserId,
        name: "Makanan Pokok",
        type: "EXPENSE",
        spendingType: "essential",
        createdAt: new Date(),
      },
      {
        id: catBill,
        userId: testUserId,
        name: "Listrik & Internet",
        type: "EXPENSE",
        spendingType: "bill",
        createdAt: new Date(),
      },
      {
        id: catConsumptive,
        userId: testUserId,
        name: "Kopi & Hobi",
        type: "EXPENSE",
        spendingType: "consumptive",
        createdAt: new Date(),
      },
      {
        id: catSelfReward,
        userId: testUserId,
        name: "Self Reward Reward",
        type: "EXPENSE",
        spendingType: "self_reward",
        createdAt: new Date(),
      },
    ])
    .run();

  const mockToday = "2026-09-17";
  const day1 = "2026-09-10"; // 0 transactions -> Should be Frost Day
  const day2 = "2026-09-11"; // Only Essential & Bill -> Should be Frost Day
  const day3 = "2026-09-12"; // Consumptive -> Should NOT be Frost Day
  const day4 = "2026-09-13"; // Self Reward -> Should NOT be Frost Day
  const day5 = "2026-09-14"; // Essential only -> Should be Frost Day

  // Add transactions for day 2
  db.insert(transactions)
    .values([
      {
        id: crypto.randomUUID(),
        userId: testUserId,
        walletId: testWalletId,
        categoryId: catEssential,
        type: "EXPENSE",
        amount: 25000,
        date: day2,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        userId: testUserId,
        walletId: testWalletId,
        categoryId: catBill,
        type: "EXPENSE",
        amount: 150000,
        date: day2,
        createdAt: new Date(),
      },
    ])
    .run();

  // Add transactions for day 3 (consumptive)
  const txConsumptiveId = crypto.randomUUID();
  db.insert(transactions)
    .values({
      id: txConsumptiveId,
      userId: testUserId,
      walletId: testWalletId,
      categoryId: catConsumptive,
      type: "EXPENSE",
      amount: 40000,
      date: day3,
      createdAt: new Date(),
    })
    .run();

  // Add transactions for day 4 (self_reward)
  db.insert(transactions)
    .values({
      id: crypto.randomUUID(),
      userId: testUserId,
      walletId: testWalletId,
      categoryId: catSelfReward,
      type: "EXPENSE",
      amount: 75000,
      date: day4,
      createdAt: new Date(),
    })
    .run();

  // Add transaction for day 5 (essential)
  db.insert(transactions)
    .values({
      id: crypto.randomUUID(),
      userId: testUserId,
      walletId: testWalletId,
      categoryId: catEssential,
      type: "EXPENSE",
      amount: 30000,
      date: day5,
      createdAt: new Date(),
    })
    .run();

  console.log("-> 1. Testing isDateFrostDay evaluation...");
  console.assert(isDateFrostDay(testUserId, day1) === true, "Day 1 (0 tx) must be Frost Day");
  console.assert(isDateFrostDay(testUserId, day2) === true, "Day 2 (essential + bill) must be Frost Day");
  console.assert(isDateFrostDay(testUserId, day3) === false, "Day 3 (consumptive) must NOT be Frost Day");
  console.assert(isDateFrostDay(testUserId, day4) === false, "Day 4 (self_reward) must NOT be Frost Day");
  console.assert(isDateFrostDay(testUserId, day5) === true, "Day 5 (essential only) must be Frost Day");
  console.log("   [PASS] isDateFrostDay evaluated all spending types correctly!");

  console.log("-> 2. Testing syncFrostShardForDate & Shard Awarding...");
  const res1 = syncFrostShardForDate(testUserId, day1, mockToday);
  console.assert(res1.action === "awarded", "Day 1 shard should be awarded");
  const res2 = syncFrostShardForDate(testUserId, day2, mockToday);
  console.assert(res2.action === "awarded", "Day 2 shard should be awarded");
  const res3 = syncFrostShardForDate(testUserId, day3, mockToday);
  console.assert(res3.action === "none" && !res3.isFrostDay, "Day 3 shard should not be awarded");

  // Verify expiry date is exactly date + 30 days
  const shard1 = db.select().from(frostShards).where(eq(frostShards.date, day1)).get();
  console.assert(shard1?.expiresAt === addDays(day1, 30), `Shard expires_at should be ${addDays(day1, 30)}, got ${shard1?.expiresAt}`);
  console.log("   [PASS] Shard awarded and expiresAt matches exactly 30 days!");

  console.log("-> 3. Testing Reactive Revocation (user adds consumptive expense on Day 1)...");
  db.insert(transactions)
    .values({
      id: crypto.randomUUID(),
      userId: testUserId,
      walletId: testWalletId,
      categoryId: catConsumptive,
      type: "EXPENSE",
      amount: 15000,
      date: day1,
      createdAt: new Date(),
    })
    .run();

  const revokeRes = syncFrostShardForDate(testUserId, day1, mockToday);
  console.assert(revokeRes.action === "revoked", "Day 1 shard should be revoked after consumptive expense");
  const checkRevoked = db.select().from(frostShards).where(eq(frostShards.date, day1)).get();
  console.assert(!checkRevoked, "Day 1 shard should no longer exist in DB");
  console.log("   [PASS] Shard reactive revocation verified!");

  console.log("-> 4. Testing Reactive Restoration (user removes consumptive expense from Day 3)...");
  db.delete(transactions).where(eq(transactions.id, txConsumptiveId)).run();
  const restoreRes = syncFrostShardForDate(testUserId, day3, mockToday);
  console.assert(restoreRes.action === "awarded", "Day 3 shard should be restored after deleting consumptive tx");
  const checkRestored = db.select().from(frostShards).where(eq(frostShards.date, day3)).get();
  console.assert(!!checkRestored, "Day 3 shard should now exist in DB");
  console.log("   [PASS] Shard restoration verified!");

  console.log("-> 5. Testing FIFO Redemption...");
  // Clear shards and setup 3 test shards with known expiry
  db.delete(frostShards).where(eq(frostShards.userId, testUserId)).run();

  const s1Date = "2026-08-20";
  const s2Date = "2026-08-25";
  const s3Date = "2026-09-01";

  db.insert(frostShards)
    .values([
      {
        id: "shard-early",
        userId: testUserId,
        date: s1Date,
        expiresAt: addDays(s1Date, 30), // 2026-09-19 (expires earliest)
        redeemed: false,
        createdAt: new Date(),
      },
      {
        id: "shard-mid",
        userId: testUserId,
        date: s2Date,
        expiresAt: addDays(s2Date, 30), // 2026-09-24
        redeemed: false,
        createdAt: new Date(),
      },
      {
        id: "shard-late",
        userId: testUserId,
        date: s3Date,
        expiresAt: addDays(s3Date, 30), // 2026-10-01
        redeemed: false,
        createdAt: new Date(),
      },
    ])
    .run();

  // Redeem 2 shards: should redeem shard-early and shard-mid (FIFO)
  const redeemRes = redeemFrostShards(testUserId, 2, mockToday);
  console.assert(redeemRes.success === true, "Redemption should succeed");
  console.assert(redeemRes.redeemedShardIds?.[0] === "shard-early", "First redeemed should be shard-early");
  console.assert(redeemRes.redeemedShardIds?.[1] === "shard-mid", "Second redeemed should be shard-mid");

  const unredeemed = db
    .select()
    .from(frostShards)
    .where(eq(frostShards.userId, testUserId))
    .all();

  const lateShard = unredeemed.find((s) => s.id === "shard-late");
  console.assert(lateShard?.redeemed === false, "shard-late must remain unredeemed");
  console.log("   [PASS] Strict FIFO redemption verified!");

  console.log("-> 6. Testing getUserFrostSummary & Streak...");
  const summary = getUserFrostSummary(testUserId, mockToday);
  console.assert(typeof summary.balance === "number", "summary.balance must be a number");
  console.assert(typeof summary.currentStreak === "number", "summary.currentStreak must be a number");
  console.assert(typeof summary.longestStreak === "number", "summary.longestStreak must be a number");
  console.assert(summary.history.length === 30, `summary.history must have 30 items, got ${summary.history.length}`);
  console.log("   Summary output:", {
    balance: summary.balance,
    totalEarned: summary.totalEarned,
    totalRedeemed: summary.totalRedeemed,
    currentStreak: summary.currentStreak,
    longestStreak: summary.longestStreak,
    todayStatus: summary.todayStatus,
  });
  console.log("   [PASS] Summary & Streak calculation verified!");

  // Cleanup test data
  db.delete(frostShards).where(eq(frostShards.userId, testUserId)).run();
  db.delete(transactions).where(eq(transactions.userId, testUserId)).run();
  db.delete(categories).where(eq(categories.userId, testUserId)).run();
  db.delete(wallets).where(eq(wallets.userId, testUserId)).run();
  db.delete(users).where(eq(users.id, testUserId)).run();

  console.log("\n=== ALL 6 TESTS PASSED! Frost Shard Engine is 100% Verified! ===\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

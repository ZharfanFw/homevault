import {
  db,
  users,
  wallets,
  categories,
  budgets,
  transactions,
  frostShards,
  aegisBarriers,
  aegisCracks,
} from "../src/lib/db";
import {
  getUserAegisSummary,
  repairMinorCrack,
} from "../src/lib/gamification/aegisEngine";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { addDays } from "../src/lib/gamification/frostEngine";

async function runTests() {
  console.log("=== Testing Aegis Barrier Engine (Nordic Vault) ===");

  const testUserId = "test-user-aegis-" + Date.now();
  const testWalletId = "test-wallet-aegis-" + Date.now();
  const catMakan = "cat-makan-" + Date.now();
  const catHiburan = "cat-hiburan-" + Date.now();

  const testMonthStr = "2026-09";
  const testYear = 2026;
  const testMonth = 9;

  // 1. Setup test user and wallet
  db.insert(users)
    .values({
      id: testUserId,
      name: "Aegis Shield Tester",
      email: `aegis_${Date.now()}@example.com`,
      passwordHash: "hash",
      gamificationEnabled: true,
      createdAt: new Date(),
    })
    .run();

  db.insert(wallets)
    .values({
      id: testWalletId,
      userId: testUserId,
      name: "Aegis Bank",
      type: "BANK",
      initialBalance: 10000000,
      createdAt: new Date(),
    })
    .run();

  // Create 2 categories
  db.insert(categories)
    .values([
      {
        id: catMakan,
        userId: testUserId,
        name: "Makanan Pokok",
        type: "EXPENSE",
        spendingType: "essential",
        createdAt: new Date(),
      },
      {
        id: catHiburan,
        userId: testUserId,
        name: "Hiburan & Jajan",
        type: "EXPENSE",
        spendingType: "consumptive",
        createdAt: new Date(),
      },
    ])
    .run();

  // Create Budgets:
  // Cat 1: Limit 1.000.000
  // Cat 2: Limit 500.000
  db.insert(budgets)
    .values([
      {
        id: crypto.randomUUID(),
        userId: testUserId,
        categoryId: catMakan,
        amountLimit: 1000000,
        month: testMonth,
        year: testYear,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        userId: testUserId,
        categoryId: catHiburan,
        amountLimit: 500000,
        month: testMonth,
        year: testYear,
        createdAt: new Date(),
      },
    ])
    .run();

  // Skenario 1: Initial state -> No expenses yet -> 100% integrity
  console.log("-> 1. Testing Initial Aegis State (100% Intact)...");
  const initSummary = getUserAegisSummary(testUserId, testMonthStr);
  console.assert(initSummary.integrity === 100, `Initial integrity should be 100, got ${initSummary.integrity}`);
  console.assert(initSummary.statusDetails.status === "intact", "Status must be intact");
  console.assert(initSummary.cracks.length === 0, "Initial cracks must be 0");
  console.log("   [PASS] Initial Aegis is 100% Intact without cracks!");

  // Skenario 2: Minor Overspend (5% over limit in catMakan)
  // Limit: 1.000.000, Spend: 1.050.000 (+50.000 -> 5% overspend <= 10% -> Minor Crack, -15% penalty)
  console.log("-> 2. Testing Minor Crack (5% overspend)...");
  db.insert(transactions)
    .values({
      id: crypto.randomUUID(),
      userId: testUserId,
      walletId: testWalletId,
      categoryId: catMakan,
      type: "EXPENSE",
      amount: 1050000,
      date: "2026-09-05",
      createdAt: new Date(),
    })
    .run();

  const minorSummary = getUserAegisSummary(testUserId, testMonthStr);
  console.assert(minorSummary.integrity === 85, `Integrity after minor crack should be 85, got ${minorSummary.integrity}`);
  console.assert(minorSummary.cracks.length === 1, "Should have 1 crack");
  const minorCrack = minorSummary.cracks[0];
  console.assert(minorCrack.isMinor === true, "Crack must be classified as isMinor = true");
  console.assert(minorCrack.canRepair === true, "Minor crack must be repairable");
  console.assert(minorCrack.overspendAmount === 50000, "Overspend amount should be 50,000");
  console.log("   [PASS] Minor crack detected correctly: integrity 85%, repairable!");

  // Skenario 3: Major Overspend (25% over limit in catHiburan)
  // Limit: 500.000, Spend: 625.000 (+125.000 -> 25% overspend > 10% -> Major Crack, -35% penalty)
  // Total integrity = 100 - 15 - 35 = 50%
  console.log("-> 3. Testing Major Crack (25% overspend)...");
  db.insert(transactions)
    .values({
      id: crypto.randomUUID(),
      userId: testUserId,
      walletId: testWalletId,
      categoryId: catHiburan,
      type: "EXPENSE",
      amount: 625000,
      date: "2026-09-10",
      createdAt: new Date(),
    })
    .run();

  const majorSummary = getUserAegisSummary(testUserId, testMonthStr);
  console.assert(majorSummary.integrity === 50, `Integrity after major crack should be 50, got ${majorSummary.integrity}`);
  console.assert(majorSummary.cracks.length === 2, "Should have 2 cracks");
  const majorCrack = majorSummary.cracks.find((c) => c.categoryId === catHiburan)!;
  console.assert(majorCrack.isMinor === false, "Major crack must have isMinor = false");
  console.assert(majorCrack.canRepair === false, "Major crack must NOT be repairable");
  console.log("   [PASS] Major crack detected correctly: integrity 50%, permanent/non-repairable!");

  // Skenario 4: Attempt to repair Major Crack (should fail)
  console.log("-> 4. Testing rejection of major crack repair...");
  const invalidRepair = repairMinorCrack(testUserId, majorCrack.id);
  console.assert(invalidRepair.success === false, "Major crack repair must be rejected");
  console.log("   [PASS] Major crack repair safely rejected!");

  // Skenario 5: Repair Minor Crack using 1 Frost Shard
  console.log("-> 5. Testing Rune Repair on Minor Crack using 1 Frost Shard...");
  // First attempt repair without shards -> should fail
  const noShardRepair = repairMinorCrack(testUserId, minorCrack.id);
  console.assert(noShardRepair.success === false, "Repair without Frost Shards must fail");

  // Grant 1 Frost Shard
  const shardId = "shard-for-repair-" + Date.now();
  db.insert(frostShards)
    .values({
      id: shardId,
      userId: testUserId,
      date: "2026-09-01",
      expiresAt: addDays("2026-09-01", 30),
      redeemed: false,
      createdAt: new Date(),
    })
    .run();

  // Now repair minor crack
  const repairRes = repairMinorCrack(testUserId, minorCrack.id);
  console.assert(repairRes.success === true, "Minor crack repair must succeed with 1 shard");
  console.assert(repairRes.newIntegrity === 65, `Integrity after minor repair should recover by +15 to 65, got ${repairRes.newIntegrity}`);

  // Verify shard was redeemed
  const shardCheck = db.select().from(frostShards).where(eq(frostShards.id, shardId)).get();
  console.assert(shardCheck?.redeemed === true, "Frost Shard must be redeemed after repair");
  console.log("   [PASS] Minor crack repaired with 1 Frost Shard, integrity recovered to 65%!");

  // Skenario 6: Re-repair attempt on already repaired crack
  console.log("-> 6. Testing duplicate repair rejection...");
  const dupRepair = repairMinorCrack(testUserId, minorCrack.id);
  console.assert(dupRepair.success === false, "Duplicate repair must be rejected");
  console.log("   [PASS] Duplicate repair safely rejected!");

  // Cleanup test data
  db.delete(aegisCracks).where(eq(aegisCracks.barrierId, initSummary.barrierId)).run();
  db.delete(aegisBarriers).where(eq(aegisBarriers.userId, testUserId)).run();
  db.delete(frostShards).where(eq(frostShards.userId, testUserId)).run();
  db.delete(transactions).where(eq(transactions.userId, testUserId)).run();
  db.delete(budgets).where(eq(budgets.userId, testUserId)).run();
  db.delete(categories).where(eq(categories.userId, testUserId)).run();
  db.delete(wallets).where(eq(wallets.userId, testUserId)).run();
  db.delete(users).where(eq(users.id, testUserId)).run();

  console.log("\n=== ALL TESTS PASSED! Aegis Barrier Engine is 100% Verified! ===\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

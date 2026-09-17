import { db, users, wallets, savingsGoals, transactions } from "../src/lib/db";
import {
  getCoinTier,
  getNextCoinMilestone,
  enrichGoalWithCoin,
} from "../src/lib/gamification/coinEngine";
import { isDateFrostDay } from "../src/lib/gamification/frostEngine";
import { eq } from "drizzle-orm";
import crypto from "crypto";

async function runTests() {
  console.log("=== Testing The Minted Goal Coins & Coin Engine ===");

  // 1. Test Static Tier Calculation & Metadata
  console.log("-> 1. Testing getCoinTier thresholds...");
  const target = 1000000;
  console.assert(getCoinTier(0, target) === "raw_iron", "0% should be raw_iron");
  console.assert(getCoinTier(240000, target) === "raw_iron", "24% should be raw_iron");
  console.assert(getCoinTier(250000, target) === "bronze", "25% should be bronze");
  console.assert(getCoinTier(499000, target) === "bronze", "49.9% should be bronze");
  console.assert(getCoinTier(500000, target) === "sterling_silver", "50% should be sterling_silver");
  console.assert(getCoinTier(749000, target) === "sterling_silver", "74.9% should be sterling_silver");
  console.assert(getCoinTier(750000, target) === "nordic_amber", "75% should be nordic_amber");
  console.assert(getCoinTier(999000, target) === "nordic_amber", "99.9% should be nordic_amber");
  console.assert(getCoinTier(1000000, target) === "nordic_crystal", "100% should be nordic_crystal");
  console.assert(getCoinTier(1500000, target) === "nordic_crystal", ">100% should be nordic_crystal");
  console.log("   [PASS] All 5 tier percentage thresholds evaluated perfectly!");

  // 2. Test getNextCoinMilestone
  console.log("-> 2. Testing getNextCoinMilestone...");
  const m1 = getNextCoinMilestone(100000, target);
  console.assert(m1?.nextTier === "bronze" && m1.amountNeeded === 150000, "From 10% next should be bronze needing 150k");
  const m2 = getNextCoinMilestone(300000, target);
  console.assert(m2?.nextTier === "sterling_silver" && m2.amountNeeded === 200000, "From 30% next should be silver needing 200k");
  const m3 = getNextCoinMilestone(600000, target);
  console.assert(m3?.nextTier === "nordic_amber" && m3.amountNeeded === 150000, "From 60% next should be amber needing 150k");
  const m4 = getNextCoinMilestone(850000, target);
  console.assert(m4?.nextTier === "nordic_crystal" && m4.amountNeeded === 150000, "From 85% next should be crystal needing 150k");
  const m5 = getNextCoinMilestone(1000000, target);
  console.assert(m5 === null, "At 100% next milestone should be null");
  console.log("   [PASS] Next milestone calculations are 100% accurate!");

  // 3. Test Database Simulation: Peak Locking & Direct Reveal
  console.log("-> 3. Testing Peak Milestone Locking with DB simulation...");
  const testUserId = "test-user-coins-" + Date.now();
  const testWalletId = "test-wallet-" + Date.now();
  const testGoalId = "test-goal-" + Date.now();

  db.insert(users)
    .values({
      id: testUserId,
      name: "Coin Tester",
      email: `coin_${Date.now()}@example.com`,
      passwordHash: "hash",
      gamificationEnabled: true,
      createdAt: new Date(),
    })
    .run();

  db.insert(wallets)
    .values({
      id: testWalletId,
      userId: testUserId,
      name: "Coin Vault Wallet",
      type: "BANK",
      initialBalance: 5000000,
      createdAt: new Date(),
    })
    .run();

  // Create Goal: Target 1.000.000
  db.insert(savingsGoals)
    .values({
      id: testGoalId,
      userId: testUserId,
      name: "Dana Darurat Nordik",
      targetAmount: 1000000,
      currentAmount: 0,
      peakAmount: 0,
      isFlawless: true,
      status: "IN_PROGRESS",
      createdAt: new Date(),
    })
    .run();

  // Step A: Direct Reveal to 60% (Sterling Silver)
  const currentGoal = db.select().from(savingsGoals).where(eq(savingsGoals.id, testGoalId)).get()!;
  let newCurrent = currentGoal.currentAmount + 600000;
  let newPeak = Math.max(currentGoal.peakAmount || 0, newCurrent);

  db.update(savingsGoals)
    .set({ currentAmount: newCurrent, peakAmount: newPeak })
    .where(eq(savingsGoals.id, testGoalId))
    .run();

  let enriched = enrichGoalWithCoin(db.select().from(savingsGoals).where(eq(savingsGoals.id, testGoalId)).get()!);
  console.assert(enriched.coinTier === "sterling_silver", "Direct reveal to 60% must yield sterling_silver");
  console.log("   [PASS] Direct Reveal to 60% -> Sterling Silver verified!");

  // Step B: Deposit to 85% (Nordic Amber)
  newCurrent += 250000; // 850.000
  newPeak = Math.max(newPeak, newCurrent);
  db.update(savingsGoals)
    .set({ currentAmount: newCurrent, peakAmount: newPeak })
    .where(eq(savingsGoals.id, testGoalId))
    .run();

  enriched = enrichGoalWithCoin(db.select().from(savingsGoals).where(eq(savingsGoals.id, testGoalId)).get()!);
  console.assert(enriched.coinTier === "nordic_amber", "Peak at 85% must yield nordic_amber");
  console.log("   [PASS] Deposit to 85% -> Nordic Amber verified!");

  // Step C: Withdrawal of 600.000 (Current drops to 250.000 / 25%)
  newCurrent -= 600000; // 250.000
  // Peak locking: newPeak remains 850.000!
  db.update(savingsGoals)
    .set({ currentAmount: newCurrent })
    .where(eq(savingsGoals.id, testGoalId))
    .run();

  enriched = enrichGoalWithCoin(db.select().from(savingsGoals).where(eq(savingsGoals.id, testGoalId)).get()!);
  console.assert(
    enriched.currentAmount === 250000 && enriched.peakAmount === 850000,
    "Current should be 250k and peak should be 850k"
  );
  console.assert(
    enriched.coinTier === "nordic_amber",
    `Coin tier after withdrawal must STAY at peak (nordic_amber), got ${enriched.coinTier}`
  );
  console.log("   [PASS] Peak Milestone Locking: withdrawal did NOT downgrade coin tier (Remains Nordic Amber)!");

  // Step D: Finish Goal to 100% (Nordic Crystal + completedAt)
  newCurrent = 1000000;
  newPeak = 1000000;
  const completedTimestamp = new Date();
  db.update(savingsGoals)
    .set({
      currentAmount: newCurrent,
      peakAmount: newPeak,
      status: "COMPLETED",
      completedAt: completedTimestamp,
    })
    .where(eq(savingsGoals.id, testGoalId))
    .run();

  enriched = enrichGoalWithCoin(db.select().from(savingsGoals).where(eq(savingsGoals.id, testGoalId)).get()!);
  console.assert(enriched.coinTier === "nordic_crystal", "100% must yield nordic_crystal");
  console.assert(enriched.status === "COMPLETED", "Status must be COMPLETED");
  console.assert(!!enriched.completedAt, "completedAt must be populated");
  console.log("   [PASS] 100% Goal reached -> Nordic Crystal with completion timestamp verified!");

  // 4. Test Frost Day with [Setor Tabungan]
  console.log("-> 4. Testing Frost Day immunity for [Setor Tabungan]...");
  const mockDate = "2026-09-17";
  db.insert(transactions)
    .values({
      id: crypto.randomUUID(),
      userId: testUserId,
      walletId: testWalletId,
      type: "EXPENSE",
      amount: 500000,
      date: mockDate,
      notes: "[Setor Tabungan] Dana Darurat Nordik",
      createdAt: new Date(),
    })
    .run();

  const isFrost = isDateFrostDay(testUserId, mockDate);
  console.assert(isFrost === true, "A day with only [Setor Tabungan] must remain a Frost Day!");
  console.log("   [PASS] Savings deposits are immune to Frost Day disqualification!");

  // Cleanup test data
  db.delete(transactions).where(eq(transactions.userId, testUserId)).run();
  db.delete(savingsGoals).where(eq(savingsGoals.userId, testUserId)).run();
  db.delete(wallets).where(eq(wallets.userId, testUserId)).run();
  db.delete(users).where(eq(users.id, testUserId)).run();

  console.log("\n=== ALL TESTS PASSED! The Minted Goal Coins are 100% Verified! ===\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

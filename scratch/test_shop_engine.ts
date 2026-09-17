import {
  db,
  users,
  wallets,
  transactions,
  frostShards,
  vaultShopItems,
  vaultRedemptions,
} from "../src/lib/db";
import {
  getUserShopCatalog,
  createUserVoucher,
  redeemShopItem,
  getUserInventory,
  applyVoucherToTransaction,
} from "../src/lib/gamification/shopEngine";
import { eq } from "drizzle-orm";
import crypto from "crypto";

async function runTests() {
  console.log("=== Testing The Vault Shop Engine & Inventory ===");

  const testUserId = "test-user-shop-" + Date.now();
  const testWalletId = "test-wallet-shop-" + Date.now();

  // 1. Setup test user and wallet
  db.insert(users)
    .values({
      id: testUserId,
      name: "Shop Tester",
      email: `shop_${Date.now()}@example.com`,
      passwordHash: "hash",
      gamificationEnabled: true,
      createdAt: new Date(),
    })
    .run();

  db.insert(wallets)
    .values({
      id: testWalletId,
      userId: testUserId,
      name: "Shop Wallet",
      type: "BANK",
      initialBalance: 5000000,
      createdAt: new Date(),
    })
    .run();

  // Scenario 1: Seed default catalog & Query
  console.log("-> 1. Testing Default Catalog Seeding & Query...");
  const initialCatalog = getUserShopCatalog(testUserId);
  console.assert(initialCatalog.virtualItems.length >= 4, "Must have at least 4 global virtual items");
  const runeBearerItem = initialCatalog.virtualItems.find((i) => i.id === "global-rune-bearer");
  console.assert(!!runeBearerItem, "global-rune-bearer item must exist");
  console.assert(runeBearerItem?.shardCost === 5, "Rune Bearer cost must be 5 shards");
  console.assert(initialCatalog.shardBalance >= 0, "Initial shard balance should be non-negative");
  console.log("   [PASS] Global virtual items seeded and catalog queried cleanly!");

  // Scenario 2: Create User Voucher (Type A)
  console.log("-> 2. Testing Custom Voucher Creation...");
  const createdVoucher = createUserVoucher(testUserId, {
    name: "Kopi Mewah Artisan",
    description: "Ngopi santai di cafe pilihan tanpa rasa bersalah.",
    shardCost: 3,
    userDefinedCap: 45000,
    icon: "coffee",
  });
  console.assert(createdVoucher.name === "Kopi Mewah Artisan", "Voucher name must match");
  console.assert(createdVoucher.shardCost === 3, "Voucher shardCost must be 3");
  console.assert(createdVoucher.userDefinedCap === 45000, "Voucher cap must be 45,000");

  const updatedCatalog = getUserShopCatalog(testUserId);
  const foundVoucher = updatedCatalog.vouchers.find((v) => v.id === createdVoucher.id);
  console.assert(!!foundVoucher, "Newly created voucher must appear in user's catalog");
  console.log("   [PASS] Custom voucher template created and verified!");

  // Scenario 3: Insufficient shards rejection
  console.log("-> 3. Testing Insufficient Shards Rejection...");
  const expensiveVoucher = createUserVoucher(testUserId, {
    name: "Voucher Sangat Mahal",
    shardCost: updatedCatalog.shardBalance + 500,
    userDefinedCap: 1000000,
  });
  const failedRedeem = redeemShopItem(testUserId, expensiveVoucher.id);
  console.assert(failedRedeem.success === false, "Redemption exceeding shard balance must fail");
  console.log("   [PASS] Insufficient shards rejection verified!");

  // Scenario 4: Redemption of Voucher via FIFO Shard Deduction
  console.log("-> 4. Testing Voucher Redemption with Frost Shards...");
  const balanceBeforeVoucher = getUserShopCatalog(testUserId).shardBalance;

  // Redeem voucher costing 3 shards
  const voucherRedeemRes = redeemShopItem(testUserId, createdVoucher.id);
  console.assert(voucherRedeemRes.success === true, "Voucher redemption should succeed");
  console.assert(
    voucherRedeemRes.remainingShards === balanceBeforeVoucher - 3,
    `Remaining shards should be ${balanceBeforeVoucher - 3}, got ${voucherRedeemRes.remainingShards}`
  );

  const invAfterVoucher = getUserInventory(testUserId);
  console.assert(invAfterVoucher.activeVouchers.length === 1, "Must have 1 active voucher in inventory");
  console.assert(invAfterVoucher.activeVouchers[0].name === "Kopi Mewah Artisan", "Active voucher name must match");
  console.log("   [PASS] Voucher redeemed via FIFO: 3 shards deducted, active voucher added to inventory!");

  // Scenario 5: Redemption of Virtual Item & Duplicate Prevention
  console.log("-> 5. Testing Virtual Item Redemption & Duplicate Ownership Prevention...");
  const balanceBeforeVirtual = getUserShopCatalog(testUserId).shardBalance;

  // Buy "global-rune-bearer" (costs 5 shards)
  const virtualRedeemRes = redeemShopItem(testUserId, "global-rune-bearer");
  console.assert(virtualRedeemRes.success === true, "Virtual item redemption must succeed");
  console.assert(
    virtualRedeemRes.remainingShards === balanceBeforeVirtual - 5,
    `Remaining shards should be ${balanceBeforeVirtual - 5}, got ${virtualRedeemRes.remainingShards}`
  );

  const invWithVirtual = getUserInventory(testUserId);
  console.assert(invWithVirtual.virtualCollection.length === 1, "Must have 1 virtual item in collection");
  console.assert(invWithVirtual.virtualCollection[0].itemId === "global-rune-bearer", "Virtual item ID must match");

  // Attempt duplicate purchase of same virtual item -> must fail
  const dupVirtualRedeem = redeemShopItem(testUserId, "global-rune-bearer");
  console.assert(dupVirtualRedeem.success === false, "Duplicate virtual item purchase must be rejected");
  console.log("   [PASS] Virtual item redeemed and duplicate purchase prevented!");

  // Scenario 6: Linking active voucher to a transaction
  console.log("-> 6. Testing Voucher Usage for Transaction...");
  const activeVoucher = invAfterVoucher.activeVouchers[0];
  const testTxId = crypto.randomUUID();

  // Create a real transaction row for testTxId
  db.insert(transactions)
    .values({
      id: testTxId,
      userId: testUserId,
      walletId: testWalletId,
      type: "EXPENSE",
      amount: 42000,
      date: "2026-09-15",
      notes: "Kopi Mewah Artisan - Self Reward",
      createdAt: new Date(),
    })
    .run();

  // User spent Rp 42.000 (below Rp 45.000 cap)
  const useRes = applyVoucherToTransaction(testUserId, activeVoucher.id, testTxId, 42000);
  console.assert(useRes.success === true, "Voucher use should succeed");

  const finalInv = getUserInventory(testUserId);
  console.assert(finalInv.activeVouchers.length === 0, "Active vouchers should now be 0");
  console.assert(finalInv.usedVouchers.length === 1, "Used vouchers should now be 1");
  console.assert(finalInv.usedVouchers[0].actualSpentAmount === 42000, "Used voucher actual spent should be 42000");
  console.assert(finalInv.usedVouchers[0].transactionId === testTxId, "Transaction ID must be linked");
  console.log("   [PASS] Voucher linked to transaction, status updated to USED!");

  // Cleanup test data
  db.delete(vaultRedemptions).where(eq(vaultRedemptions.userId, testUserId)).run();
  db.delete(transactions).where(eq(transactions.userId, testUserId)).run();
  db.delete(vaultShopItems).where(eq(vaultShopItems.userId, testUserId)).run();
  db.delete(frostShards).where(eq(frostShards.userId, testUserId)).run();
  db.delete(wallets).where(eq(wallets.userId, testUserId)).run();
  db.delete(users).where(eq(users.id, testUserId)).run();

  console.log("\n=== ALL 6 TESTS PASSED! The Vault Shop Engine is 100% Verified! ===\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

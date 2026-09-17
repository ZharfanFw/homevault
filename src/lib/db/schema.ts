import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  currency: text("currency").notNull().default("IDR"),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  gamificationEnabled: integer("gamification_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const wallets = sqliteTable("wallets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["BANK", "EWALLET", "CASH", "CREDIT_CARD", "OTHER"],
  })
    .notNull()
    .default("BANK"),
  initialBalance: integer("initial_balance").notNull().default(0),
  color: text("color").notNull().default("#3b82f6"),
  icon: text("icon").notNull().default("wallet"),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: ["EXPENSE", "INCOME"] }).notNull(),
  spendingType: text("spending_type", {
    enum: ["consumptive", "essential", "bill", "self_reward"],
  }).default("consumptive"),
  icon: text("icon").notNull().default("tag"),
  color: text("color").notNull().default("#64748b"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  walletId: text("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  destinationWalletId: text("destination_wallet_id").references(
    () => wallets.id,
    { onDelete: "set null" }
  ),
  type: text("type", { enum: ["EXPENSE", "INCOME", "TRANSFER"] }).notNull(),
  amount: integer("amount").notNull(),
  date: text("date").notNull(), // format YYYY-MM-DD or ISO
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const budgets = sqliteTable("budgets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  amountLimit: integer("amount_limit").notNull(),
  month: integer("month").notNull(), // 1 - 12
  year: integer("year").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// 5. Recurring Transactions & Subscriptions
export const recurringTransactions = sqliteTable("recurring_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  walletId: text("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  type: text("type", { enum: ["EXPENSE", "INCOME"] }).notNull(),
  amount: integer("amount").notNull(),
  frequency: text("frequency", {
    enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
  })
    .notNull()
    .default("MONTHLY"),
  startDate: text("start_date").notNull(),
  nextDueDate: text("next_due_date").notNull(),
  status: text("status", { enum: ["ACTIVE", "PAUSED"] })
    .notNull()
    .default("ACTIVE"),
  autoCreate: integer("auto_create", { mode: "boolean" })
    .notNull()
    .default(false),
  notes: text("notes"),
  lastProcessedDate: text("last_processed_date"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const recurringLogs = sqliteTable("recurring_logs", {
  id: text("id").primaryKey(),
  recurringId: text("recurring_id")
    .notNull()
    .references(() => recurringTransactions.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dueDate: text("due_date").notNull(),
  paidDate: text("paid_date"),
  transactionId: text("transaction_id").references(() => transactions.id, {
    onDelete: "set null",
  }),
  status: text("status", { enum: ["PENDING", "PAID", "OVERDUE", "SKIPPED"] })
    .notNull()
    .default("PENDING"),
  amount: integer("amount").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// 6. Savings Goals & Sinking Funds
export const savingsGoals = sqliteTable("savings_goals", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetWalletId: text("target_wallet_id").references(() => wallets.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  targetAmount: integer("target_amount").notNull(),
  currentAmount: integer("current_amount").notNull().default(0),
  peakAmount: integer("peak_amount").notNull().default(0),
  isFlawless: integer("is_flawless", { mode: "boolean" }).notNull().default(true),
  targetDate: text("target_date"),
  color: text("color").notNull().default("#88C0D0"),
  icon: text("icon").notNull().default("piggy-bank"),
  status: text("status", { enum: ["IN_PROGRESS", "COMPLETED"] })
    .notNull()
    .default("IN_PROGRESS"),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const savingsAllocationLogs = sqliteTable("savings_allocation_logs", {
  id: text("id").primaryKey(),
  goalId: text("goal_id")
    .notNull()
    .references(() => savingsGoals.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  walletId: text("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  transactionId: text("transaction_id").references(() => transactions.id, {
    onDelete: "set null",
  }),
  type: text("type", { enum: ["DEPOSIT", "WITHDRAW"] }).notNull(),
  amount: integer("amount").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// 7. Debts & Loans
export const debtsLoans = sqliteTable("debts_loans", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["PAYABLE", "RECEIVABLE"] }).notNull(),
  personName: text("person_name").notNull(),
  totalAmount: integer("total_amount").notNull(),
  remainingAmount: integer("remaining_amount").notNull(),
  startDate: text("start_date").notNull(),
  dueDate: text("due_date"),
  status: text("status", {
    enum: ["UNPAID", "PARTIALLY_PAID", "SETTLED"],
  })
    .notNull()
    .default("UNPAID"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const debtRepayments = sqliteTable("debt_repayments", {
  id: text("id").primaryKey(),
  debtId: text("debt_id")
    .notNull()
    .references(() => debtsLoans.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  walletId: text("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  transactionId: text("transaction_id").references(() => transactions.id, {
    onDelete: "set null",
  }),
  amount: integer("amount").notNull(),
  paymentDate: text("payment_date").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// 8. Gamification Engine (Nordic Vault)
export const frostShards = sqliteTable(
  "frost_shards",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // "YYYY-MM-DD"
    expiresAt: text("expires_at").notNull(), // "YYYY-MM-DD" (date + 30 days)
    redeemed: integer("redeemed", { mode: "boolean" }).notNull().default(false),
    redeemedAt: integer("redeemed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userDateIdx: uniqueIndex("idx_frost_shards_user_date").on(
      table.userId,
      table.date
    ),
  })
);

export const aegisBarriers = sqliteTable("aegis_barriers", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // "YYYY-MM"
  integrity: integer("integrity").notNull().default(100), // 0 - 100
  trophyAwarded: integer("trophy_awarded", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const aegisCracks = sqliteTable("aegis_cracks", {
  id: text("id").primaryKey(),
  barrierId: text("barrier_id")
    .notNull()
    .references(() => aegisBarriers.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  overspendAmount: integer("overspend_amount").notNull(),
  overspendPercentage: integer("overspend_percentage").notNull(),
  isMinor: integer("is_minor", { mode: "boolean" }).notNull().default(true),
  repaired: integer("repaired", { mode: "boolean" }).notNull().default(false),
  repairedAt: integer("repaired_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const vaultShopItems = sqliteTable("vault_shop_items", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }), // null = global system item, non-null = user-defined voucher
  type: text("type", { enum: ["voucher", "virtual"] }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  shardCost: integer("shard_cost").notNull(),
  userDefinedCap: integer("user_defined_cap"), // max budget for vouchers
  isSeasonal: integer("is_seasonal", { mode: "boolean" })
    .notNull()
    .default(false),
  availableUntil: text("available_until"), // YYYY-MM-DD
  icon: text("icon").notNull().default("gift"),
  metadata: text("metadata"), // JSON string (custom style, perk keys, etc.)
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const vaultRedemptions = sqliteTable("vault_redemptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  itemId: text("item_id")
    .notNull()
    .references(() => vaultShopItems.id, { onDelete: "cascade" }),
  shardCost: integer("shard_cost").notNull(),
  actualSpentAmount: integer("actual_spent_amount"),
  transactionId: text("transaction_id").references(() => transactions.id, {
    onDelete: "set null",
  }),
  status: text("status", { enum: ["ACTIVE", "USED", "EXPIRED"] })
    .notNull()
    .default("ACTIVE"),
  redeemedAt: integer("redeemed_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  wallets: many(wallets),
  categories: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
  recurringTransactions: many(recurringTransactions),
  savingsGoals: many(savingsGoals),
  debtsLoans: many(debtsLoans),
  frostShards: many(frostShards),
  aegisBarriers: many(aegisBarriers),
  vaultShopItems: many(vaultShopItems),
  vaultRedemptions: many(vaultRedemptions),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(transactions, { relationName: "sourceWallet" }),
  destinationTransactions: many(transactions, {
    relationName: "destinationWallet",
  }),
  recurringTransactions: many(recurringTransactions),
  savingsAllocationLogs: many(savingsAllocationLogs),
  debtRepayments: many(debtRepayments),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  budgets: many(budgets),
  recurringTransactions: many(recurringTransactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
    relationName: "sourceWallet",
  }),
  destinationWallet: one(wallets, {
    fields: [transactions.destinationWalletId],
    references: [wallets.id],
    relationName: "destinationWallet",
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const recurringTransactionsRelations = relations(
  recurringTransactions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [recurringTransactions.userId],
      references: [users.id],
    }),
    wallet: one(wallets, {
      fields: [recurringTransactions.walletId],
      references: [wallets.id],
    }),
    category: one(categories, {
      fields: [recurringTransactions.categoryId],
      references: [categories.id],
    }),
    logs: many(recurringLogs),
  })
);

export const recurringLogsRelations = relations(recurringLogs, ({ one }) => ({
  recurring: one(recurringTransactions, {
    fields: [recurringLogs.recurringId],
    references: [recurringTransactions.id],
  }),
  transaction: one(transactions, {
    fields: [recurringLogs.transactionId],
    references: [transactions.id],
  }),
}));

export const savingsGoalsRelations = relations(
  savingsGoals,
  ({ one, many }) => ({
    user: one(users, {
      fields: [savingsGoals.userId],
      references: [users.id],
    }),
    targetWallet: one(wallets, {
      fields: [savingsGoals.targetWalletId],
      references: [wallets.id],
    }),
    allocationLogs: many(savingsAllocationLogs),
  })
);

export const savingsAllocationLogsRelations = relations(
  savingsAllocationLogs,
  ({ one }) => ({
    goal: one(savingsGoals, {
      fields: [savingsAllocationLogs.goalId],
      references: [savingsGoals.id],
    }),
    wallet: one(wallets, {
      fields: [savingsAllocationLogs.walletId],
      references: [wallets.id],
    }),
    transaction: one(transactions, {
      fields: [savingsAllocationLogs.transactionId],
      references: [transactions.id],
    }),
  })
);

export const debtsLoansRelations = relations(debtsLoans, ({ one, many }) => ({
  user: one(users, {
    fields: [debtsLoans.userId],
    references: [users.id],
  }),
  repayments: many(debtRepayments),
}));

export const debtRepaymentsRelations = relations(debtRepayments, ({ one }) => ({
  debt: one(debtsLoans, {
    fields: [debtRepayments.debtId],
    references: [debtsLoans.id],
  }),
  wallet: one(wallets, {
    fields: [debtRepayments.walletId],
    references: [wallets.id],
  }),
  transaction: one(transactions, {
    fields: [debtRepayments.transactionId],
    references: [transactions.id],
  }),
}));

export const frostShardsRelations = relations(frostShards, ({ one }) => ({
  user: one(users, {
    fields: [frostShards.userId],
    references: [users.id],
  }),
}));

export const aegisBarriersRelations = relations(aegisBarriers, ({ one, many }) => ({
  user: one(users, {
    fields: [aegisBarriers.userId],
    references: [users.id],
  }),
  cracks: many(aegisCracks),
}));

export const aegisCracksRelations = relations(aegisCracks, ({ one }) => ({
  barrier: one(aegisBarriers, {
    fields: [aegisCracks.barrierId],
    references: [aegisBarriers.id],
  }),
  category: one(categories, {
    fields: [aegisCracks.categoryId],
    references: [categories.id],
  }),
}));

export const vaultShopItemsRelations = relations(vaultShopItems, ({ one, many }) => ({
  user: one(users, {
    fields: [vaultShopItems.userId],
    references: [users.id],
  }),
  redemptions: many(vaultRedemptions),
}));

export const vaultRedemptionsRelations = relations(vaultRedemptions, ({ one }) => ({
  user: one(users, {
    fields: [vaultRedemptions.userId],
    references: [users.id],
  }),
  item: one(vaultShopItems, {
    fields: [vaultRedemptions.itemId],
    references: [vaultShopItems.id],
  }),
  transaction: one(transactions, {
    fields: [vaultRedemptions.transactionId],
    references: [transactions.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;

export type RecurringTransaction = typeof recurringTransactions.$inferSelect;
export type NewRecurringTransaction = typeof recurringTransactions.$inferInsert;
export type RecurringLog = typeof recurringLogs.$inferSelect;
export type NewRecurringLog = typeof recurringLogs.$inferInsert;

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type NewSavingsGoal = typeof savingsGoals.$inferInsert;
export type SavingsAllocationLog = typeof savingsAllocationLogs.$inferSelect;
export type NewSavingsAllocationLog = typeof savingsAllocationLogs.$inferInsert;

export type DebtLoan = typeof debtsLoans.$inferSelect;
export type NewDebtLoan = typeof debtsLoans.$inferInsert;
export type DebtRepayment = typeof debtRepayments.$inferSelect;
export type NewDebtRepayment = typeof debtRepayments.$inferInsert;

export type FrostShard = typeof frostShards.$inferSelect;
export type NewFrostShard = typeof frostShards.$inferInsert;
export type AegisBarrier = typeof aegisBarriers.$inferSelect;
export type NewAegisBarrier = typeof aegisBarriers.$inferInsert;
export type AegisCrack = typeof aegisCracks.$inferSelect;
export type NewAegisCrack = typeof aegisCracks.$inferInsert;
export type VaultShopItem = typeof vaultShopItems.$inferSelect;
export type NewVaultShopItem = typeof vaultShopItems.$inferInsert;
export type VaultRedemption = typeof vaultRedemptions.$inferSelect;
export type NewVaultRedemption = typeof vaultRedemptions.$inferInsert;

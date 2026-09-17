import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
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
  targetDate: text("target_date"),
  color: text("color").notNull().default("#88C0D0"),
  icon: text("icon").notNull().default("piggy-bank"),
  status: text("status", { enum: ["IN_PROGRESS", "COMPLETED"] })
    .notNull()
    .default("IN_PROGRESS"),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  wallets: many(wallets),
  categories: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
  recurringTransactions: many(recurringTransactions),
  savingsGoals: many(savingsGoals),
  debtsLoans: many(debtsLoans),
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

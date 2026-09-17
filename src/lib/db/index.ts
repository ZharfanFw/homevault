import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

const dbPath =
  process.env.DATABASE_PATH ||
  process.env.DATABASE_URL ||
  path.join(process.cwd(), "data", "finance.db");

// Ensure data folder exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Global reference to prevent multiple SQLite instances during Next.js hot reload
const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined;
};

const sqlite =
  globalForDb.sqlite ??
  new Database(dbPath, {
    verbose:
      process.env.NODE_ENV === "development" && process.env.DEBUG_SQL === "true"
        ? console.log
        : undefined,
  });

// Optimize SQLite for high performance and integrity
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("synchronous = NORMAL");

// Ensure tables exist on startup
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'IDR',
    is_admin INTEGER NOT NULL DEFAULT 0,
    gamification_enabled INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'BANK',
    initial_balance INTEGER NOT NULL DEFAULT 0,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    icon TEXT NOT NULL DEFAULT 'wallet',
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'tag',
    color TEXT NOT NULL DEFAULT '#64748b',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    destination_wallet_id TEXT REFERENCES wallets(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount_limit INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recurring_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'MONTHLY',
    start_date TEXT NOT NULL,
    next_due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    auto_create INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    last_processed_date TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recurring_logs (
    id TEXT PRIMARY KEY,
    recurring_id TEXT NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    due_date TEXT NOT NULL,
    paid_date TEXT,
    transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    amount INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS savings_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_wallet_id TEXT REFERENCES wallets(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    target_amount INTEGER NOT NULL,
    current_amount INTEGER NOT NULL DEFAULT 0,
    target_date TEXT,
    color TEXT NOT NULL DEFAULT '#88C0D0',
    icon TEXT NOT NULL DEFAULT 'piggy-bank',
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS savings_allocation_logs (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS debts_loans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    person_name TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    remaining_amount INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'UNPAID',
    notes TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS debt_repayments (
    id TEXT PRIMARY KEY,
    debt_id TEXT NOT NULL REFERENCES debts_loans(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    payment_date TEXT NOT NULL,
    notes TEXT,
    created_at INTEGER NOT NULL
  );

  -- Gamification Tables (Nordic Vault)
  CREATE TABLE IF NOT EXISTS frost_shards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    redeemed INTEGER NOT NULL DEFAULT 0,
    redeemed_at INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS aegis_barriers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    integrity INTEGER NOT NULL DEFAULT 100,
    trophy_awarded INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS aegis_cracks (
    id TEXT PRIMARY KEY,
    barrier_id TEXT NOT NULL REFERENCES aegis_barriers(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    overspend_amount INTEGER NOT NULL,
    overspend_percentage INTEGER NOT NULL,
    is_minor INTEGER NOT NULL DEFAULT 1,
    repaired INTEGER NOT NULL DEFAULT 0,
    repaired_at INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vault_shop_items (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    shard_cost INTEGER NOT NULL,
    user_defined_cap INTEGER,
    is_seasonal INTEGER NOT NULL DEFAULT 0,
    available_until TEXT,
    icon TEXT NOT NULL DEFAULT 'gift',
    metadata TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vault_redemptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES vault_shop_items(id) ON DELETE CASCADE,
    shard_cost INTEGER NOT NULL,
    actual_spent_amount INTEGER,
    transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    redeemed_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
  CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
  CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, month, year);
  CREATE INDEX IF NOT EXISTS idx_recurring_user ON recurring_transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_recurring_due ON recurring_transactions(next_due_date);
  CREATE INDEX IF NOT EXISTS idx_goals_user ON savings_goals(user_id);
  CREATE INDEX IF NOT EXISTS idx_debts_user ON debts_loans(user_id);
  CREATE INDEX IF NOT EXISTS idx_frost_shards_user ON frost_shards(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_aegis_barriers_user ON aegis_barriers(user_id, month);
  CREATE INDEX IF NOT EXISTS idx_aegis_cracks_barrier ON aegis_cracks(barrier_id);
  CREATE INDEX IF NOT EXISTS idx_vault_shop_user ON vault_shop_items(user_id);
  CREATE INDEX IF NOT EXISTS idx_vault_redemptions_user ON vault_redemptions(user_id);
`);

// Run incremental safe migrations for existing tables
try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN gamification_enabled INTEGER NOT NULL DEFAULT 0;`);
} catch {}

try {
  sqlite.exec(`ALTER TABLE categories ADD COLUMN spending_type TEXT DEFAULT 'consumptive';`);
} catch {}

try {
  sqlite.exec(`ALTER TABLE savings_goals ADD COLUMN peak_amount INTEGER NOT NULL DEFAULT 0;`);
} catch {}

try {
  sqlite.exec(`ALTER TABLE savings_goals ADD COLUMN is_flawless INTEGER NOT NULL DEFAULT 1;`);
} catch {}

try {
  sqlite.exec(`ALTER TABLE savings_goals ADD COLUMN completed_at INTEGER;`);
} catch {}

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { sqlite };
export * from "./schema";

import { db, categories, wallets } from "./index";
import crypto from "crypto";

export async function seedUserData(userId: string) {
  const defaultExpenseCategories = [
    { name: "Makanan & Minuman", icon: "utensils", color: "#f97316" },
    { name: "Belanja Bulanan", icon: "shopping-cart", color: "#06b6d4" },
    { name: "Transportasi", icon: "car", color: "#3b82f6" },
    { name: "Tagihan & Utilitas", icon: "receipt", color: "#ef4444" },
    { name: "Hiburan & Hobi", icon: "gamepad-2", color: "#a855f7" },
    { name: "Kesehatan", icon: "heart-pulse", color: "#ec4899" },
    { name: "Pendidikan", icon: "graduation-cap", color: "#10b981" },
    { name: "Lainnya", icon: "more-horizontal", color: "#64748b" },
  ];

  const defaultIncomeCategories = [
    { name: "Gaji Utama", icon: "briefcase", color: "#10b981" },
    { name: "Bonus & THR", icon: "gift", color: "#f59e0b" },
    { name: "Investasi & Dividen", icon: "trending-up", color: "#6366f1" },
    { name: "Freelance & Bisnis", icon: "laptop", color: "#06b6d4" },
    { name: "Pemasukan Lainnya", icon: "piggy-bank", color: "#8b5cf6" },
  ];

  const categoryInserts = [
    ...defaultExpenseCategories.map((c) => ({
      id: crypto.randomUUID(),
      userId,
      name: c.name,
      type: "EXPENSE" as const,
      icon: c.icon,
      color: c.color,
      createdAt: new Date(),
    })),
    ...defaultIncomeCategories.map((c) => ({
      id: crypto.randomUUID(),
      userId,
      name: c.name,
      type: "INCOME" as const,
      icon: c.icon,
      color: c.color,
      createdAt: new Date(),
    })),
  ];

  const defaultWallets = [
    {
      id: crypto.randomUUID(),
      userId,
      name: "Dompet Tunai",
      type: "CASH" as const,
      initialBalance: 0,
      color: "#10b981",
      icon: "banknote",
      isArchived: false,
      createdAt: new Date(),
    },
    {
      id: crypto.randomUUID(),
      userId,
      name: "Rekening Utama",
      type: "BANK" as const,
      initialBalance: 0,
      color: "#3b82f6",
      icon: "building-2",
      isArchived: false,
      createdAt: new Date(),
    },
  ];

  for (const cat of categoryInserts) {
    db.insert(categories).values(cat).run();
  }

  for (const wal of defaultWallets) {
    db.insert(wallets).values(wal).run();
  }
}

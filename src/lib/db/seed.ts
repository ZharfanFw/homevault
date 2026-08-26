import { db, categories, wallets } from "./index";
import crypto from "crypto";

export async function seedUserData(userId: string) {
  // Curated Nord Aurora & Frost colors
  const defaultExpenseCategories = [
    { name: "Makanan & Minuman", icon: "utensils", color: "#D08770" }, // nord12 Orange
    { name: "Belanja Bulanan", icon: "shopping-cart", color: "#8FBCBB" }, // nord7 Teal
    { name: "Transportasi", icon: "car", color: "#81A1C1" }, // nord9 Glacier Blue
    { name: "Tagihan & Utilitas", icon: "receipt", color: "#BF616A" }, // nord11 Red
    { name: "Hiburan & Hobi", icon: "gamepad-2", color: "#B48EAD" }, // nord15 Purple
    { name: "Kesehatan", icon: "heart-pulse", color: "#EBCB8B" }, // nord13 Yellow
    { name: "Pendidikan", icon: "graduation-cap", color: "#A3BE8C" }, // nord14 Green
    { name: "Lainnya", icon: "more-horizontal", color: "#4C566A" }, // nord3 Slate
  ];

  const defaultIncomeCategories = [
    { name: "Gaji Utama", icon: "briefcase", color: "#A3BE8C" }, // nord14 Green
    { name: "Bonus & THR", icon: "gift", color: "#EBCB8B" }, // nord13 Yellow
    { name: "Investasi & Dividen", icon: "trending-up", color: "#88C0D0" }, // nord8 Ice Blue
    { name: "Freelance & Bisnis", icon: "laptop", color: "#81A1C1" }, // nord9 Glacier Blue
    { name: "Pemasukan Lainnya", icon: "piggy-bank", color: "#B48EAD" }, // nord15 Purple
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
      color: "#A3BE8C", // nord14 Green
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
      color: "#88C0D0", // nord8 Frost Ice Blue
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

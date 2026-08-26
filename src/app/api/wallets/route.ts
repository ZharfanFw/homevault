import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, wallets, transactions } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const whereClause = includeArchived
      ? eq(wallets.userId, user.id)
      : and(eq(wallets.userId, user.id), eq(wallets.isArchived, false));

    const userWallets = db.select().from(wallets).where(whereClause).all();

    // Fetch all user transactions to compute dynamic balances accurately
    const userTransactions = db
      .select({
        walletId: transactions.walletId,
        destinationWalletId: transactions.destinationWalletId,
        type: transactions.type,
        amount: transactions.amount,
      })
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .all();

    // Calculate current balance for each wallet
    const enrichedWallets = userWallets.map((wallet) => {
      let balance = wallet.initialBalance;

      for (const t of userTransactions) {
        if (t.walletId === wallet.id) {
          if (t.type === "EXPENSE") {
            balance -= t.amount;
          } else if (t.type === "INCOME") {
            balance += t.amount;
          } else if (t.type === "TRANSFER") {
            balance -= t.amount;
          }
        }
        if (t.destinationWalletId === wallet.id && t.type === "TRANSFER") {
          balance += t.amount;
        }
      }

      return {
        ...wallet,
        currentBalance: balance,
      };
    });

    const totalNetWorth = enrichedWallets
      .filter((w) => !w.isArchived)
      .reduce((acc, w) => acc + w.currentBalance, 0);

    return NextResponse.json({
      wallets: enrichedWallets,
      totalNetWorth,
      currency: user.currency,
    });
  } catch (error) {
    console.error("Fetch wallets error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar dompet." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, type, initialBalance, color, icon } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nama dompet wajib diisi." },
        { status: 400 }
      );
    }

    const newWallet = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: name.trim(),
      type: type || "BANK",
      initialBalance: parseInt(initialBalance, 10) || 0,
      color: color || "#3b82f6",
      icon: icon || "wallet",
      isArchived: false,
      createdAt: new Date(),
    };

    db.insert(wallets).values(newWallet).run();

    return NextResponse.json({
      success: true,
      wallet: {
        ...newWallet,
        currentBalance: newWallet.initialBalance,
      },
    });
  } catch (error) {
    console.error("Create wallet error:", error);
    return NextResponse.json(
      { error: "Gagal membuat dompet baru." },
      { status: 500 }
    );
  }
}

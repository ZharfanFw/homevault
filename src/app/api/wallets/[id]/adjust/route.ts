import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, wallets, categories, transactions } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getLocalDateString } from "@/lib/utils/format";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { targetBalance, date, notes } = body;

    if (
      targetBalance === undefined ||
      targetBalance === null ||
      isNaN(Number(targetBalance))
    ) {
      return NextResponse.json(
        { error: "Target saldo tidak valid." },
        { status: 400 }
      );
    }

    const wallet = db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, user.id)))
      .get();

    if (!wallet) {
      return NextResponse.json(
        { error: "Dompet tidak ditemukan." },
        { status: 404 }
      );
    }

    // Fetch user transactions to calculate dynamic current balance
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

    let currentBalance = wallet.initialBalance;
    for (const t of userTransactions) {
      if (t.walletId === wallet.id) {
        if (t.type === "EXPENSE") {
          currentBalance -= t.amount;
        } else if (t.type === "INCOME") {
          currentBalance += t.amount;
        } else if (t.type === "TRANSFER") {
          currentBalance -= t.amount;
        }
      }
      if (t.destinationWalletId === wallet.id && t.type === "TRANSFER") {
        currentBalance += t.amount;
      }
    }

    const target = Math.round(Number(targetBalance));
    const diff = target - currentBalance;

    if (diff === 0) {
      return NextResponse.json({
        success: true,
        message: "Saldo sudah sesuai.",
        currentBalance,
        newBalance: currentBalance,
        adjustmentAmount: 0,
      });
    }

    const type: "INCOME" | "EXPENSE" = diff > 0 ? "INCOME" : "EXPENSE";
    const amount = Math.abs(diff);

    // Find or create "Penyesuaian Saldo" category for user
    let category = db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, user.id),
          eq(categories.name, "Penyesuaian Saldo"),
          eq(categories.type, type)
        )
      )
      .get();

    if (!category) {
      const newCategoryId = crypto.randomUUID();
      const newCategory = {
        id: newCategoryId,
        userId: user.id,
        name: "Penyesuaian Saldo",
        type,
        icon: type === "INCOME" ? "trending-up" : "more-horizontal",
        color: type === "INCOME" ? "#A3BE8C" : "#BF616A",
        createdAt: new Date(),
      };
      db.insert(categories).values(newCategory).run();
      category = newCategory;
    }

    const txDate =
      date && typeof date === "string" && date.trim()
        ? date.trim()
        : getLocalDateString();
    const txNotes =
      notes && typeof notes === "string" && notes.trim()
        ? notes.trim()
        : `Penyesuaian saldo ${wallet.name}`;

    const transactionId = crypto.randomUUID();
    const newTransaction = {
      id: transactionId,
      userId: user.id,
      walletId: wallet.id,
      destinationWalletId: null,
      categoryId: category.id,
      type,
      amount,
      date: txDate,
      notes: txNotes,
      createdAt: new Date(),
    };

    db.insert(transactions).values(newTransaction).run();

    return NextResponse.json({
      success: true,
      newBalance: target,
      adjustmentAmount: diff,
      transactionId,
    });
  } catch (error) {
    console.error("Adjust wallet balance error:", error);
    return NextResponse.json(
      { error: "Gagal menyesuaikan saldo dompet." },
      { status: 500 }
    );
  }
}

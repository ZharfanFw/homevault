import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  db,
  sqlite,
  savingsGoals,
  savingsAllocationLogs,
  wallets,
  transactions,
} from "@/lib/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { enrichGoalWithCoin } from "@/lib/gamification/coinEngine";

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
    const { type, amount, walletId, date, notes } = body;

    if (type !== "DEPOSIT" && type !== "WITHDRAW") {
      return NextResponse.json(
        { error: "Tipe alokasi tidak valid (DEPOSIT atau WITHDRAW)." },
        { status: 400 }
      );
    }

    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Nominal harus lebih dari 0." },
        { status: 400 }
      );
    }

    if (!walletId) {
      return NextResponse.json(
        { error: "Dompet wajib dipilih." },
        { status: 400 }
      );
    }

    // Verify goal exists and belongs to user
    const goal = db
      .select()
      .from(savingsGoals)
      .where(
        and(eq(savingsGoals.id, id), eq(savingsGoals.userId, user.id))
      )
      .get();

    if (!goal) {
      return NextResponse.json(
        { error: "Target tabungan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Verify wallet exists and belongs to user
    const wallet = db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, walletId), eq(wallets.userId, user.id)))
      .get();

    if (!wallet) {
      return NextResponse.json(
        { error: "Dompet tidak ditemukan." },
        { status: 404 }
      );
    }

    // Check balance if deposit
    if (type === "DEPOSIT") {
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
          if (t.type === "EXPENSE" || t.type === "TRANSFER") {
            currentBalance -= t.amount;
          } else if (t.type === "INCOME") {
            currentBalance += t.amount;
          }
        }
        if (t.destinationWalletId === wallet.id && t.type === "TRANSFER") {
          currentBalance += t.amount;
        }
      }

      if (currentBalance < parsedAmount) {
        return NextResponse.json(
          {
            error: `Saldo dompet ${wallet.name} tidak mencukupi (Tersedia: Rp ${currentBalance.toLocaleString(
              "id-ID"
            )}).`,
          },
          { status: 400 }
        );
      }
    }

    // Check goal amount if withdraw
    if (type === "WITHDRAW") {
      if (goal.currentAmount < parsedAmount) {
        return NextResponse.json(
          {
            error: `Saldo tabungan saat ini (Rp ${goal.currentAmount.toLocaleString(
              "id-ID"
            )}) tidak mencukupi untuk penarikan ini.`,
          },
          { status: 400 }
        );
      }
    }

    const txId = crypto.randomUUID();
    const logId = crypto.randomUUID();
    const allocDate = date || new Date().toISOString().split("T")[0];

    let newCurrentAmount = goal.currentAmount;
    let newStatus: "IN_PROGRESS" | "COMPLETED" = goal.status;
    let newPeakAmount = goal.peakAmount || goal.currentAmount;
    let completedAt = goal.completedAt;

    if (type === "DEPOSIT") {
      newCurrentAmount += parsedAmount;
      newPeakAmount = Math.max(newPeakAmount, newCurrentAmount);
      if (newCurrentAmount >= goal.targetAmount) {
        newStatus = "COMPLETED";
        if (!completedAt) {
          completedAt = new Date();
        }
      }
    } else {
      newCurrentAmount -= parsedAmount;
      // Peak locking: newPeakAmount remains intact!
      if (newCurrentAmount < goal.targetAmount) {
        newStatus = "IN_PROGRESS";
      }
    }

    // Execute atomic transaction
    const executeAllocation = sqlite.transaction(() => {
      // 1. Insert real transaction
      db.insert(transactions)
        .values({
          id: txId,
          userId: user.id,
          walletId: wallet.id,
          categoryId: null,
          destinationWalletId: null,
          type: type === "DEPOSIT" ? "EXPENSE" : "INCOME",
          amount: parsedAmount,
          date: allocDate,
          notes:
            type === "DEPOSIT"
              ? `[Setor Tabungan] ${goal.name}${notes ? ` - ${notes}` : ""}`
              : `[Tarik Tabungan] ${goal.name}${notes ? ` - ${notes}` : ""}`,
          createdAt: new Date(),
        })
        .run();

      // 2. Insert savings allocation log
      db.insert(savingsAllocationLogs)
        .values({
          id: logId,
          goalId: goal.id,
          userId: user.id,
          walletId: wallet.id,
          transactionId: txId,
          type: type,
          amount: parsedAmount,
          date: allocDate,
          notes: notes?.trim() || null,
          createdAt: new Date(),
        })
        .run();

      // 3. Update savings goal current amount, peak amount, status and completedAt
      db.update(savingsGoals)
        .set({
          currentAmount: newCurrentAmount,
          peakAmount: newPeakAmount,
          status: newStatus,
          completedAt,
        })
        .where(eq(savingsGoals.id, goal.id))
        .run();
    });

    executeAllocation();

    const coinInfo = enrichGoalWithCoin({
      targetAmount: goal.targetAmount,
      currentAmount: newCurrentAmount,
      peakAmount: newPeakAmount,
      isFlawless: goal.isFlawless,
      completedAt,
    });

    return NextResponse.json({
      success: true,
      currentAmount: newCurrentAmount,
      peakAmount: newPeakAmount,
      status: newStatus,
      transactionId: txId,
      coinTier: coinInfo.coinTier,
      coinDetails: coinInfo.coinDetails,
      nextMilestone: coinInfo.nextMilestone,
    });
  } catch (error) {
    console.error("Allocate goal error:", error);
    return NextResponse.json(
      { error: "Gagal memproses alokasi tabungan." },
      { status: 500 }
    );
  }
}

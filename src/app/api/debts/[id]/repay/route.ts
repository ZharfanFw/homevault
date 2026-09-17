import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  db,
  sqlite,
  debtsLoans,
  debtRepayments,
  wallets,
  transactions,
} from "@/lib/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

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
    const { amount, walletId, paymentDate, notes } = await req.json();

    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Nominal pembayaran harus lebih dari 0." },
        { status: 400 }
      );
    }

    if (!walletId) {
      return NextResponse.json(
        { error: "Dompet wajib dipilih." },
        { status: 400 }
      );
    }

    const debt = db
      .select()
      .from(debtsLoans)
      .where(
        and(eq(debtsLoans.id, id), eq(debtsLoans.userId, user.id))
      )
      .get();

    if (!debt) {
      return NextResponse.json(
        { error: "Data utang piutang tidak ditemukan." },
        { status: 404 }
      );
    }

    if (debt.status === "SETTLED") {
      return NextResponse.json(
        { error: "Tagihan ini sudah berstatus lunas." },
        { status: 400 }
      );
    }

    if (parsedAmount > debt.remainingAmount) {
      return NextResponse.json(
        {
          error: `Nominal melebihi sisa tagihan (Sisa: Rp ${debt.remainingAmount.toLocaleString(
            "id-ID"
          )}).`,
        },
        { status: 400 }
      );
    }

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

    // If payable (bayar utang), verify wallet balance
    if (debt.type === "PAYABLE") {
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
            error: `Saldo dompet ${wallet.name} tidak mencukupi untuk pembayaran ini (Tersedia: Rp ${currentBalance.toLocaleString(
              "id-ID"
            )}).`,
          },
          { status: 400 }
        );
      }
    }

    const txId = crypto.randomUUID();
    const repId = crypto.randomUUID();
    const date = paymentDate || new Date().toISOString().split("T")[0];

    const newRemaining = Math.max(0, debt.remainingAmount - parsedAmount);
    const newStatus = newRemaining === 0 ? ("SETTLED" as const) : ("PARTIALLY_PAID" as const);

    const executeRepay = sqlite.transaction(() => {
      // 1. Insert real transaction
      db.insert(transactions)
        .values({
          id: txId,
          userId: user.id,
          walletId: wallet.id,
          categoryId: null,
          destinationWalletId: null,
          type: debt.type === "PAYABLE" ? "EXPENSE" : "INCOME",
          amount: parsedAmount,
          date,
          notes:
            debt.type === "PAYABLE"
              ? `[Cicilan Utang] Ke ${debt.personName}${notes ? ` - ${notes}` : ""}`
              : `[Cicilan Piutang] Dari ${debt.personName}${notes ? ` - ${notes}` : ""}`,
          createdAt: new Date(),
        })
        .run();

      // 2. Insert debt repayment record
      db.insert(debtRepayments)
        .values({
          id: repId,
          debtId: debt.id,
          userId: user.id,
          walletId: wallet.id,
          transactionId: txId,
          amount: parsedAmount,
          paymentDate: date,
          notes: notes?.trim() || null,
          createdAt: new Date(),
        })
        .run();

      // 3. Update debt record
      db.update(debtsLoans)
        .set({
          remainingAmount: newRemaining,
          status: newStatus,
        })
        .where(eq(debtsLoans.id, debt.id))
        .run();
    });

    executeRepay();

    return NextResponse.json({
      success: true,
      remainingAmount: newRemaining,
      status: newStatus,
      transactionId: txId,
    });
  } catch (error) {
    console.error("Repay debt error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pembayaran cicilan." },
      { status: 500 }
    );
  }
}

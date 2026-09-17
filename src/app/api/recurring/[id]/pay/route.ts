import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  db,
  sqlite,
  recurringTransactions,
  recurringLogs,
  transactions,
} from "@/lib/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { calculateNextDueDate } from "@/lib/utils/recurring";

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
    const body = await req.json().catch(() => ({}));
    const customDate = body.paymentDate || new Date().toISOString().split("T")[0];
    const customWalletId = body.walletId;

    const recurring = db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.id, id),
          eq(recurringTransactions.userId, user.id)
        )
      )
      .get();

    if (!recurring) {
      return NextResponse.json(
        { error: "Transaksi berulang tidak ditemukan." },
        { status: 404 }
      );
    }

    const targetWalletId = customWalletId || recurring.walletId;
    const currentDueDate = recurring.nextDueDate;
    const nextDueDate = calculateNextDueDate(
      currentDueDate,
      recurring.frequency
    );

    const txId = crypto.randomUUID();
    const logId = crypto.randomUUID();

    // Execute atomically via SQLite Transaction
    const executePayment = sqlite.transaction(() => {
      // 1. Insert real transaction record
      db.insert(transactions)
        .values({
          id: txId,
          userId: user.id,
          walletId: targetWalletId,
          categoryId: recurring.categoryId,
          destinationWalletId: null,
          type: recurring.type,
          amount: recurring.amount,
          date: customDate,
          notes: `[Tagihan Rutin] ${recurring.name}${
            recurring.notes ? ` - ${recurring.notes}` : ""
          }`,
          createdAt: new Date(),
        })
        .run();

      // 2. Insert recurring log
      db.insert(recurringLogs)
        .values({
          id: logId,
          recurringId: recurring.id,
          userId: user.id,
          dueDate: currentDueDate,
          paidDate: customDate,
          transactionId: txId,
          status: "PAID",
          amount: recurring.amount,
          createdAt: new Date(),
        })
        .run();

      // 3. Advance recurring next_due_date and last_processed_date
      db.update(recurringTransactions)
        .set({
          nextDueDate: nextDueDate,
          lastProcessedDate: customDate,
        })
        .where(eq(recurringTransactions.id, recurring.id))
        .run();
    });

    executePayment();

    return NextResponse.json({
      success: true,
      transactionId: txId,
      nextDueDate,
    });
  } catch (error) {
    console.error("Pay recurring error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pembayaran tagihan." },
      { status: 500 }
    );
  }
}

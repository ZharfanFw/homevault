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
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type"); // PAYABLE, RECEIVABLE

    const debts = db
      .select()
      .from(debtsLoans)
      .where(eq(debtsLoans.userId, user.id))
      .orderBy(desc(debtsLoans.createdAt))
      .all();

    const repayments = db
      .select({
        id: debtRepayments.id,
        debtId: debtRepayments.debtId,
        walletId: debtRepayments.walletId,
        transactionId: debtRepayments.transactionId,
        amount: debtRepayments.amount,
        paymentDate: debtRepayments.paymentDate,
        notes: debtRepayments.notes,
        createdAt: debtRepayments.createdAt,
        walletName: wallets.name,
        walletColor: wallets.color,
      })
      .from(debtRepayments)
      .leftJoin(wallets, eq(debtRepayments.walletId, wallets.id))
      .where(eq(debtRepayments.userId, user.id))
      .orderBy(desc(debtRepayments.createdAt))
      .all();

    const enriched = debts.map((item) => {
      const itemRepayments = repayments.filter((r) => r.debtId === item.id);
      const totalPaid = itemRepayments.reduce((acc, r) => acc + r.amount, 0);
      const progressPercent =
        item.totalAmount > 0
          ? Math.min(100, Math.round((totalPaid / item.totalAmount) * 100))
          : 0;

      return {
        ...item,
        totalPaid,
        progressPercent,
        repayments: itemRepayments,
      };
    });

    const filtered = typeFilter
      ? enriched.filter((d) => d.type === typeFilter)
      : enriched;

    // Aggregates
    const totalPayable = enriched
      .filter((d) => d.type === "PAYABLE" && d.status !== "SETTLED")
      .reduce((sum, d) => sum + d.remainingAmount, 0);

    const totalReceivable = enriched
      .filter((d) => d.type === "RECEIVABLE" && d.status !== "SETTLED")
      .reduce((sum, d) => sum + d.remainingAmount, 0);

    const netBalance = totalReceivable - totalPayable;

    return NextResponse.json({
      debts: filtered,
      totalPayable,
      totalReceivable,
      netBalance,
    });
  } catch (error) {
    console.error("Fetch debts error:", error);
    return NextResponse.json(
      { error: "Gagal memuat catatan utang piutang." },
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

    const {
      type,
      personName,
      totalAmount,
      startDate,
      dueDate,
      notes,
      syncWalletId,
    } = await req.json();

    if (!personName || !personName.trim()) {
      return NextResponse.json(
        { error: "Nama pihak terkait / orang wajib diisi." },
        { status: 400 }
      );
    }

    if (type !== "PAYABLE" && type !== "RECEIVABLE") {
      return NextResponse.json(
        { error: "Tipe harus PAYABLE (Utang) atau RECEIVABLE (Piutang)." },
        { status: 400 }
      );
    }

    const parsedAmount = parseInt(totalAmount, 10);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Nominal total harus lebih dari 0." },
        { status: 400 }
      );
    }

    const debtId = crypto.randomUUID();
    const stDate = startDate || new Date().toISOString().split("T")[0];

    const newDebt = {
      id: debtId,
      userId: user.id,
      type: type as "PAYABLE" | "RECEIVABLE",
      personName: personName.trim(),
      totalAmount: parsedAmount,
      remainingAmount: parsedAmount,
      startDate: stDate,
      dueDate: dueDate || null,
      status: "UNPAID" as const,
      notes: notes?.trim() || null,
      createdAt: new Date(),
    };

    const executeCreate = sqlite.transaction(() => {
      // 1. Insert debt
      db.insert(debtsLoans).values(newDebt).run();

      // 2. If syncWalletId is provided, record initial financial movement
      if (syncWalletId) {
        const txId = crypto.randomUUID();
        if (type === "PAYABLE") {
          // Kita berutang, dapat uang masuk ke dompet
          db.insert(transactions)
            .values({
              id: txId,
              userId: user.id,
              walletId: syncWalletId,
              categoryId: null,
              destinationWalletId: null,
              type: "INCOME",
              amount: parsedAmount,
              date: stDate,
              notes: `[Utang Baru] Pinjaman dari ${personName.trim()}`,
              createdAt: new Date(),
            })
            .run();
        } else {
          // Kita meminjamkan uang, uang keluar dari dompet
          db.insert(transactions)
            .values({
              id: txId,
              userId: user.id,
              walletId: syncWalletId,
              categoryId: null,
              destinationWalletId: null,
              type: "EXPENSE",
              amount: parsedAmount,
              date: stDate,
              notes: `[Piutang Baru] Pinjaman ke ${personName.trim()}`,
              createdAt: new Date(),
            })
            .run();
        }
      }
    });

    executeCreate();

    return NextResponse.json({ success: true, debt: newDebt });
  } catch (error) {
    console.error("Create debt error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data utang piutang." },
      { status: 500 }
    );
  }
}

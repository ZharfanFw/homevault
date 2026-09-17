import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  db,
  recurringTransactions,
  recurringLogs,
  wallets,
  categories,
} from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";
import { getDaysRemaining } from "@/lib/utils/recurring";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // EXPENSE, INCOME
    const status = searchParams.get("status"); // ACTIVE, PAUSED

    const conditions = [eq(recurringTransactions.userId, user.id)];
    if (type === "EXPENSE" || type === "INCOME") {
      conditions.push(eq(recurringTransactions.type, type));
    }
    if (status === "ACTIVE" || status === "PAUSED") {
      conditions.push(eq(recurringTransactions.status, status));
    }

    const list = db
      .select({
        id: recurringTransactions.id,
        userId: recurringTransactions.userId,
        walletId: recurringTransactions.walletId,
        categoryId: recurringTransactions.categoryId,
        name: recurringTransactions.name,
        type: recurringTransactions.type,
        amount: recurringTransactions.amount,
        frequency: recurringTransactions.frequency,
        startDate: recurringTransactions.startDate,
        nextDueDate: recurringTransactions.nextDueDate,
        status: recurringTransactions.status,
        autoCreate: recurringTransactions.autoCreate,
        notes: recurringTransactions.notes,
        lastProcessedDate: recurringTransactions.lastProcessedDate,
        createdAt: recurringTransactions.createdAt,
        walletName: wallets.name,
        walletColor: wallets.color,
        walletIcon: wallets.icon,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
      })
      .from(recurringTransactions)
      .leftJoin(wallets, eq(recurringTransactions.walletId, wallets.id))
      .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(recurringTransactions.nextDueDate)
      .all();

    // Fetch recent 3 logs per recurring for context
    const allLogs = db
      .select()
      .from(recurringLogs)
      .where(eq(recurringLogs.userId, user.id))
      .orderBy(desc(recurringLogs.createdAt))
      .all();

    const enriched = list.map((item) => {
      const daysRemaining = getDaysRemaining(item.nextDueDate);
      const isOverdue = daysRemaining < 0 && item.status === "ACTIVE";
      const logs = allLogs
        .filter((l) => l.recurringId === item.id)
        .slice(0, 3);

      return {
        ...item,
        daysRemaining,
        isOverdue,
        logs,
      };
    });

    return NextResponse.json({ recurring: enriched });
  } catch (error) {
    console.error("Fetch recurring error:", error);
    return NextResponse.json(
      { error: "Gagal memuat transaksi berulang." },
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
      name,
      type,
      amount,
      frequency,
      walletId,
      categoryId,
      startDate,
      nextDueDate,
      autoCreate,
      notes,
    } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nama tagihan / transaksi rutin wajib diisi." },
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

    if (!startDate) {
      return NextResponse.json(
        { error: "Tanggal mulai wajib diisi." },
        { status: 400 }
      );
    }

    const validFrequencies = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
    const validFreq = validFrequencies.includes(frequency) ? frequency : "MONTHLY";

    const newRecurring = {
      id: crypto.randomUUID(),
      userId: user.id,
      walletId,
      categoryId: categoryId || null,
      name: name.trim(),
      type: type === "INCOME" ? ("INCOME" as const) : ("EXPENSE" as const),
      amount: parsedAmount,
      frequency: validFreq as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
      startDate,
      nextDueDate: nextDueDate || startDate,
      status: "ACTIVE" as const,
      autoCreate: Boolean(autoCreate),
      notes: notes?.trim() || null,
      lastProcessedDate: null,
      createdAt: new Date(),
    };

    db.insert(recurringTransactions).values(newRecurring).run();

    return NextResponse.json({ success: true, recurring: newRecurring });
  } catch (error) {
    console.error("Create recurring error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan transaksi berulang." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, budgets, categories, transactions } from "@/lib/db";
import { eq, and, gte, lte } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString(), 10);
    const year = parseInt(searchParams.get("year") || now.getFullYear().toString(), 10);

    const userBudgets = db
      .select({
        id: budgets.id,
        userId: budgets.userId,
        categoryId: budgets.categoryId,
        amountLimit: budgets.amountLimit,
        month: budgets.month,
        year: budgets.year,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(
        and(
          eq(budgets.userId, user.id),
          eq(budgets.month, month),
          eq(budgets.year, year)
        )
      )
      .all();

    // Get actual expense for each category in this month
    const paddedMonth = month.toString().padStart(2, "0");
    const startDateStr = `${year}-${paddedMonth}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${paddedMonth}-${daysInMonth.toString().padStart(2, "0")}`;

    const monthExpenses = db
      .select({
        categoryId: transactions.categoryId,
        amount: transactions.amount,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, user.id),
          eq(transactions.type, "EXPENSE"),
          gte(transactions.date, startDateStr),
          lte(transactions.date, endDateStr)
        )
      )
      .all();

    const spentMap: Record<string, number> = {};
    for (const exp of monthExpenses) {
      if (exp.categoryId) {
        spentMap[exp.categoryId] = (spentMap[exp.categoryId] || 0) + exp.amount;
      }
    }

    const enrichedBudgets = userBudgets.map((b) => {
      const spent = spentMap[b.categoryId] || 0;
      const percentage = b.amountLimit > 0 ? (spent / b.amountLimit) * 100 : 0;
      const remaining = b.amountLimit - spent;

      return {
        ...b,
        spent,
        remaining,
        percentage: Math.round(percentage),
      };
    });

    return NextResponse.json({ budgets: enrichedBudgets });
  } catch (error) {
    console.error("Fetch budgets error:", error);
    return NextResponse.json(
      { error: "Gagal memuat anggaran." },
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

    const { categoryId, amountLimit, month, year } = await req.json();

    const parsedLimit = parseInt(amountLimit, 10);
    if (!parsedLimit || parsedLimit <= 0) {
      return NextResponse.json(
        { error: "Batas anggaran harus lebih dari 0." },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "Kategori wajib dipilih." },
        { status: 400 }
      );
    }

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    // Check if budget for this category and month/year already exists
    const existing = db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, user.id),
          eq(budgets.categoryId, categoryId),
          eq(budgets.month, parsedMonth),
          eq(budgets.year, parsedYear)
        )
      )
      .get();

    if (existing) {
      db.update(budgets)
        .set({ amountLimit: parsedLimit })
        .where(eq(budgets.id, existing.id))
        .run();

      return NextResponse.json({ success: true, id: existing.id });
    }

    const newBudgetId = crypto.randomUUID();
    db.insert(budgets)
      .values({
        id: newBudgetId,
        userId: user.id,
        categoryId,
        amountLimit: parsedLimit,
        month: parsedMonth,
        year: parsedYear,
        createdAt: new Date(),
      })
      .run();

    return NextResponse.json({ success: true, id: newBudgetId });
  } catch (error) {
    console.error("Save budget error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan anggaran." },
      { status: 500 }
    );
  }
}

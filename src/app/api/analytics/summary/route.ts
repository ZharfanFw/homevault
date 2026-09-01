import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, transactions, wallets, categories } from "@/lib/db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

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

    const paddedMonth = month.toString().padStart(2, "0");
    const startDateStr = `${year}-${paddedMonth}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${paddedMonth}-${daysInMonth.toString().padStart(2, "0")}`;

    // 1. Calculate Net Worth from wallets
    const userWallets = db
      .select()
      .from(wallets)
      .where(and(eq(wallets.userId, user.id), eq(wallets.isArchived, false)))
      .all();

    const allTx = db
      .select({
        walletId: transactions.walletId,
        destinationWalletId: transactions.destinationWalletId,
        type: transactions.type,
        amount: transactions.amount,
      })
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .all();

    let netWorth = 0;
    for (const w of userWallets) {
      let bal = w.initialBalance;
      for (const t of allTx) {
        if (t.walletId === w.id) {
          if (t.type === "EXPENSE" || t.type === "TRANSFER") {
            bal -= t.amount;
          } else if (t.type === "INCOME") {
            bal += t.amount;
          }
        }
        if (t.destinationWalletId === w.id && t.type === "TRANSFER") {
          bal += t.amount;
        }
      }
      netWorth += bal;
    }

    // 2. Fetch transactions for the current month
    const monthlyTransactions = db
      .select({
        id: transactions.id,
        walletId: transactions.walletId,
        destinationWalletId: transactions.destinationWalletId,
        categoryId: transactions.categoryId,
        type: transactions.type,
        amount: transactions.amount,
        date: transactions.date,
        notes: transactions.notes,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, user.id),
          gte(transactions.date, startDateStr),
          lte(transactions.date, endDateStr)
        )
      )
      .all();

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    // Aggregate category expenses
    const categoryTotals: Record<
      string,
      {
        categoryId: string;
        categoryName: string;
        categoryIcon: string;
        categoryColor: string;
        totalAmount: number;
      }
    > = {};

    // Daily breakdown map (1 to daysInMonth)
    const dailyMap: Record<number, { day: number; expense: number; income: number }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = { day: d, expense: 0, income: 0 };
    }

    for (const t of monthlyTransactions) {
      const txDay = parseInt(t.date.split("-")[2], 10);

      if (t.type === "EXPENSE") {
        monthlyExpense += t.amount;
        if (dailyMap[txDay]) {
          dailyMap[txDay].expense += t.amount;
        }

        const catKey = t.categoryId || "uncategorized";
        if (!categoryTotals[catKey]) {
          categoryTotals[catKey] = {
            categoryId: t.categoryId || "",
            categoryName: t.categoryName || "Lainnya",
            categoryIcon: t.categoryIcon || "more-horizontal",
            categoryColor: t.categoryColor || "#64748b",
            totalAmount: 0,
          };
        }
        categoryTotals[catKey].totalAmount += t.amount;
      } else if (t.type === "INCOME") {
        monthlyIncome += t.amount;
        if (dailyMap[txDay]) {
          dailyMap[txDay].income += t.amount;
        }
      }
    }

    const netCashflow = monthlyIncome - monthlyExpense;

    const categoryBreakdown = Object.values(categoryTotals)
      .map((cat) => ({
        ...cat,
        percentage:
          monthlyExpense > 0
            ? Math.round((cat.totalAmount / monthlyExpense) * 100)
            : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const dailyTrends = Object.values(dailyMap);

    // 3. Fetch recent 5 transactions
    const rawRecent = db
      .select({
        id: transactions.id,
        walletId: transactions.walletId,
        destinationWalletId: transactions.destinationWalletId,
        categoryId: transactions.categoryId,
        type: transactions.type,
        amount: transactions.amount,
        date: transactions.date,
        notes: transactions.notes,
        createdAt: transactions.createdAt,
        walletName: wallets.name,
        walletColor: wallets.color,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
      })
      .from(transactions)
      .leftJoin(wallets, eq(transactions.walletId, wallets.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(5)
      .all();

    const destIds = rawRecent
      .filter((t) => t.type === "TRANSFER" && t.destinationWalletId)
      .map((t) => t.destinationWalletId as string);

    let destMap: Record<string, string> = {};
    if (destIds.length > 0) {
      const dWallets = db
        .select({ id: wallets.id, name: wallets.name })
        .from(wallets)
        .where(
          and(
            eq(wallets.userId, user.id),
            sql`${wallets.id} IN (${sql.join(
              destIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
        )
        .all();
      for (const dw of dWallets) {
        destMap[dw.id] = dw.name;
      }
    }

    const recentTransactions = rawRecent.map((t) => ({
      ...t,
      destinationWalletName: t.destinationWalletId
        ? destMap[t.destinationWalletId] || null
        : null,
    }));

    return NextResponse.json({
      month,
      year,
      netWorth,
      monthlyIncome,
      monthlyExpense,
      netCashflow,
      categoryBreakdown,
      dailyTrends,
      recentTransactions,
    });
  } catch (error) {
    console.error("Analytics summary error:", error);
    return NextResponse.json(
      { error: "Gagal memuat ringkasan analitik." },
      { status: 500 }
    );
  }
}

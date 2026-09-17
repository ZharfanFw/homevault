import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, transactions, categories } from "@/lib/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { getMonthName } from "@/lib/utils/format";

export interface MonthlyAnnualData {
  month: number;
  monthName: string;
  shortMonthName: string;
  income: number;
  expense: number;
  net: number;
  savingsRate: number;
}

export interface PeakMonthDetails {
  month: number;
  monthName: string;
  expense: number;
  income: number;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    amount: number;
    percentage: number;
  }>;
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const targetYear = parseInt(searchParams.get("year") || now.getFullYear().toString(), 10);

    const startDateStr = `${targetYear}-01-01`;
    const endDateStr = `${targetYear}-12-31`;

    // Fetch all transactions for this user within target year (indexed query)
    const yearTransactions = db
      .select({
        id: transactions.id,
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

    // 1. Initialize 12 months data
    const shortMonths = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];

    const monthlyMap: Record<number, { income: number; expense: number }> = {};
    for (let m = 1; m <= 12; m++) {
      monthlyMap[m] = { income: 0, expense: 0 };
    }

    // Category aggregations for the whole year
    const yearlyCategoryTotals: Record<
      string,
      {
        categoryId: string;
        categoryName: string;
        categoryIcon: string;
        categoryColor: string;
        totalAmount: number;
      }
    > = {};

    // Month-specific category map for peak month detection
    const monthCategoryMap: Record<
      number,
      Record<string, { categoryId: string; categoryName: string; categoryIcon: string; categoryColor: string; amount: number }>
    > = {};
    for (let m = 1; m <= 12; m++) {
      monthCategoryMap[m] = {};
    }

    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of yearTransactions) {
      // Parse month from date YYYY-MM-DD
      const parts = t.date.split("-");
      const m = parseInt(parts[1], 10);
      if (m >= 1 && m <= 12) {
        if (t.type === "INCOME") {
          monthlyMap[m].income += t.amount;
          totalIncome += t.amount;
        } else if (t.type === "EXPENSE") {
          monthlyMap[m].expense += t.amount;
          totalExpense += t.amount;

          // Track category total for the year
          const catKey = t.categoryId || "uncategorized";
          if (!yearlyCategoryTotals[catKey]) {
            yearlyCategoryTotals[catKey] = {
              categoryId: t.categoryId || "",
              categoryName: t.categoryName || "Lainnya",
              categoryIcon: t.categoryIcon || "more-horizontal",
              categoryColor: t.categoryColor || "#64748b",
              totalAmount: 0,
            };
          }
          yearlyCategoryTotals[catKey].totalAmount += t.amount;

          // Track category total for this specific month
          if (!monthCategoryMap[m][catKey]) {
            monthCategoryMap[m][catKey] = {
              categoryId: t.categoryId || "",
              categoryName: t.categoryName || "Lainnya",
              categoryIcon: t.categoryIcon || "more-horizontal",
              categoryColor: t.categoryColor || "#64748b",
              amount: 0,
            };
          }
          monthCategoryMap[m][catKey].amount += t.amount;
        }
      }
    }

    // Build monthly breakdown list
    const monthlyData: MonthlyAnnualData[] = [];
    let peakMonthIndex = 1;
    let maxMonthlyExpense = -1;

    for (let m = 1; m <= 12; m++) {
      const inc = monthlyMap[m].income;
      const exp = monthlyMap[m].expense;
      const net = inc - exp;
      const savingsRate = inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0;

      monthlyData.push({
        month: m,
        monthName: getMonthName(m - 1),
        shortMonthName: shortMonths[m - 1],
        income: inc,
        expense: exp,
        net,
        savingsRate,
      });

      if (exp > maxMonthlyExpense) {
        maxMonthlyExpense = exp;
        peakMonthIndex = m;
      }
    }

    // 2. Metrics calculation
    const netSavings = totalIncome - totalExpense;
    const annualSavingsRate =
      totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let elapsedMonths = 12;
    if (targetYear === currentYear) {
      elapsedMonths = Math.max(1, currentMonth);
    } else if (targetYear > currentYear) {
      elapsedMonths = 0;
    }

    const averageMonthlyExpense =
      elapsedMonths > 0 ? Math.round(totalExpense / elapsedMonths) : 0;
    const averageMonthlyIncome =
      elapsedMonths > 0 ? Math.round(totalIncome / elapsedMonths) : 0;

    // 3. Peak Month Details (Bulan Paling Boros)
    let peakMonthDetails: PeakMonthDetails | null = null;
    if (maxMonthlyExpense > 0) {
      const peakCats = Object.values(monthCategoryMap[peakMonthIndex])
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)
        .map((cat) => ({
          ...cat,
          percentage:
            maxMonthlyExpense > 0 ? Math.round((cat.amount / maxMonthlyExpense) * 100) : 0,
        }));

      peakMonthDetails = {
        month: peakMonthIndex,
        monthName: getMonthName(peakMonthIndex - 1),
        expense: maxMonthlyExpense,
        income: monthlyMap[peakMonthIndex].income,
        topCategories: peakCats,
      };
    }

    // 4. Yearly Category Breakdown
    const categoryBreakdown = Object.values(yearlyCategoryTotals)
      .map((cat) => ({
        ...cat,
        percentage:
          totalExpense > 0 ? Math.round((cat.totalAmount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return NextResponse.json({
      year: targetYear,
      totalIncome,
      totalExpense,
      netSavings,
      annualSavingsRate,
      elapsedMonths,
      averageMonthlyExpense,
      averageMonthlyIncome,
      peakMonth: peakMonthDetails,
      monthlyData,
      categoryBreakdown,
    });
  } catch (error) {
    console.error("Fetch annual analytics error:", error);
    return NextResponse.json(
      { error: "Gagal memuat analitik tahunan." },
      { status: 500 }
    );
  }
}

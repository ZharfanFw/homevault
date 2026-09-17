import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  db,
  savingsGoals,
  savingsAllocationLogs,
  wallets,
} from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = db
      .select({
        id: savingsGoals.id,
        userId: savingsGoals.userId,
        targetWalletId: savingsGoals.targetWalletId,
        name: savingsGoals.name,
        targetAmount: savingsGoals.targetAmount,
        currentAmount: savingsGoals.currentAmount,
        targetDate: savingsGoals.targetDate,
        color: savingsGoals.color,
        icon: savingsGoals.icon,
        status: savingsGoals.status,
        createdAt: savingsGoals.createdAt,
        targetWalletName: wallets.name,
        targetWalletColor: wallets.color,
        targetWalletIcon: wallets.icon,
      })
      .from(savingsGoals)
      .leftJoin(wallets, eq(savingsGoals.targetWalletId, wallets.id))
      .where(eq(savingsGoals.userId, user.id))
      .orderBy(desc(savingsGoals.createdAt))
      .all();

    const allLogs = db
      .select({
        id: savingsAllocationLogs.id,
        goalId: savingsAllocationLogs.goalId,
        walletId: savingsAllocationLogs.walletId,
        type: savingsAllocationLogs.type,
        amount: savingsAllocationLogs.amount,
        date: savingsAllocationLogs.date,
        notes: savingsAllocationLogs.notes,
        createdAt: savingsAllocationLogs.createdAt,
        walletName: wallets.name,
      })
      .from(savingsAllocationLogs)
      .leftJoin(wallets, eq(savingsAllocationLogs.walletId, wallets.id))
      .where(eq(savingsAllocationLogs.userId, user.id))
      .orderBy(desc(savingsAllocationLogs.createdAt))
      .all();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enrichedGoals = goals.map((g) => {
      const percentage =
        g.targetAmount > 0
          ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
          : 0;
      const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);

      let recommendedMonthly = 0;
      let daysRemaining: number | null = null;
      if (g.targetDate) {
        const [y, m, d] = g.targetDate.split("-").map((num) => parseInt(num, 10));
        const targetDate = new Date(y, m - 1, d);
        targetDate.setHours(0, 0, 0, 0);

        const diffTime = targetDate.getTime() - today.getTime();
        daysRemaining = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

        const monthsRemaining =
          (targetDate.getFullYear() - today.getFullYear()) * 12 +
          (targetDate.getMonth() - today.getMonth()) +
          (targetDate.getDate() >= today.getDate() ? 1 : 0);

        if (remainingAmount > 0) {
          if (monthsRemaining > 1) {
            recommendedMonthly = Math.ceil(remainingAmount / monthsRemaining);
          } else {
            recommendedMonthly = remainingAmount;
          }
        }
      }

      const logs = allLogs.filter((l) => l.goalId === g.id);

      return {
        ...g,
        percentage,
        remainingAmount,
        daysRemaining,
        recommendedMonthly,
        logs,
      };
    });

    const totalSaved = enrichedGoals.reduce(
      (sum, g) => sum + g.currentAmount,
      0
    );
    const totalTarget = enrichedGoals.reduce(
      (sum, g) => sum + g.targetAmount,
      0
    );

    return NextResponse.json({
      goals: enrichedGoals,
      totalSaved,
      totalTarget,
    });
  } catch (error) {
    console.error("Fetch goals error:", error);
    return NextResponse.json(
      { error: "Gagal memuat target tabungan." },
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
      targetAmount,
      targetDate,
      color,
      icon,
      targetWalletId,
    } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nama target tabungan wajib diisi." },
        { status: 400 }
      );
    }

    const parsedTarget = parseInt(targetAmount, 10);
    if (!parsedTarget || parsedTarget <= 0) {
      return NextResponse.json(
        { error: "Target nominal harus lebih dari 0." },
        { status: 400 }
      );
    }

    const newGoal = {
      id: crypto.randomUUID(),
      userId: user.id,
      targetWalletId: targetWalletId || null,
      name: name.trim(),
      targetAmount: parsedTarget,
      currentAmount: 0,
      targetDate: targetDate || null,
      color: color || "#88C0D0",
      icon: icon || "piggy-bank",
      status: "IN_PROGRESS" as const,
      createdAt: new Date(),
    };

    db.insert(savingsGoals).values(newGoal).run();

    return NextResponse.json({ success: true, goal: newGoal });
  } catch (error) {
    console.error("Create goal error:", error);
    return NextResponse.json(
      { error: "Gagal membuat target tabungan." },
      { status: 500 }
    );
  }
}

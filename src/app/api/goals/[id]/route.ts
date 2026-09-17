import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, savingsGoals, savingsAllocationLogs } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function PUT(
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

    const existing = db
      .select()
      .from(savingsGoals)
      .where(
        and(eq(savingsGoals.id, id), eq(savingsGoals.userId, user.id))
      )
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Target tabungan tidak ditemukan." },
        { status: 404 }
      );
    }

    const updates: Partial<typeof savingsGoals.$inferInsert> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.targetAmount !== undefined) {
      const parsed = parseInt(body.targetAmount, 10);
      if (parsed > 0) updates.targetAmount = parsed;
    }
    if (body.targetDate !== undefined) updates.targetDate = body.targetDate || null;
    if (body.color !== undefined) updates.color = body.color;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.targetWalletId !== undefined) updates.targetWalletId = body.targetWalletId || null;
    if (body.status !== undefined) updates.status = body.status;

    db.update(savingsGoals)
      .set(updates)
      .where(eq(savingsGoals.id, id))
      .run();

    return NextResponse.json({ success: true, updated: updates });
  } catch (error) {
    console.error("Update goal error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui target tabungan." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = db
      .select()
      .from(savingsGoals)
      .where(
        and(eq(savingsGoals.id, id), eq(savingsGoals.userId, user.id))
      )
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Target tabungan tidak ditemukan." },
        { status: 404 }
      );
    }

    db.delete(savingsAllocationLogs)
      .where(eq(savingsAllocationLogs.goalId, id))
      .run();

    db.delete(savingsGoals)
      .where(eq(savingsGoals.id, id))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete goal error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus target tabungan." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, recurringTransactions, recurringLogs } from "@/lib/db";
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
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.id, id),
          eq(recurringTransactions.userId, user.id)
        )
      )
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Transaksi berulang tidak ditemukan." },
        { status: 404 }
      );
    }

    const updates: Partial<typeof recurringTransactions.$inferInsert> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.amount !== undefined) updates.amount = parseInt(body.amount, 10);
    if (body.frequency !== undefined) updates.frequency = body.frequency;
    if (body.walletId !== undefined) updates.walletId = body.walletId;
    if (body.categoryId !== undefined) updates.categoryId = body.categoryId || null;
    if (body.type !== undefined) updates.type = body.type;
    if (body.startDate !== undefined) updates.startDate = body.startDate;
    if (body.nextDueDate !== undefined) updates.nextDueDate = body.nextDueDate;
    if (body.status !== undefined) updates.status = body.status;
    if (body.autoCreate !== undefined) updates.autoCreate = Boolean(body.autoCreate);
    if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;

    db.update(recurringTransactions)
      .set(updates)
      .where(eq(recurringTransactions.id, id))
      .run();

    return NextResponse.json({ success: true, updated: updates });
  } catch (error) {
    console.error("Update recurring error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui transaksi berulang." },
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
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.id, id),
          eq(recurringTransactions.userId, user.id)
        )
      )
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Transaksi berulang tidak ditemukan." },
        { status: 404 }
      );
    }

    // Delete logs and recurring item
    db.delete(recurringLogs)
      .where(eq(recurringLogs.recurringId, id))
      .run();

    db.delete(recurringTransactions)
      .where(eq(recurringTransactions.id, id))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete recurring error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus transaksi berulang." },
      { status: 500 }
    );
  }
}

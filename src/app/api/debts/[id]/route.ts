import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, debtsLoans, debtRepayments } from "@/lib/db";
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
      .from(debtsLoans)
      .where(
        and(eq(debtsLoans.id, id), eq(debtsLoans.userId, user.id))
      )
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Data utang piutang tidak ditemukan." },
        { status: 404 }
      );
    }

    const updates: Partial<typeof debtsLoans.$inferInsert> = {};

    if (body.personName !== undefined) updates.personName = body.personName.trim();
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate || null;
    if (body.startDate !== undefined) updates.startDate = body.startDate;
    if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;
    if (body.status !== undefined) updates.status = body.status;

    db.update(debtsLoans)
      .set(updates)
      .where(eq(debtsLoans.id, id))
      .run();

    return NextResponse.json({ success: true, updated: updates });
  } catch (error) {
    console.error("Update debt error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data utang piutang." },
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
      .from(debtsLoans)
      .where(
        and(eq(debtsLoans.id, id), eq(debtsLoans.userId, user.id))
      )
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Data utang piutang tidak ditemukan." },
        { status: 404 }
      );
    }

    db.delete(debtRepayments)
      .where(eq(debtRepayments.debtId, id))
      .run();

    db.delete(debtsLoans)
      .where(eq(debtsLoans.id, id))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete debt error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data utang piutang." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, transactions } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function PATCH(
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

    const existingTx = db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
      .get();

    if (!existingTx) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    const updateData: Partial<typeof transactions.$inferInsert> = {};
    if (body.amount !== undefined) updateData.amount = parseInt(body.amount, 10);
    if (body.walletId !== undefined) updateData.walletId = body.walletId;
    if (body.destinationWalletId !== undefined)
      updateData.destinationWalletId = body.destinationWalletId;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;

    db.update(transactions)
      .set(updateData)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui transaksi." },
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

    const existingTx = db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
      .get();

    if (!existingTx) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    db.delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus transaksi." },
      { status: 500 }
    );
  }
}

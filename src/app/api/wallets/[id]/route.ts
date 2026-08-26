import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, wallets } from "@/lib/db";
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

    const existingWallet = db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, user.id)))
      .get();

    if (!existingWallet) {
      return NextResponse.json(
        { error: "Dompet tidak ditemukan." },
        { status: 404 }
      );
    }

    const updateData: Partial<typeof wallets.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.type !== undefined) updateData.type = body.type;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.initialBalance !== undefined)
      updateData.initialBalance = parseInt(body.initialBalance, 10) || 0;
    if (body.isArchived !== undefined)
      updateData.isArchived = Boolean(body.isArchived);

    db.update(wallets)
      .set(updateData)
      .where(and(eq(wallets.id, id), eq(wallets.userId, user.id)))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update wallet error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui dompet." },
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

    const existingWallet = db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, user.id)))
      .get();

    if (!existingWallet) {
      return NextResponse.json(
        { error: "Dompet tidak ditemukan." },
        { status: 404 }
      );
    }

    db.delete(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, user.id)))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete wallet error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus dompet." },
      { status: 500 }
    );
  }
}

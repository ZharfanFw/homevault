import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, budgets } from "@/lib/db";
import { eq, and } from "drizzle-orm";

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

    const existingBudget = db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, user.id)))
      .get();

    if (!existingBudget) {
      return NextResponse.json(
        { error: "Anggaran tidak ditemukan." },
        { status: 404 }
      );
    }

    db.delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, user.id)))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete budget error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus anggaran." },
      { status: 500 }
    );
  }
}

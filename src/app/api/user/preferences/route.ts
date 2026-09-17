import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updateData: { gamificationEnabled?: boolean } = {};

    if (typeof body.gamificationEnabled === "boolean") {
      updateData.gamificationEnabled = body.gamificationEnabled;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diubah." }, { status: 400 });
    }

    db.update(users)
      .set(updateData)
      .where(eq(users.id, currentUser.id))
      .run();

    return NextResponse.json({
      success: true,
      gamificationEnabled: updateData.gamificationEnabled,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui preferensi pengguna." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repairMinorCrack } from "@/lib/gamification/aegisEngine";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { crackId } = body;

    if (!crackId || typeof crackId !== "string") {
      return NextResponse.json(
        { error: "ID keretakan (crackId) wajib diisi." },
        { status: 400 }
      );
    }

    const result = repairMinorCrack(user.id, crackId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Repair crack error:", error);
    return NextResponse.json(
      { error: "Gagal memperbaiki keretakan perisai." },
      { status: 500 }
    );
  }
}

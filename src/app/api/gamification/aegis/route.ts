import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserAegisSummary } from "@/lib/gamification/aegisEngine";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || undefined; // "YYYY-MM"

    const summary = getUserAegisSummary(user.id, month);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Fetch aegis summary error:", error);
    return NextResponse.json(
      { error: "Gagal memuat status Aegis Barrier." },
      { status: 500 }
    );
  }
}

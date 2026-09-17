import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getUserFrostSummary,
  syncUserFrostShards,
  syncFrostShardForDate,
} from "@/lib/gamification/frostEngine";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = getUserFrostSummary(user.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Fetch frost summary error:", error);
    return NextResponse.json(
      { error: "Gagal memuat status Frost Shards." },
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

    const body = await req.json().catch(() => ({}));
    const { date, lookback } = body;

    if (date && typeof date === "string") {
      const result = syncFrostShardForDate(user.id, date);
      return NextResponse.json({ success: true, result });
    }

    const days = typeof lookback === "number" ? lookback : 30;
    syncUserFrostShards(user.id, days);

    const summary = getUserFrostSummary(user.id);
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Sync frost shards error:", error);
    return NextResponse.json(
      { error: "Gagal menyinkronkan Frost Shards." },
      { status: 500 }
    );
  }
}

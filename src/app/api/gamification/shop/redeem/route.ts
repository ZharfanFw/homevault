import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { redeemShopItem } from "@/lib/gamification/shopEngine";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { itemId } = body;

    if (!itemId || typeof itemId !== "string") {
      return NextResponse.json(
        { error: "Item ID wajib disertakan." },
        { status: 400 }
      );
    }

    const result = redeemShopItem(user.id, itemId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Redeem shop item error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Gagal menukarkan item toko." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getUserInventory,
  applyVoucherToTransaction,
} from "@/lib/gamification/shopEngine";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inventory = getUserInventory(user.id);
    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Fetch inventory error:", error);
    return NextResponse.json(
      { error: "Gagal memuat inventaris Vault." },
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

    const body = await req.json();
    const { redemptionId, transactionId, actualSpentAmount } = body;

    if (!redemptionId || !transactionId || actualSpentAmount === undefined) {
      return NextResponse.json(
        { error: "Parameter redemptionId, transactionId, dan actualSpentAmount wajib diisi." },
        { status: 400 }
      );
    }

    const result = applyVoucherToTransaction(
      user.id,
      redemptionId,
      transactionId,
      parseInt(actualSpentAmount, 10)
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Use voucher error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Gagal mencatat pemakaian voucher." },
      { status: 400 }
    );
  }
}

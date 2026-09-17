import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getUserShopCatalog,
  createUserVoucher,
  deleteUserVoucher,
} from "@/lib/gamification/shopEngine";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const catalog = getUserShopCatalog(user.id);
    return NextResponse.json(catalog);
  } catch (error) {
    console.error("Fetch shop catalog error:", error);
    return NextResponse.json(
      { error: "Gagal memuat katalog The Vault Shop." },
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
    const { name, description, shardCost, userDefinedCap, icon } = body;

    const newVoucher = createUserVoucher(user.id, {
      name,
      description,
      shardCost,
      userDefinedCap,
      icon,
    });

    return NextResponse.json({ success: true, voucher: newVoucher });
  } catch (error: unknown) {
    console.error("Create voucher error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Gagal membuat template voucher hadiah." },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const voucherId = searchParams.get("id");

    if (!voucherId) {
      return NextResponse.json(
        { error: "ID voucher wajib disertakan." },
        { status: 400 }
      );
    }

    const result = deleteUserVoucher(user.id, voucherId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Delete voucher error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Gagal menghapus voucher." },
      { status: 400 }
    );
  }
}

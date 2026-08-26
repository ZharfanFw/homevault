import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, categories } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // EXPENSE or INCOME

    const whereClause =
      type === "EXPENSE" || type === "INCOME"
        ? and(eq(categories.userId, user.id), eq(categories.type, type))
        : eq(categories.userId, user.id);

    const userCategories = db.select().from(categories).where(whereClause).all();

    return NextResponse.json({ categories: userCategories });
  } catch (error) {
    console.error("Fetch categories error:", error);
    return NextResponse.json(
      { error: "Gagal memuat kategori." },
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

    const { name, type, icon, color } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nama kategori wajib diisi." },
        { status: 400 }
      );
    }

    if (type !== "EXPENSE" && type !== "INCOME") {
      return NextResponse.json(
        { error: "Tipe kategori harus EXPENSE atau INCOME." },
        { status: 400 }
      );
    }

    const newCategory = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: name.trim(),
      type: type as "EXPENSE" | "INCOME",
      icon: icon || "tag",
      color: color || "#64748b",
      createdAt: new Date(),
    };

    db.insert(categories).values(newCategory).run();

    return NextResponse.json({ success: true, category: newCategory });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Gagal membuat kategori baru." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { seedUserData } from "@/lib/db/seed";
import { isRegistrationAllowed } from "@/lib/db/settings";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan password wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    // Check if registration is allowed
    const allowed = await isRegistrationAllowed();
    if (!allowed) {
      return NextResponse.json(
        { error: "Pendaftaran akun baru dinonaktifkan oleh administrator." },
        { status: 403 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .get();

    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan login." },
        { status: 409 }
      );
    }

    // Check if this is the first user (becomes admin)
    const userCount = db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .get();

    const isFirstUser = !userCount || userCount.count === 0;

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    const newUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      currency: "IDR",
      isAdmin: isFirstUser,
      createdAt: new Date(),
    };

    db.insert(users).values(newUser).run();

    // Seed default categories & wallets
    await seedUserData(userId);

    // Create session
    await createSession({
      userId,
      email: cleanEmail,
      name: newUser.name,
      isAdmin: isFirstUser,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: newUser.name,
        email: cleanEmail,
        currency: "IDR",
        isAdmin: isFirstUser,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mendaftar. Silakan coba lagi." },
      { status: 500 }
    );
  }
}

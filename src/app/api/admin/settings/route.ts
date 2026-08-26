import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db, users } from "@/lib/db";
import { isRegistrationAllowed, setRegistrationAllowed } from "@/lib/db/settings";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await isRegistrationAllowed();
    const allUsers = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      })
      .from(users)
      .all();

    return NextResponse.json({
      allowRegistration: allowed,
      totalUsers: allUsers.length,
      users: user.isAdmin ? allUsers : [],
    });
  } catch (error) {
    console.error("Admin settings get error:", error);
    return NextResponse.json(
      { error: "Gagal memuat pengaturan." },
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

    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengubah pengaturan ini." },
        { status: 403 }
      );
    }

    const { allowRegistration } = await req.json();

    if (typeof allowRegistration !== "boolean") {
      return NextResponse.json(
        { error: "Format data tidak valid." },
        { status: 400 }
      );
    }

    await setRegistrationAllowed(allowRegistration);

    return NextResponse.json({ success: true, allowRegistration });
  } catch (error) {
    console.error("Admin settings post error:", error);
    return NextResponse.json(
      { error: "Gagal mengubah pengaturan." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isRegistrationAllowed } from "@/lib/db/settings";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const registrationAllowed = await isRegistrationAllowed();

    if (!user) {
      return NextResponse.json({
        user: null,
        registrationAllowed,
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
      registrationAllowed,
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data user." },
      { status: 500 }
    );
  }
}

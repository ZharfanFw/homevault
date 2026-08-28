import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "finance_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || "finance-tracker-family-secret-key-32chars-min!!"
);
const SESSION_EXPIRY = "90d"; // 90 days persistent session for PWA
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export async function createSession(payload: SessionPayload) {
  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRY)
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return jwt;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      isAdmin: Boolean(payload.isAdmin),
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .get();

  return user || null;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

import { db, systemSettings, users } from "./index";
import { eq, sql } from "drizzle-orm";

export async function isRegistrationAllowed(): Promise<boolean> {
  const userCount = db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .get();

  // If no users exist yet, allow registration for initial admin setup
  if (!userCount || userCount.count === 0) {
    return true;
  }

  const setting = db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, "allow_registration"))
    .get();

  if (!setting) {
    return true; // Default allowed
  }

  return setting.value === "true";
}

export async function setRegistrationAllowed(allowed: boolean): Promise<void> {
  const existing = db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, "allow_registration"))
    .get();

  if (existing) {
    db.update(systemSettings)
      .set({ value: allowed ? "true" : "false" })
      .where(eq(systemSettings.key, "allow_registration"))
      .run();
  } else {
    db.insert(systemSettings)
      .values({
        key: "allow_registration",
        value: allowed ? "true" : "false",
      })
      .run();
  }
}

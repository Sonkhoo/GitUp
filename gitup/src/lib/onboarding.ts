import db from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function checkOnboardingStatus(userId: string) {
  const dbUser = await db
    .select({ displayName: user.displayName })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return {
    needsOnboarding: !dbUser[0]?.displayName,
    displayName: dbUser[0]?.displayName ?? null,
  };
}

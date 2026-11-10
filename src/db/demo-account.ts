import "server-only";

import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { and, eq, sql } from "drizzle-orm";

import { db } from "./index";
import { account, user } from "./schema/auth";
import { userProfiles } from "./schema/profiles";

export const DEMO_USER = {
  email: "demo@devgnosis.app",
  name: "Demo User",
  displayName: "Demo User",
  password: "password123",
} as const;

/**
 * Ensures the shared demo account exists with the published password. Writes
 * directly to the auth tables so it works even when email/password sign-up is
 * disabled; Better Auth hooks are intentionally bypassed.
 */
export async function ensureDemoUser(): Promise<string> {
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, DEMO_USER.email))
    .limit(1);

  const passwordHash = await hashPassword(DEMO_USER.password);

  if (!existing) {
    const userId = randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(user).values({
        id: userId,
        email: DEMO_USER.email,
        name: DEMO_USER.name,
        emailVerified: true,
      });
      await tx.insert(account).values({
        id: randomUUID(),
        userId,
        providerId: "credential",
        accountId: userId,
        password: passwordHash,
      });
    });

    return userId;
  }

  const userId = existing.id;

  await db
    .update(user)
    .set({ name: DEMO_USER.name, emailVerified: true })
    .where(eq(user.id, userId));

  const [credentialAccount] = await db
    .select({ id: account.id })
    .from(account)
    .where(
      and(eq(account.userId, userId), eq(account.providerId, "credential")),
    )
    .limit(1);

  if (credentialAccount) {
    await db
      .update(account)
      .set({ password: passwordHash })
      .where(eq(account.id, credentialAccount.id));
  } else {
    await db.insert(account).values({
      id: randomUUID(),
      userId,
      providerId: "credential",
      accountId: userId,
      password: passwordHash,
    });
  }

  return userId;
}

/** Upserts the demo user's profile with the free plan. */
export async function ensureDemoProfile(userId: string): Promise<void> {
  await db
    .insert(userProfiles)
    .values({
      userId,
      displayName: DEMO_USER.displayName,
      plan: "free",
      planStatus: "active",
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        displayName: sql`excluded.display_name`,
        plan: sql`excluded.plan`,
        planStatus: sql`excluded.plan_status`,
        updatedAt: sql`now()`,
      },
    });
}

import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { normalizeUserPlan, type UserPlan } from "@/lib/plans";

/**
 * Owner-scoped profile read for plan-aware navigation. The caller resolves the
 * user on the server; no client-supplied owner is accepted.
 */
export function userPlanQuery(userId: string) {
  return db
    .select({
      plan: userProfiles.plan,
      planStatus: userProfiles.planStatus,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
}

/** Effective plan for the signed-in user; `free` when no profile row exists. */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  const [row] = await userPlanQuery(userId);
  return normalizeUserPlan(row);
}

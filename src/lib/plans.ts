/**
 * Plans supported by the app. `user_profiles.plan` is stored as text, so this
 * module owns the contract and the fail-closed normalization used by the UI.
 */
export const USER_PLANS = ["free", "pro"] as const;

export type UserPlan = (typeof USER_PLANS)[number];

/** The `user_profiles` fields needed to derive effective access. */
export type UserPlanRow = {
  plan: string;
  planStatus: string;
};

/** Statuses that keep a paid plan effective. */
const ACTIVE_PRO_STATUSES: ReadonlySet<string> = new Set(["active", "trialing"]);

/**
 * Resolves the persisted plan/status into the effective plan used by the UI.
 * Unknown plans, inactive subscriptions, and missing profile rows fail closed
 * to `free`.
 */
export function normalizeUserPlan(
  row: UserPlanRow | null | undefined,
): UserPlan {
  if (!row || row.plan !== "pro") return "free";

  return ACTIVE_PRO_STATUSES.has(row.planStatus) ? "pro" : "free";
}

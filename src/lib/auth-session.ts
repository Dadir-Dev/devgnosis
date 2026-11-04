import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";

/** Better Auth session payload (user + session) resolved from request headers. */
export type AuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type AuthUser = AuthSession["user"];

/**
 * Resolve the current session on the server; null when signed out.
 *
 * Memoized with React `cache()` so the dashboard layout and page share one
 * session+user read per request. `cache()` is request-scoped — never a
 * module-level store — so one user's session can never reach another request.
 */
export const getSession = cache(async (): Promise<AuthSession | null> => {
  return auth.api.getSession({ headers: await headers() });
});

/** Resolve the signed-in user on the server; null when signed out. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Require an authenticated user for a protected route. Redirects to `/sign-in`
 * when there is no session; never falls back to unscoped or foreign data.
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

/**
 * Keep an existing session out of the auth pages, so a signed-in browser lands
 * on the dashboard instead of a sign-in form it cannot use.
 */
export async function requireGuest(): Promise<void> {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }
}

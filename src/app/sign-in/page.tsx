import type { Metadata } from "next";
import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";
import { SocialProviderButtons } from "@/components/auth/social-provider-buttons";
import {
  getEnabledOAuthProviders,
  getOAuthErrorMessage,
} from "@/features/auth/oauth-providers";
import { requireGuest } from "@/lib/auth-session";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in · DevGnosis",
};

// The OAuth error message comes from `searchParams`, so this route blocks
// instead of producing a static shell.
export const instant = false;

/** Minimal sign-in route so the authenticated dashboard is reachable. */
export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  await requireGuest();

  const params = await searchParams;
  const oauthError = getOAuthErrorMessage(params.error, "sign-in");
  const providers = getEnabledOAuthProviders(env);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-1">
          <Link
            href="/"
            className="rounded-sm text-lg font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            DevGnosis
          </Link>
          <p className="text-sm text-muted-foreground">
            Sign in to your knowledge hub.
          </p>
        </div>

        {oauthError ? (
          <p
            id="oauth-page-error"
            role="alert"
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {oauthError}
          </p>
        ) : null}

        <SocialProviderButtons providers={providers} page="sign-in" />

        <SignInForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Need an account?{" "}
          <Link
            href="/sign-up"
            className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Sign up
          </Link>
        </p>

        <p className="mt-6 rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
          Demo account:{" "}
          <span className="font-medium text-foreground">
            demo@devgnosis.app
          </span>{" "}
          / <span className="font-medium text-foreground">password123</span>
        </p>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link
            href="/privacy"
            className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Privacy policy
          </Link>
        </p>
      </div>
    </main>
  );
}

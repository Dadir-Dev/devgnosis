import type { Metadata } from "next";
import Link from "next/link";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { SocialProviderButtons } from "@/components/auth/social-provider-buttons";
import {
  getEnabledOAuthProviders,
  isOAuthError,
  OAUTH_ERROR_MESSAGES,
} from "@/features/auth/oauth-providers";
import { requireGuest } from "@/lib/auth-session";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Create account · DevGnosis",
};

// The OAuth error message comes from `searchParams`, so this route blocks
// instead of producing a static shell.
export const instant = false;

/** Registration route combining OAuth and email/password sign-up. */
export default async function SignUpPage({
  searchParams,
}: PageProps<"/sign-up">) {
  await requireGuest();

  const params = await searchParams;
  const oauthError = isOAuthError(params.error)
    ? OAUTH_ERROR_MESSAGES["sign-up"]
    : null;
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
            Create an account to start your knowledge hub.
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

        <SocialProviderButtons providers={providers} page="sign-up" />

        <SignUpForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

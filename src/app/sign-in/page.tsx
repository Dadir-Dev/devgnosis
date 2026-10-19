import type { Metadata } from "next";
import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in · DevGnosis",
};

const showDemoCredentials = process.env.NODE_ENV !== "production";

/** Minimal sign-in route so the authenticated dashboard is reachable. */
export default function SignInPage() {
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

        <SignInForm />

        {showDemoCredentials ? (
          <p className="mt-6 rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            Demo account:{" "}
            <span className="font-medium text-foreground">
              demo@devgnosis.app
            </span>{" "}
            / <span className="font-medium text-foreground">12345678</span>
          </p>
        ) : null}
      </div>
    </main>
  );
}

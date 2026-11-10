import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy · DevGnosis",
  description: "How DevGnosis collects, uses, stores, and protects your data.",
};

const SUPPORT_EMAIL = "support@devgnosis.app";
const LAST_UPDATED = "November 9, 2026";

/** Public privacy policy required by the Google OAuth app. */
export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 bg-background p-6 py-12">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="w-fit rounded-sm text-lg font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          DevGnosis
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Privacy policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">What we collect</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          When you sign in with GitHub or Google, we receive your provider
          profile: name, email address, and profile image. We also store the
          content you save in DevGnosis and basic session metadata such as the
          session token, IP address, and user agent needed to keep you signed
          in.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">How we use it</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          We use this information to authenticate you, provide the product&apos;s
          functionality, and prevent abuse. We do not sell your personal data.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Storage and security</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Your data is stored in Neon PostgreSQL. OAuth tokens are encrypted at
          rest, and access is limited to the services that operate DevGnosis.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Third parties</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          We use GitHub and Google for authentication, Vercel for hosting, and
          Neon for database infrastructure. Each provider processes data under
          its own privacy policy.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Cookies</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          We use a session cookie only, to keep you signed in. We do not use
          advertising or analytics cookies.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Retention and deletion</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          We keep your data while your account is active. To request deletion,
          contact us at the address below.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Questions about this policy or your data? Email{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>
    </main>
  );
}

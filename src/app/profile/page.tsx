import { CodeXml } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { UserAvatar } from "@/components/auth/user-avatar";
import { getUserPlan } from "@/db/queries/profiles";
import { requireUser } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Profile · DevGnosis",
};

// The page reads the session, so it cannot produce a static shell.
export const instant = false;

const JOIN_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
});

/** Read-only account details for the signed-in user. */
export default async function ProfilePage() {
  const user = await requireUser();
  const plan = await getUserPlan(user.id);
  const planLabel = plan === "pro" ? "Pro" : "Free";

  return (
    <main className="min-h-dvh bg-background p-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <CodeXml aria-hidden="true" className="size-4" />
            </span>
            <span className="truncate text-base font-semibold">DevGnosis</span>
          </Link>
          <Link
            href="/dashboard"
            className="rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Back to dashboard
          </Link>
        </header>

        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={user.name}
              email={user.email}
              image={user.image}
              size="lg"
            />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Plan
              </dt>
              <dd className="mt-1">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                    plan === "pro"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {planLabel}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Member since
              </dt>
              <dd className="mt-1 text-sm">
                {JOIN_DATE_FORMAT.format(user.createdAt)}
              </dd>
            </div>
          </dl>

          <p className="mt-6 rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            Profile editing is not available yet.
          </p>
        </section>
      </div>
    </main>
  );
}

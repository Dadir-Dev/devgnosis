import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-muted/60 motion-reduce:animate-none",
        className,
      )}
    />
  );
}

/** Loading placeholder matching the profile header and account card. */
export default function ProfileLoading() {
  return (
    <main className="min-h-dvh bg-background p-6">
      <div
        role="status"
        aria-label="Loading profile"
        className="mx-auto flex w-full max-w-2xl flex-col gap-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>

        <Skeleton className="h-8 w-32" />

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>

          <Skeleton className="mt-6 h-10 w-full rounded-md" />
        </div>
      </div>
    </main>
  );
}

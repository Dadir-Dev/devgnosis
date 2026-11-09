"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type ProfileErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/** User-safe profile error state with a recovery action. */
export default function ProfileError({ error, retry }: ProfileErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-3 text-center">
        <h2 className="text-lg font-semibold">
          We couldn&apos;t load your profile
        </h2>
        <p className="text-sm text-muted-foreground">
          Something went wrong while loading your profile. Try again in a
          moment.
        </p>
        <Button type="button" onClick={() => retry()}>
          Try again
        </Button>
      </div>
    </main>
  );
}

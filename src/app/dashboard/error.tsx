"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/** User-safe dashboard error state with a recovery action. */
export default function DashboardError({ error, retry }: DashboardErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 py-16 text-center">
      <h2 className="text-lg font-semibold">
        We couldn&apos;t load your dashboard
      </h2>
      <p className="text-sm text-muted-foreground">
        Something went wrong while loading your collections. Try again in a
        moment.
      </p>
      <Button type="button" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}

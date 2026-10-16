import { connection } from "next/server";
import { Suspense } from "react";

import { formatRelativeTime } from "@/lib/format";

async function RelativeTimeValue({ iso }: { iso: string }) {
  // The current time is a request-time value, so defer past prerendering.
  await connection();
  return <>{formatRelativeTime(iso)}</>;
}

/**
 * Request-time "x ago" label. Kept behind its own Suspense boundary so the rest
 * of the dashboard can prerender as a static shell while the label streams in.
 */
export function RelativeTime({ iso }: { iso: string }) {
  return (
    <Suspense fallback={<span aria-hidden="true">{"\u00a0"}</span>}>
      <RelativeTimeValue iso={iso} />
    </Suspense>
  );
}

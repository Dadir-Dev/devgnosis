import "server-only";

/**
 * Fixed-window attempt limiter for the email/password Server Actions.
 *
 * Better Auth's own limiter is enforced in its HTTP router, which `auth.api.*`
 * never traverses, so the actions need their own guard. The store is
 * in-process: on serverless it bounds attempts per warm instance, not globally.
 * Replace the store once a shared backend exists (see SCAN-FINDINGS H1).
 */

/** Attempts allowed per IP + email within one window. */
export const AUTH_RATE_LIMIT_MAX_ATTEMPTS = 10;
/** Fixed window length for `consumeAuthAttempt`. */
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/** Cap on tracked keys so a spray of unique keys cannot grow memory forever. */
const MAX_TRACKED_BUCKETS = 10_000;

const UNKNOWN_CLIENT = "unknown";

type AttemptBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, AttemptBucket>();

/**
 * Best-effort client IP from the proxy headers hosts set in front of Next.js.
 * The last `x-forwarded-for` hop is the one the trusted proxy appended; earlier
 * hops can be client-supplied and must not be allowed to change the key.
 */
export function getClientIp(headers: Pick<Headers, "get">): string {
  const forwardedHops = headers.get("x-forwarded-for")?.split(",");
  const forwardedIp = forwardedHops?.[forwardedHops.length - 1]?.trim();

  if (forwardedIp) {
    return forwardedIp;
  }

  return headers.get("x-real-ip")?.trim() || UNKNOWN_CLIENT;
}

/** Rate-limit key for one email from one client. */
export function buildAuthAttemptKey(ip: string, email: string): string {
  return `${ip.trim().toLowerCase()}:${email.trim().toLowerCase()}`;
}

/**
 * Record one attempt for `key` and report whether it is allowed. Call this
 * before delegating to Better Auth; a rejected attempt must not reach it.
 */
export function consumeAuthAttempt(key: string, now = Date.now()): boolean {
  if (buckets.size >= MAX_TRACKED_BUCKETS) {
    pruneBuckets(now);
  }

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS,
    });

    return true;
  }

  if (bucket.count >= AUTH_RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }

  bucket.count += 1;

  return true;
}

/** Forget one key's budget, so a successful attempt does not count against it. */
export function clearAuthAttempt(key: string): void {
  buckets.delete(key);
}

/** Drop every bucket. Tests only; request paths must never call this. */
export function resetAuthAttempts(): void {
  buckets.clear();
}

function pruneBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }

  // Still full of live buckets: evict the oldest insertions to bound memory.
  for (const key of buckets.keys()) {
    if (buckets.size < MAX_TRACKED_BUCKETS) {
      break;
    }

    buckets.delete(key);
  }
}

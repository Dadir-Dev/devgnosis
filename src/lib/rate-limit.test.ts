import { beforeEach, describe, expect, it } from "vitest";

import {
  AUTH_RATE_LIMIT_MAX_ATTEMPTS,
  AUTH_RATE_LIMIT_WINDOW_MS,
  buildAuthAttemptKey,
  clearAuthAttempt,
  consumeAuthAttempt,
  getClientIp,
  resetAuthAttempts,
} from "./rate-limit";

beforeEach(() => {
  resetAuthAttempts();
});

describe("getClientIp", () => {
  it("uses the last x-forwarded-for hop the proxy appended", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.9, 203.0.113.7, 10.0.0.1",
    });

    expect(getClientIp(headers)).toBe("10.0.0.1");
  });

  it("ignores a client-supplied first hop", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4, 203.0.113.7",
    });

    expect(getClientIp(headers)).not.toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.4" });

    expect(getClientIp(headers)).toBe("198.51.100.4");
  });

  it("falls back to a shared marker when no proxy header is present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("buildAuthAttemptKey", () => {
  it("normalizes ip and email case and whitespace", () => {
    expect(buildAuthAttemptKey(" 203.0.113.7 ", " Ada@Example.com ")).toBe(
      "203.0.113.7:ada@example.com",
    );
  });
});

describe("consumeAuthAttempt", () => {
  it("allows attempts up to the limit and blocks the next one", () => {
    const key = "203.0.113.7:ada@example.com";
    const now = 1_000;

    for (let attempt = 1; attempt <= AUTH_RATE_LIMIT_MAX_ATTEMPTS; attempt += 1) {
      expect(consumeAuthAttempt(key, now)).toBe(true);
    }

    expect(consumeAuthAttempt(key, now)).toBe(false);
  });

  it("tracks each key independently", () => {
    const now = 1_000;
    const blockedKey = "203.0.113.7:ada@example.com";

    for (let attempt = 1; attempt <= AUTH_RATE_LIMIT_MAX_ATTEMPTS; attempt += 1) {
      consumeAuthAttempt(blockedKey, now);
    }

    expect(consumeAuthAttempt(blockedKey, now)).toBe(false);
    expect(consumeAuthAttempt("203.0.113.7:grace@example.com", now)).toBe(true);
  });

  it("starts a fresh window once the window elapses", () => {
    const key = "203.0.113.7:ada@example.com";
    const now = 1_000;

    for (let attempt = 1; attempt <= AUTH_RATE_LIMIT_MAX_ATTEMPTS; attempt += 1) {
      consumeAuthAttempt(key, now);
    }

    expect(consumeAuthAttempt(key, now)).toBe(false);
    expect(consumeAuthAttempt(key, now + AUTH_RATE_LIMIT_WINDOW_MS)).toBe(true);
  });

  it("forgets a key that is cleared", () => {
    const key = "203.0.113.7:ada@example.com";
    const now = 1_000;

    for (let attempt = 1; attempt <= AUTH_RATE_LIMIT_MAX_ATTEMPTS; attempt += 1) {
      consumeAuthAttempt(key, now);
    }

    expect(consumeAuthAttempt(key, now)).toBe(false);

    clearAuthAttempt(key);

    expect(consumeAuthAttempt(key, now)).toBe(true);
  });
});

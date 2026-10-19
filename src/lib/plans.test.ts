import { describe, expect, it } from "vitest";

import { normalizeUserPlan } from "./plans";

describe("normalizeUserPlan", () => {
  it("returns pro for an active pro plan", () => {
    expect(
      normalizeUserPlan({ plan: "pro", planStatus: "active" }),
    ).toBe("pro");
  });

  it("returns pro for a trialing pro plan", () => {
    expect(
      normalizeUserPlan({ plan: "pro", planStatus: "trialing" }),
    ).toBe("pro");
  });

  it("fails closed for inactive subscriptions", () => {
    expect(
      normalizeUserPlan({ plan: "pro", planStatus: "canceled" }),
    ).toBe("free");
    expect(
      normalizeUserPlan({ plan: "pro", planStatus: "past_due" }),
    ).toBe("free");
  });

  it("returns free for free plans and missing profiles", () => {
    expect(
      normalizeUserPlan({ plan: "free", planStatus: "active" }),
    ).toBe("free");
    expect(normalizeUserPlan(null)).toBe("free");
    expect(normalizeUserPlan(undefined)).toBe("free");
  });
});

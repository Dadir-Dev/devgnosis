import { describe, expect, it } from "vitest";

import { getInitials } from "./initials";

describe("getInitials", () => {
  it("uses the first letters of the first and last words", () => {
    expect(getInitials("Brad Traversy")).toBe("BT");
  });

  it("handles a single word", () => {
    expect(getInitials("brad")).toBe("B");
  });

  it("ignores extra whitespace", () => {
    expect(getInitials("  Brad   Traversy  ")).toBe("BT");
  });

  it("ignores middle names", () => {
    expect(getInitials("Brad van Traversy")).toBe("BT");
  });

  it("returns an empty string for empty or whitespace input", () => {
    expect(getInitials("")).toBe("");
    expect(getInitials("   \t\n ")).toBe("");
  });

  it("treats an email-like value as a single token", () => {
    expect(getInitials("demo@devgnosis.app")).toBe("D");
  });

  it("preserves and uppercases a non-ASCII first letter", () => {
    expect(getInitials("élise")).toBe("É");
  });

  it("splits on any whitespace", () => {
    expect(getInitials("Brad\tTraversy")).toBe("BT");
  });

  it("takes characters by code point so surrogate pairs are not split", () => {
    expect(getInitials("😀")).toBe("😀");
    expect(getInitials("😀 Smith")).toBe("😀S");
  });

  it("never returns more than two characters", () => {
    expect(getInitials("Brad van der Traversy").length).toBeLessThanOrEqual(2);
    expect(getInitials("ß ß")).toHaveLength(2);
  });
});

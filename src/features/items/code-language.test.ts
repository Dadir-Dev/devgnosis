import { describe, expect, it } from "vitest";

import { resolveCodeLanguage } from "./code-language";

describe("resolveCodeLanguage", () => {
  it("keeps canonical grammar names", () => {
    for (const language of ["typescript", "tsx", "javascript", "jsx", "css", "html"]) {
      expect(resolveCodeLanguage(language)).toBe(language);
    }
  });

  it("maps the aliases future editors are likely to store", () => {
    expect(resolveCodeLanguage("ts")).toBe("typescript");
    expect(resolveCodeLanguage("js")).toBe("javascript");
    expect(resolveCodeLanguage("react")).toBe("tsx");
    expect(resolveCodeLanguage("reactjs")).toBe("tsx");
    expect(resolveCodeLanguage("node")).toBe("javascript");
    expect(resolveCodeLanguage("mjs")).toBe("javascript");
    expect(resolveCodeLanguage("htm")).toBe("html");
    expect(resolveCodeLanguage("sh")).toBe("bash");
    expect(resolveCodeLanguage("docker")).toBe("dockerfile");
    expect(resolveCodeLanguage("yml")).toBe("yaml");
  });

  it("normalizes case and surrounding whitespace", () => {
    expect(resolveCodeLanguage("  TypeScript ")).toBe("typescript");
    expect(resolveCodeLanguage("REACT")).toBe("tsx");
    expect(resolveCodeLanguage("Dockerfile")).toBe("dockerfile");
  });

  it("falls back to plain text for unknown languages", () => {
    expect(resolveCodeLanguage("brainfuck")).toBe("text");
    expect(resolveCodeLanguage("")).toBe("text");
  });
});

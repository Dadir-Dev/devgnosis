/**
 * Canonical code grammars available to the syntax highlighter. This list must
 * stay in sync with the grammars imported by
 * `src/components/dashboard/code-block.tsx`.
 */
export const CODE_LANGUAGES = [
  "bash",
  "css",
  "dockerfile",
  "go",
  "html",
  "javascript",
  "json",
  "jsx",
  "markdown",
  "python",
  "rust",
  "sql",
  "tsx",
  "typescript",
  "yaml",
] as const;

export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

/**
 * Spellings users and future editors are likely to store for an item's
 * `language`, mapped to the canonical grammar. React is highlighted as `tsx`
 * (TypeScript + JSX, which also covers plain TS/JSX), and Node/MJS/CJS as
 * JavaScript.
 */
const CODE_LANGUAGE_ALIASES: Record<string, CodeLanguage> = {
  cjs: "javascript",
  docker: "dockerfile",
  golang: "go",
  htm: "html",
  js: "javascript",
  md: "markdown",
  mdx: "markdown",
  mjs: "javascript",
  node: "javascript",
  nodejs: "javascript",
  py: "python",
  react: "tsx",
  reactjs: "tsx",
  sh: "bash",
  shell: "bash",
  ts: "typescript",
  yml: "yaml",
  zsh: "bash",
};

/**
 * Resolves a stored `language` to a loaded grammar. Matching is case-insensitive
 * and trims surrounding whitespace; anything unknown falls back to Shiki's
 * plain `text` language so the block still renders as monospace code.
 */
export function resolveCodeLanguage(language: string): CodeLanguage | "text" {
  const normalized = language.trim().toLowerCase();

  if ((CODE_LANGUAGES as readonly string[]).includes(normalized)) {
    return normalized as CodeLanguage;
  }

  return CODE_LANGUAGE_ALIASES[normalized] ?? "text";
}

import "server-only";

import { createHighlighterCoreSync } from "shiki/core";
import type { LanguageRegistration } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bash from "shiki/langs/bash.mjs";
import css from "shiki/langs/css.mjs";
import dockerfile from "shiki/langs/dockerfile.mjs";
import go from "shiki/langs/go.mjs";
import html from "shiki/langs/html.mjs";
import javascript from "shiki/langs/javascript.mjs";
import json from "shiki/langs/json.mjs";
import jsx from "shiki/langs/jsx.mjs";
import markdown from "shiki/langs/markdown.mjs";
import python from "shiki/langs/python.mjs";
import rust from "shiki/langs/rust.mjs";
import sql from "shiki/langs/sql.mjs";
import tsx from "shiki/langs/tsx.mjs";
import typescript from "shiki/langs/typescript.mjs";
import yaml from "shiki/langs/yaml.mjs";
import oneDarkPro from "shiki/themes/one-dark-pro.mjs";
import oneLight from "shiki/themes/one-light.mjs";

import {
  resolveCodeLanguage,
  type CodeLanguage,
} from "@/features/items/code-language";

/**
 * Fine-grained Shiki bundle: only the grammars and themes the dashboard needs,
 * loaded once per server process with the pure-JavaScript regex engine so no
 * WASM asset is required. The record keys are constrained to `CodeLanguage` so
 * this stays in sync with `resolveCodeLanguage`.
 */
const LANGUAGES: Record<CodeLanguage, LanguageRegistration[]> = {
  bash,
  css,
  dockerfile,
  go,
  html,
  javascript,
  json,
  jsx,
  markdown,
  python,
  rust,
  sql,
  tsx,
  typescript,
  yaml,
};

const highlighter = createHighlighterCoreSync({
  themes: [oneLight, oneDarkPro],
  langs: Object.values(LANGUAGES),
  engine: createJavaScriptRegexEngine(),
});

type CodeBlockProps = {
  code: string;
  language: string;
};

/**
 * Server-rendered, syntax-highlighted code. Colors are emitted as light/dark
 * CSS variables by Shiki and resolved by the `.code-highlight` rules in
 * `globals.css`, so the block follows the active theme without client JS.
 *
 * `language` is whatever the item stored (e.g. `ts`, `react`, `Dockerfile`);
 * `resolveCodeLanguage` maps it to a loaded grammar or plain `text`.
 */
export function CodeBlock({ code, language }: CodeBlockProps) {
  const html = highlighter.codeToHtml(code, {
    lang: resolveCodeLanguage(language),
    themes: { light: "one-light", dark: "one-dark-pro" },
    defaultColor: false,
  });

  return (
    <div
      className="code-highlight overflow-hidden rounded-md bg-muted/50 p-3 font-mono text-xs leading-relaxed"
      // Shiki escapes the code it receives, so this HTML is generated, not user-authored.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

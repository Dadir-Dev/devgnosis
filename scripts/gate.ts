#!/usr/bin/env bun
/**
 * Quality gates, one entry point, one line of output per gate.
 *
 *   bun run gate              lint -> types -> tests -> build
 *   bun run gate:fast         lint -> types -> tests (no build)
 *   bun run gate -- --reuse   reuse .gate/last.json when the tree hash matches
 *
 * Full logs land in `.gate/<gate>.log`; only a preview is printed on failure.
 * A passing run writes `.gate/last.json` so `/feature/complete` can reuse a
 * full pass from `/feature/test` instead of rebuilding the same tree.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type GateName = "lint" | "types" | "tests" | "build";

type Gate = {
  name: GateName;
  steps: string[][];
  log: "head" | "tail";
};

type Stamp = {
  treeHash: string;
  mode: "fast" | "full";
  at: string;
  branch: string;
  gates: { name: GateName; summary: string }[];
};

const ROOT = process.cwd();
const GATE_DIR = join(ROOT, ".gate");
const STAMP_PATH = join(GATE_DIR, "last.json");
const MAX_BUFFER = 64 * 1024 * 1024;
const PREVIEW_LINES = 40;

const args = new Set(process.argv.slice(2));
const fast = args.has("--fast");
const reuse = args.has("--reuse");
const keepGoing = args.has("--keep-going");

const ALL_GATES: Gate[] = [
  {
    name: "lint",
    steps: [["run", "lint", "--", "--quiet"]],
    log: "head",
  },
  {
    name: "types",
    steps: [
      ["x", "next", "typegen"],
      ["x", "tsc", "--noEmit", "--pretty", "false"],
    ],
    log: "head",
  },
  {
    name: "tests",
    steps: [["run", "test", "--", "--reporter=dot", "--bail=1"]],
    log: "tail",
  },
  {
    name: "build",
    steps: [["run", "build"]],
    log: "tail",
  },
];

const GATES = fast ? ALL_GATES.filter((gate) => gate.name !== "build") : ALL_GATES;

function git(...argv: string[]): string {
  const result = spawnSync("git", argv, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: MAX_BUFFER,
  });
  if (result.status !== 0) {
    throw new Error(`git ${argv.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

/**
 * Stable identity for the working-tree contents. Independent of HEAD, so a
 * plain commit between `/feature/test` and `/feature/complete` still reuses.
 * Index entries cover tracked content; `git diff` covers unstaged edits;
 * untracked files are hashed one by one.
 */
function treeHash(): string {
  const index = git("ls-files", "-s");
  const unstaged = git("diff", "--binary");
  const untracked = git("ls-files", "--others", "--exclude-standard")
    .split("\n")
    .filter(Boolean)
    .sort()
    .map((file) => `${file}\0${git("hash-object", "--", file)}`)
    .join("\n");

  return createHash("sha256")
    .update(index)
    .update("\0")
    .update(unstaged)
    .update("\0")
    .update(untracked)
    .digest("hex");
}

function branchName(): string {
  const result = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return (result.stdout ?? "").trim() || "(detached)";
}

function readStamp(): Stamp | null {
  if (!existsSync(STAMP_PATH)) return null;
  try {
    const parsed = JSON.parse(readFileSync(STAMP_PATH, "utf8")) as Partial<Stamp>;
    if (!parsed.treeHash || !parsed.mode || !Array.isArray(parsed.gates)) return null;
    return parsed as Stamp;
  } catch {
    return null;
  }
}

function summarize(name: GateName, output: string): string {
  if (name === "tests") {
    const matches = [...output.matchAll(/Tests\s+(.+)/g)];
    return matches.at(-1)?.[1]?.trim() ?? "pass";
  }
  if (name === "build") {
    return /Compiled successfully|Generating static pages/i.test(output) ? "compiled" : "pass";
  }
  return "";
}

function preview(log: string, where: "head" | "tail"): string {
  const lines = log.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const slice = where === "head" ? lines.slice(0, PREVIEW_LINES) : lines.slice(-PREVIEW_LINES);
  return slice.join("\n");
}

function runGate(gate: Gate): { ok: boolean; summary: string; output: string } {
  const chunks: string[] = [];

  for (const step of gate.steps) {
    const result = spawnSync(process.execPath, step, {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: MAX_BUFFER,
      env: process.env,
    });

    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    chunks.push(`$ bun ${step.join(" ")}\n${output}`);

    if (result.error) {
      return { ok: false, summary: result.error.message, output: chunks.join("\n") };
    }
    if (result.status !== 0) {
      return { ok: false, summary: `exit ${result.status}`, output: chunks.join("\n") };
    }
  }

  const output = chunks.join("\n");
  return { ok: true, summary: summarize(gate.name, output), output };
}

function formatLine(name: GateName, status: string, detail?: string): string {
  return `gate  ${name.padEnd(6)}${status}${detail ? `  ${detail}` : ""}`;
}

function main(): number {
  const currentHash = treeHash();

  if (reuse) {
    const stamp = readStamp();
    if (stamp && (fast || stamp.mode === "full") && stamp.treeHash === currentHash) {
      const names = new Set(GATES.map((gate) => gate.name));
      const covered = GATES.every((gate) =>
        stamp.gates.some((entry) => entry.name === gate.name),
      );

      if (covered) {
        for (const gate of stamp.gates) {
          if (!names.has(gate.name)) continue;
          console.log(`${formatLine(gate.name, "PASS", gate.summary)}  (cached)`);
        }
        return 0;
      }
    }
  }

  mkdirSync(GATE_DIR, { recursive: true });
  rmSync(STAMP_PATH, { force: true });

  const results: Stamp["gates"] = [];
  let failed = false;

  for (const gate of GATES) {
    const result = runGate(gate);
    writeFileSync(join(GATE_DIR, `${gate.name}.log`), result.output, "utf8");

    if (result.ok) {
      results.push({ name: gate.name, summary: result.summary });
      console.log(formatLine(gate.name, "PASS", result.summary));
      continue;
    }

    failed = true;
    console.log(formatLine(gate.name, "FAIL", result.summary));
    console.log(`---- ${gate.name} preview (${gate.log === "head" ? "first" : "last"} ${PREVIEW_LINES} non-empty lines of .gate/${gate.name}.log) ----`);
    console.log(preview(result.output, gate.log));
    console.log(`---- end of ${gate.name} preview; full log: .gate/${gate.name}.log ----`);

    if (!keepGoing) break;
  }

  if (failed) return 1;

  const stamp: Stamp = {
    treeHash: currentHash,
    mode: fast ? "fast" : "full",
    at: new Date().toISOString(),
    branch: branchName(),
    gates: results,
  };
  writeFileSync(STAMP_PATH, `${JSON.stringify(stamp, null, 2)}\n`, "utf8");
  return 0;
}

process.exitCode = main();

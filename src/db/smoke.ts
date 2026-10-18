import { runSmokeChecks } from "./smoke-checks";

/**
 * CLI wrapper around the reusable smoke checks. This is an operational gate
 * (e.g. run after `db:migrate` in CI), not the behavioural test suite — that
 * lives in Vitest and can call `runSmokeChecks` directly.
 */
async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production" && process.env.DB_SMOKE !== "1") {
    console.error(
      "Refusing to run the database smoke test with NODE_ENV=production. " +
        "Set DB_SMOKE=1 to override.",
    );
    process.exit(1);
  }

  const results = await runSmokeChecks();

  for (const result of results) {
    const detail = result.detail ? ` (${result.detail})` : "";
    console.log(`${result.passed ? "PASS" : "FAIL"} ${result.name}${detail}`);
  }

  const failed = results.filter((result) => !result.passed).length;
  console.log(
    failed === 0
      ? `All ${results.length} smoke checks passed.`
      : `${failed} of ${results.length} smoke checks failed.`,
  );

  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error: unknown) => {
  console.error(
    "Smoke test crashed:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});

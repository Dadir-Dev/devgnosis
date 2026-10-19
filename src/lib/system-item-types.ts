/**
 * Canonical system item types, shared by the UI icon map and the server-side
 * collection queries. Kept free of React/Drizzle imports so it is safe to use
 * from scripts, tests, and Server Components alike.
 *
 * The order is also the deterministic tie-break when two types have the same
 * item count in a collection.
 */
export const SYSTEM_TYPE_KEYS = [
  "snippet",
  "prompt",
  "note",
  "command",
  "link",
  "file",
  "image",
] as const;

export type SystemItemTypeKey = (typeof SYSTEM_TYPE_KEYS)[number];

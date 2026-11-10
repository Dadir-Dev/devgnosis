import "server-only";

import { sql } from "drizzle-orm";

import { db } from "./index";
import { itemTypes } from "./schema";

/**
 * The seven seeded system item types (see project-overview). Stable and owned by
 * the system: `owner_id` is null and `is_system` is true.
 */
export const SYSTEM_ITEM_TYPES: (typeof itemTypes.$inferInsert)[] = [
  {
    key: "snippet",
    name: "Snippet",
    icon: "CodeXml",
    color: "#3B82F6",
    contentKind: "text",
    isSystem: true,
  },
  {
    key: "prompt",
    name: "Prompt",
    icon: "Sparkles",
    color: "#8B5CF6",
    contentKind: "text",
    isSystem: true,
  },
  {
    key: "note",
    name: "Note",
    icon: "StickyNote",
    color: "#FDE047",
    contentKind: "text",
    isSystem: true,
  },
  {
    key: "command",
    name: "Command",
    icon: "Terminal",
    color: "#F97316",
    contentKind: "text",
    isSystem: true,
  },
  {
    key: "link",
    name: "Link",
    icon: "Link",
    color: "#10B981",
    contentKind: "url",
    isSystem: true,
  },
  {
    key: "file",
    name: "File",
    icon: "File",
    color: "#6B7280",
    contentKind: "file",
    isSystem: true,
  },
  {
    key: "image",
    name: "Image",
    icon: "Image",
    color: "#EC4899",
    contentKind: "file",
    isSystem: true,
  },
];

/**
 * Upserts the seven system item types on the partial unique index over `key`
 * where `is_system` is true.
 */
export async function seedSystemItemTypes(): Promise<void> {
  await db
    .insert(itemTypes)
    .values(SYSTEM_ITEM_TYPES)
    .onConflictDoUpdate({
      target: itemTypes.key,
      targetWhere: sql`is_system`,
      set: {
        name: sql`excluded.name`,
        icon: sql`excluded.icon`,
        color: sql`excluded.color`,
        contentKind: sql`excluded.content_kind`,
        updatedAt: sql`now()`,
      },
    });
}

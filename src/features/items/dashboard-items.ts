import type { itemTypes } from "@/db/schema/item-types";
import type { items } from "@/db/schema/items";

/** Content modes supported by item types (mirrors the `content_kind` enum). */
export type ContentKind = (typeof itemTypes.$inferSelect)["contentKind"];

/** The joined item-type fields rendered by the dashboard item cards. */
export type ItemTypeView = {
  id: string;
  key: string;
  name: string;
  color: string;
  icon: string;
  contentKind: ContentKind;
};

/** Serializable view model rendered by the pinned and recent item sections. */
export type DashboardItem = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  fileName: string | null;
  language: string | null;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  /** ISO string because `RelativeTime` formats string timestamps. */
  updatedAt: string;
  type: ItemTypeView;
};

/** Columns selected for each item, derived from the Drizzle schema. */
export type DashboardItemRow = Pick<
  typeof items.$inferSelect,
  | "id"
  | "title"
  | "description"
  | "content"
  | "url"
  | "fileName"
  | "language"
  | "isFavorite"
  | "isPinned"
  | "updatedAt"
> & {
  type: ItemTypeView;
};

/** One `item_tags -> tags` row produced by the batched tag query. */
export type ItemTagRow = {
  itemId: string;
  name: string;
};

/**
 * Assembles the dashboard view models from the owner-scoped item rows and the
 * batched tag rows. Tag rows are grouped in memory so the read stays set-based
 * (one item query plus one tag query) instead of N+1.
 */
export function buildDashboardItems(
  rows: DashboardItemRow[],
  tagRows: ItemTagRow[],
): DashboardItem[] {
  const tagsByItem = new Map<string, string[]>();

  for (const row of tagRows) {
    const names = tagsByItem.get(row.itemId);

    if (names) names.push(row.name);
    else tagsByItem.set(row.itemId, [row.name]);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    url: row.url,
    fileName: row.fileName,
    language: row.language,
    tags: tagsByItem.get(row.id) ?? [],
    isFavorite: row.isFavorite,
    isPinned: row.isPinned,
    updatedAt: row.updatedAt.toISOString(),
    type: row.type,
  }));
}

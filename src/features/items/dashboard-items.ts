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

/**
 * Serializable view model rendered by the recent-items list. The list renders
 * no body, so the payload fields are absent rather than optional.
 */
export type RecentItem = Omit<
  DashboardItem,
  "content" | "url" | "fileName" | "language"
>;

/** Columns shared by both item lists, derived from the Drizzle schema. */
type ItemBaseRow = Pick<
  typeof items.$inferSelect,
  "id" | "title" | "description" | "isFavorite" | "isPinned" | "updatedAt"
> & {
  type: ItemTypeView;
};

/**
 * Columns selected for the recent-items list. Deliberately narrower than the
 * pinned row: it lacks the payload fields, so it cannot be passed where the
 * pinned row type is expected.
 */
export type RecentItemRow = ItemBaseRow;

/** Columns selected for the pinned cards, which render the item body. */
export type DashboardItemRow = ItemBaseRow &
  Pick<typeof items.$inferSelect, "content" | "url" | "fileName" | "language">;

/** One `item_tags -> tags` row produced by the batched tag query. */
export type ItemTagRow = {
  itemId: string;
  name: string;
};

/**
 * Groups the batched tag rows by item id, preserving the query's name order, so
 * the read stays set-based (one item query plus one tag query) instead of N+1.
 */
function groupTagsByItem(tagRows: ItemTagRow[]): Map<string, string[]> {
  const tagsByItem = new Map<string, string[]>();

  for (const row of tagRows) {
    const names = tagsByItem.get(row.itemId);

    if (names) names.push(row.name);
    else tagsByItem.set(row.itemId, [row.name]);
  }

  return tagsByItem;
}

/** Assembles the pinned view models from the owner-scoped rows and tags. */
export function buildDashboardItems(
  rows: DashboardItemRow[],
  tagRows: ItemTagRow[],
): DashboardItem[] {
  const tagsByItem = groupTagsByItem(tagRows);

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

/** Assembles the narrow recent-list view models from the owner-scoped rows. */
export function buildRecentItems(
  rows: RecentItemRow[],
  tagRows: ItemTagRow[],
): RecentItem[] {
  const tagsByItem = groupTagsByItem(tagRows);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    tags: tagsByItem.get(row.id) ?? [],
    isFavorite: row.isFavorite,
    isPinned: row.isPinned,
    updatedAt: row.updatedAt.toISOString(),
    type: row.type,
  }));
}

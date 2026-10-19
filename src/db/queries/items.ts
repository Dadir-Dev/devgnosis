import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { itemTags, itemTypes, items, tags } from "@/db/schema";
import {
  buildDashboardItems,
  type DashboardItem,
  type DashboardItemRow,
} from "@/features/items/dashboard-items";

/**
 * Owner-scoped read queries for the dashboard's pinned and recent item lists.
 *
 * Every query filters on the resolved server-side `userId`; no caller may pass a
 * client-supplied owner. Reads stay set-based: one item query (joined to
 * `item_types`) plus one batched tag query.
 */

const ITEM_COLUMNS = {
  id: items.id,
  title: items.title,
  description: items.description,
  content: items.content,
  url: items.url,
  fileName: items.fileName,
  language: items.language,
  isFavorite: items.isFavorite,
  isPinned: items.isPinned,
  updatedAt: items.updatedAt,
  type: {
    id: itemTypes.id,
    key: itemTypes.key,
    name: itemTypes.name,
    color: itemTypes.color,
    icon: itemTypes.icon,
    contentKind: itemTypes.contentKind,
  },
} as const;

/**
 * Pinned items, newest first. `id` breaks ties deterministically: the seed
 * writes every item in one transaction, so `updated_at` values can tie.
 */
export function pinnedItemsQuery(userId: string, limit: number) {
  return db
    .select(ITEM_COLUMNS)
    .from(items)
    .innerJoin(itemTypes, eq(itemTypes.id, items.itemTypeId))
    .where(and(eq(items.ownerId, userId), eq(items.isPinned, true)))
    .orderBy(desc(items.updatedAt), asc(items.id))
    .limit(limit);
}

/** Most recently updated items, newest first, with the same `id` tie-break. */
export function recentItemsQuery(userId: string, limit: number) {
  return db
    .select(ITEM_COLUMNS)
    .from(items)
    .innerJoin(itemTypes, eq(itemTypes.id, items.itemTypeId))
    .where(eq(items.ownerId, userId))
    .orderBy(desc(items.updatedAt), asc(items.id))
    .limit(limit);
}

/**
 * Batch tag lookup for the already owner-scoped item ids. The owner filter is
 * repeated on `tags` so a stale or foreign join row cannot leak another user's
 * tag. `normalizedName` keeps chip order stable.
 */
export function itemTagsQuery(userId: string, itemIds: string[]) {
  return db
    .select({
      itemId: itemTags.itemId,
      name: tags.name,
    })
    .from(itemTags)
    .innerJoin(tags, eq(tags.id, itemTags.tagId))
    .where(and(eq(tags.ownerId, userId), inArray(itemTags.itemId, itemIds)))
    .orderBy(asc(tags.normalizedName));
}

/** Loads the batched tags for a non-empty item result and builds the view models. */
async function attachTags(
  userId: string,
  rows: DashboardItemRow[],
): Promise<DashboardItem[]> {
  if (rows.length === 0) return [];

  const tagRows = await itemTagsQuery(
    userId,
    rows.map((row) => row.id),
  );

  return buildDashboardItems(rows, tagRows);
}

/** The owner's pinned items, at most `limit` (default 2), newest first. */
export async function getPinnedItems(
  userId: string,
  limit = 2,
): Promise<DashboardItem[]> {
  const rows = await pinnedItemsQuery(userId, limit);
  return attachTags(userId, rows);
}

/** The owner's most recently updated items (default 10), newest first. */
export async function getRecentItems(
  userId: string,
  limit = 10,
): Promise<DashboardItem[]> {
  const rows = await recentItemsQuery(userId, limit);
  return attachTags(userId, rows);
}

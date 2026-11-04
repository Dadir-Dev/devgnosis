import "server-only";

import { and, asc, count, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { itemTags, itemTypes, items, tags } from "@/db/schema";
import {
  buildSidebarItemTypes,
  type SidebarItemType,
} from "@/features/dashboard/sidebar";
import {
  buildDashboardItems,
  buildRecentItems,
  type DashboardItem,
  type ItemTagRow,
  type RecentItem,
} from "@/features/items/dashboard-items";
import type { UserPlan } from "@/lib/plans";

/**
 * Owner-scoped read queries for the dashboard's pinned/recent item lists and
 * the sidebar's system item-type counts.
 *
 * Every query filters on the resolved server-side `userId`; no caller may pass a
 * client-supplied owner. Reads stay set-based: one item query (joined to
 * `item_types`) plus one batched tag query, or one grouped type-count join.
 */

/**
 * Columns shared by both dashboard item lists. `id`/`updatedAt` keep the
 * deterministic ordering; the joined type is rendered by both surfaces.
 */
const ITEM_BASE_COLUMNS = {
  id: items.id,
  title: items.title,
  description: items.description,
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

/** The recent list renders no body, so it selects only the base columns. */
const ITEM_LIST_COLUMNS = ITEM_BASE_COLUMNS;

/** Pinned cards render the body, so they add the payload columns. */
const ITEM_PINNED_COLUMNS = {
  ...ITEM_BASE_COLUMNS,
  content: items.content,
  url: items.url,
  fileName: items.fileName,
  language: items.language,
} as const;

/**
 * Pinned items, newest first. `id` breaks ties deterministically: the seed
 * writes every item in one transaction, so `updated_at` values can tie.
 */
export function pinnedItemsQuery(userId: string, limit: number) {
  return db
    .select(ITEM_PINNED_COLUMNS)
    .from(items)
    .innerJoin(itemTypes, eq(itemTypes.id, items.itemTypeId))
    .where(and(eq(items.ownerId, userId), eq(items.isPinned, true)))
    .orderBy(desc(items.updatedAt), asc(items.id))
    .limit(limit);
}

/**
 * Most recently updated items, newest first, with the same `id` tie-break.
 * Selects the narrow list columns so item bodies never leave the database for
 * a list that does not render them.
 */
export function recentItemsQuery(userId: string, limit: number) {
  return db
    .select(ITEM_LIST_COLUMNS)
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

/** Loads the batched tags for a non-empty item result, skipping the query otherwise. */
async function loadTagRows(
  userId: string,
  itemIds: string[],
): Promise<ItemTagRow[]> {
  if (itemIds.length === 0) return [];

  return itemTagsQuery(userId, itemIds);
}

/** The owner's pinned items, at most `limit` (default 2), newest first. */
export async function getPinnedItems(
  userId: string,
  limit = 2,
): Promise<DashboardItem[]> {
  const rows = await pinnedItemsQuery(userId, limit);
  const tagRows = await loadTagRows(
    userId,
    rows.map((row) => row.id),
  );

  return buildDashboardItems(rows, tagRows);
}

/** The owner's most recently updated items (default 10), newest first. */
export async function getRecentItems(
  userId: string,
  limit = 10,
): Promise<RecentItem[]> {
  const rows = await recentItemsQuery(userId, limit);
  const tagRows = await loadTagRows(
    userId,
    rows.map((row) => row.id),
  );

  return buildRecentItems(rows, tagRows);
}

/**
 * One row per system item type with the resolved owner's item count. The LEFT
 * JOIN keeps types with zero items; the owner filter lives in the join
 * condition so other users' items never contribute to the count.
 */
export function systemItemTypeCountsQuery(userId: string) {
  return db
    .select({
      id: itemTypes.id,
      key: itemTypes.key,
      name: itemTypes.name,
      color: itemTypes.color,
      icon: itemTypes.icon,
      contentKind: itemTypes.contentKind,
      itemCount: count(items.id),
    })
    .from(itemTypes)
    .leftJoin(
      items,
      and(eq(items.itemTypeId, itemTypes.id), eq(items.ownerId, userId)),
    )
    .where(eq(itemTypes.isSystem, true))
    .groupBy(
      itemTypes.id,
      itemTypes.key,
      itemTypes.name,
      itemTypes.color,
      itemTypes.icon,
      itemTypes.contentKind,
    )
    .orderBy(asc(itemTypes.key));
}

/**
 * System item types with live owner-scoped counts, ordered canonically and
 * marked with the signed-in user's plan-aware Pro locks.
 */
export async function getSidebarItemTypes(
  userId: string,
  plan: UserPlan,
): Promise<SidebarItemType[]> {
  const rows = await systemItemTypeCountsQuery(userId);
  return buildSidebarItemTypes(rows, plan);
}

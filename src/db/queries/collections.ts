import "server-only";

import { and, count, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { collections, itemCollections, itemTypes, items } from "@/db/schema";
import {
  buildCollectionSummaries,
  type CollectionSummary,
  type DashboardCounts,
} from "@/features/collections/summary";

/**
 * Owner-scoped read queries for the dashboard's collection cards.
 *
 * Every query filters on the resolved server-side `userId`; no caller may pass
 * a client-supplied owner. Queries are set-based (one grouped join), not N+1.
 */

/**
 * Base rows for the "recent collections" cards. "Recent" is `updatedAt DESC`,
 * which the `collections_owner_updated_idx` index covers.
 */
export function recentCollectionsQuery(userId: string, limit: number) {
  return db
    .select({
      id: collections.id,
      slug: collections.slug,
      name: collections.name,
      description: collections.description,
    })
    .from(collections)
    .where(eq(collections.ownerId, userId))
    .orderBy(desc(collections.updatedAt))
    .limit(limit);
}

/**
 * One grouped row per `(collection, item type)`. Owner-scoped on both the
 * collection and the item, so a stale join can never leak another user's data.
 */
export function collectionTypeBreakdownQuery(
  userId: string,
  collectionIds: string[],
) {
  return db
    .select({
      collectionId: itemCollections.collectionId,
      typeId: itemTypes.id,
      typeKey: itemTypes.key,
      typeName: itemTypes.name,
      typeColor: itemTypes.color,
      typeIcon: itemTypes.icon,
      itemCount: count(items.id),
    })
    .from(itemCollections)
    .innerJoin(items, eq(items.id, itemCollections.itemId))
    .innerJoin(itemTypes, eq(itemTypes.id, items.itemTypeId))
    .innerJoin(collections, eq(collections.id, itemCollections.collectionId))
    .where(
      and(
        eq(collections.ownerId, userId),
        eq(items.ownerId, userId),
        inArray(itemCollections.collectionId, collectionIds),
      ),
    )
    .groupBy(
      itemCollections.collectionId,
      itemTypes.id,
      itemTypes.key,
      itemTypes.name,
      itemTypes.color,
      itemTypes.icon,
    );
}

/** Recent collections with item counts and per-type usage, newest first. */
export async function getRecentCollections(
  userId: string,
  limit = 4,
): Promise<CollectionSummary[]> {
  const collectionRows = await recentCollectionsQuery(userId, limit);
  if (collectionRows.length === 0) return [];

  const typeRows = await collectionTypeBreakdownQuery(
    userId,
    collectionRows.map((row) => row.id),
  );

  return buildCollectionSummaries(collectionRows, typeRows);
}

/** Owner-scoped item and collection totals for the dashboard header and stats. */
export async function getDashboardCounts(
  userId: string,
): Promise<DashboardCounts> {
  const [itemRows, collectionRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(items)
      .where(eq(items.ownerId, userId)),
    db
      .select({ value: count() })
      .from(collections)
      .where(eq(collections.ownerId, userId)),
  ]);

  return {
    items: itemRows[0]?.value ?? 0,
    collections: collectionRows[0]?.value ?? 0,
  };
}

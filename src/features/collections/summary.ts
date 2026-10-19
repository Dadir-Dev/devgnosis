import type { collections } from "@/db/schema/collections";
import { SYSTEM_TYPE_KEYS } from "@/lib/system-item-types";

/** Neutral tint for collections without items (matches the previous mock fallback). */
export const NEUTRAL_COLLECTION_COLOR = "#6B7280";

/** A single item type present in a collection, with how often it is used. */
export type ItemTypeSummary = {
  id: string;
  key: string;
  name: string;
  color: string;
  icon: string;
  count: number;
};

/** Serializable view model rendered by the recent-collection cards. */
export type CollectionSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  itemCount: number;
  /** Types present in the collection, ordered by usage (see `sortTypesByUsage`). */
  types: ItemTypeSummary[];
  /** Most-used type, or null for a collection without items. */
  dominantType: ItemTypeSummary | null;
};

/** Owner-scoped totals used by the dashboard header and stat cards. */
export type DashboardCounts = {
  items: number;
  collections: number;
  favoriteItems: number;
  favoriteCollections: number;
  /** Items created in the last rolling 7 days (not the calendar week). */
  addedThisWeek: number;
};

/** Columns selected for each collection card. Derived from the Drizzle schema. */
export type CollectionRow = Pick<
  typeof collections.$inferSelect,
  "id" | "slug" | "name" | "description"
>;

/** One grouped `(collection, item type)` row produced by the query module. */
export type CollectionTypeCountRow = {
  collectionId: string;
  typeId: string;
  typeKey: string;
  typeName: string;
  typeColor: string;
  typeIcon: string;
  itemCount: number;
};

const SYSTEM_TYPE_RANK = new Map<string, number>(
  SYSTEM_TYPE_KEYS.map((key, index) => [key, index]),
);

/** Rank a type by the system order; unknown (custom) keys sort after system types. */
function typeRank(key: string): number {
  return SYSTEM_TYPE_RANK.get(key) ?? SYSTEM_TYPE_KEYS.length;
}

/**
 * Order types by usage (highest first), then by the system type order, then by
 * key so the dominant color and icon row are stable across renders.
 */
export function sortTypesByUsage(types: ItemTypeSummary[]): ItemTypeSummary[] {
  return [...types].sort(
    (a, b) =>
      b.count - a.count ||
      typeRank(a.key) - typeRank(b.key) ||
      a.key.localeCompare(b.key),
  );
}

/** The most-used type in a collection, or null when it has no items. */
export function pickDominantType(types: ItemTypeSummary[]): ItemTypeSummary | null {
  return sortTypesByUsage(types)[0] ?? null;
}

/**
 * Assembles the card view models from the owner-scoped collection rows and the
 * grouped type counts. `itemCount` is the sum of the per-type counts, so it can
 * never disagree with the icon row.
 */
export function buildCollectionSummaries(
  collectionRows: CollectionRow[],
  typeRows: CollectionTypeCountRow[],
): CollectionSummary[] {
  const typesByCollection = new Map<string, ItemTypeSummary[]>();

  for (const row of typeRows) {
    const types = typesByCollection.get(row.collectionId) ?? [];
    types.push({
      id: row.typeId,
      key: row.typeKey,
      name: row.typeName,
      color: row.typeColor,
      icon: row.typeIcon,
      count: row.itemCount,
    });
    typesByCollection.set(row.collectionId, types);
  }

  return collectionRows.map((collection) => {
    const types = sortTypesByUsage(typesByCollection.get(collection.id) ?? []);

    return {
      id: collection.id,
      slug: collection.slug,
      name: collection.name,
      description: collection.description,
      itemCount: types.reduce((total, type) => total + type.count, 0),
      types,
      dominantType: pickDominantType(types),
    };
  });
}

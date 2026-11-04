import type { collections } from "@/db/schema/collections";
import type { itemTypes } from "@/db/schema/item-types";
import {
  NEUTRAL_COLLECTION_COLOR,
  type CollectionSummary,
} from "@/features/collections/summary";
import type { UserPlan } from "@/lib/plans";
import { SYSTEM_TYPE_KEYS } from "@/lib/system-item-types";

/**
 * Serializable sidebar view models. The DB query modules build these so the
 * client-side sidebar never imports Drizzle, auth, or mock data.
 */

/** One system item type joined to the resolved owner's item count. */
export type SidebarItemTypeRow = Pick<
  typeof itemTypes.$inferSelect,
  "id" | "key" | "name" | "color" | "icon" | "contentKind"
> & {
  itemCount: number;
};

export type SidebarItemType = {
  id: string;
  key: string;
  /** Plural label used by the current sidebar design, e.g. "Snippets". */
  label: string;
  color: string;
  icon: string;
  itemCount: number;
  /** True for Pro-only types viewed by a free user (shows the PRO badge). */
  isLocked: boolean;
};

/** The collection fields the sidebar needs beyond the shared summary. */
export type SidebarCollectionRow = Pick<
  typeof collections.$inferSelect,
  "id" | "isFavorite"
>;

export type SidebarCollection = {
  id: string;
  slug: string;
  name: string;
  itemCount: number;
  isFavorite: boolean;
  /** Dominant type color; neutral when the collection has no items. */
  dominantColor: string;
};

export type SidebarCollections = {
  favorites: SidebarCollection[];
  recents: SidebarCollection[];
};

const SYSTEM_TYPE_RANK = new Map<string, number>(
  SYSTEM_TYPE_KEYS.map((key, index) => [key, index]),
);

/**
 * The sidebar uses plural labels (`Snippet` -> `Snippets`) while the seeded
 * type names stay singular. Already-plural names are left untouched.
 */
export function formatTypeLabel(name: string): string {
  const label = name.trim();
  if (!label) return "";

  return label.endsWith("s") ? label : `${label}s`;
}

/**
 * Orders system types by the canonical system order and applies the signed-in
 * user's plan. File/Image are the Pro-only types (their `contentKind` is
 * `file`); free users see a PRO badge, Pro users see their counts.
 */
export function buildSidebarItemTypes(
  rows: SidebarItemTypeRow[],
  plan: UserPlan,
): SidebarItemType[] {
  return [...rows]
    .sort(
      (a, b) =>
        (SYSTEM_TYPE_RANK.get(a.key) ?? SYSTEM_TYPE_KEYS.length) -
          (SYSTEM_TYPE_RANK.get(b.key) ?? SYSTEM_TYPE_KEYS.length) ||
        a.key.localeCompare(b.key),
    )
    .map((row) => {
      const isProType = row.contentKind === "file";

      return {
        id: row.id,
        key: row.key,
        label: formatTypeLabel(row.name),
        color: row.color,
        icon: row.icon,
        itemCount: row.itemCount,
        isLocked: plan === "free" && isProType,
      };
    });
}

/**
 * Splits the owner's collections into sidebar favorites and the non-favorites.
 * `summaries` must already be ordered newest first, and the query already
 * bounds the non-favorites to the sidebar's recent limit.
 */
export function buildSidebarCollections(
  rows: SidebarCollectionRow[],
  summaries: CollectionSummary[],
): SidebarCollections {
  const favoriteById = new Map(
    rows.map((row) => [row.id, row.isFavorite]),
  );

  const collections = summaries.map((summary) => ({
    id: summary.id,
    slug: summary.slug,
    name: summary.name,
    itemCount: summary.itemCount,
    isFavorite: favoriteById.get(summary.id) ?? false,
    dominantColor:
      summary.dominantType?.color ?? NEUTRAL_COLLECTION_COLOR,
  }));

  return {
    favorites: collections.filter((collection) => collection.isFavorite),
    recents: collections.filter((collection) => !collection.isFavorite),
  };
}

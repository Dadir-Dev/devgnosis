import { Boxes, Folder, FolderHeart, Star } from "lucide-react";

import { collections, items } from "@/lib/mock-data";

const favoriteItemCount = items.filter((item) => item.isFavorite).length;
const favoriteCollectionCount = collections.filter((collection) => collection.isFavorite).length;

type StatsCardsProps = {
  /** Owner-scoped item total from the database. */
  itemCount: number;
  /** Owner-scoped collection total from the database. */
  collectionCount: number;
};

/**
 * Summary counters for the dashboard. Item and collection totals come from the
 * database; the favorite counters still read the mock data module.
 */
export function StatsCards({ itemCount, collectionCount }: StatsCardsProps) {
  const stats = [
    { label: "Items", value: itemCount, icon: Boxes },
    { label: "Collections", value: collectionCount, icon: Folder },
    { label: "Favorite items", value: favoriteItemCount, icon: Star },
    { label: "Favorite collections", value: favoriteCollectionCount, icon: FolderHeart },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon aria-hidden="true" className="size-4" />
            <span className="text-sm">{label}</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  );
}

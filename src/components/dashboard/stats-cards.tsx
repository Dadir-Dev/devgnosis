import { Boxes, Folder, FolderHeart, Star } from "lucide-react";

import { collections, dashboardStats, items } from "@/lib/mock-data";

const favoriteItemCount = items.filter((item) => item.isFavorite).length;
const favoriteCollectionCount = collections.filter((collection) => collection.isFavorite).length;

const STATS = [
  { label: "Items", value: dashboardStats.totalItems, icon: Boxes },
  { label: "Collections", value: dashboardStats.totalCollections, icon: Folder },
  { label: "Favorite items", value: favoriteItemCount, icon: Star },
  { label: "Favorite collections", value: favoriteCollectionCount, icon: FolderHeart },
] as const;

/** Summary counters for the dashboard: totals and favorites. */
export function StatsCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STATS.map(({ label, value, icon: Icon }) => (
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

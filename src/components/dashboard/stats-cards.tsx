import { Boxes, Folder, FolderHeart, Star } from "lucide-react";

import type { DashboardCounts } from "@/features/collections/summary";

type StatsCardsProps = {
  /** Owner-scoped totals from the database. */
  counts: DashboardCounts;
};

/** Summary counters for the dashboard. */
export function StatsCards({ counts }: StatsCardsProps) {
  const stats = [
    { label: "Items", value: counts.items, icon: Boxes },
    { label: "Collections", value: counts.collections, icon: Folder },
    { label: "Favorite items", value: counts.favoriteItems, icon: Star },
    {
      label: "Favorite collections",
      value: counts.favoriteCollections,
      icon: FolderHeart,
    },
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

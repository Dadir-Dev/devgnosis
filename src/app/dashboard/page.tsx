import { PinnedItems } from "@/components/dashboard/pinned-items";
import { RecentCollections } from "@/components/dashboard/recent-collections";
import { RecentItems } from "@/components/dashboard/recent-items";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { getDashboardCounts, getRecentCollections } from "@/db/queries/collections";
import { requireUser } from "@/lib/auth-session";
import { dashboardStats } from "@/lib/mock-data";

/**
 * Dashboard main area: greeting, summary stats, pinned items, recent
 * collections, and the ten most recent items. Collections and the
 * item/collection totals come from owner-scoped database queries; the pinned
 * items, recent items, favorites, and sidebar still read the mock data module.
 */
export default async function DashboardPage() {
  const user = await requireUser();

  const [recentCollections, counts] = await Promise.all([
    getRecentCollections(user.id),
    getDashboardCounts(user.id),
  ]);

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {dashboardStats.greeting}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {counts.items} items across {counts.collections} collections ·{" "}
          {dashboardStats.addedThisWeek} added this week
        </p>
      </div>

      <StatsCards
        itemCount={counts.items}
        collectionCount={counts.collections}
      />
      <PinnedItems />
      <RecentCollections collections={recentCollections} />
      <RecentItems />
    </div>
  );
}

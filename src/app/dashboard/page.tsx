import { PinnedItems } from "@/components/dashboard/pinned-items";
import { RecentCollections } from "@/components/dashboard/recent-collections";
import { RecentItems } from "@/components/dashboard/recent-items";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { currentUser, dashboardStats } from "@/lib/mock-data";

/**
 * Dashboard main area: greeting, summary stats, pinned items, recent
 * collections, and the ten most recent items. Reads the mock data module
 * directly until owner-scoped queries replace it.
 */
export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {dashboardStats.greeting}, {currentUser.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {dashboardStats.totalItems} items across {dashboardStats.totalCollections} collections ·{" "}
          {dashboardStats.addedThisWeek} added this week
        </p>
      </div>

      <StatsCards />
      <PinnedItems />
      <RecentCollections />
      <RecentItems />
    </div>
  );
}

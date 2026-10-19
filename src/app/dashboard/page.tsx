import { PinnedItems } from "@/components/dashboard/pinned-items";
import { RecentCollections } from "@/components/dashboard/recent-collections";
import { RecentItems } from "@/components/dashboard/recent-items";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { getDashboardCounts, getRecentCollections } from "@/db/queries/collections";
import { getPinnedItems, getRecentItems } from "@/db/queries/items";
import { requireUser } from "@/lib/auth-session";

/** Static greeting until personalized greetings are implemented. */
const DASHBOARD_GREETING = "Good morning";

/**
 * Dashboard main area: greeting, summary stats, pinned items, recent
 * collections, and the ten most recent items. Every data section comes from
 * owner-scoped database queries.
 */
export default async function DashboardPage() {
  const user = await requireUser();

  const [recentCollections, counts, pinnedItems, recentItems] =
    await Promise.all([
      getRecentCollections(user.id),
      getDashboardCounts(user.id),
      getPinnedItems(user.id),
      getRecentItems(user.id),
    ]);

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {DASHBOARD_GREETING}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {counts.items} items across {counts.collections} collections ·{" "}
          {counts.addedThisWeek} added this week
        </p>
      </div>

      <StatsCards counts={counts} />
      <PinnedItems items={pinnedItems} />
      <RecentCollections collections={recentCollections} />
      <RecentItems items={recentItems} />
    </div>
  );
}

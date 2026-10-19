import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

/** Route-level loading UI while the dashboard's owner-scoped reads resolve. */
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}

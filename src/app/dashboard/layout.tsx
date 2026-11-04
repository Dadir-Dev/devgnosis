import { Sidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { TopBar } from "@/components/dashboard/top-bar";
import {
  getDashboardCounts,
  getSidebarCollections,
} from "@/db/queries/collections";
import { getSidebarItemTypes } from "@/db/queries/items";
import { getUserPlan } from "@/db/queries/profiles";
import { requireUser } from "@/lib/auth-session";

/**
 * The dashboard shell reads the session and owner-scoped sidebar data on every
 * request, so it cannot produce a static shell. The route's `loading.tsx` still
 * streams the main dashboard content.
 */
export const instant = false;

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const user = await requireUser();
  const plan = await getUserPlan(user.id);

  const [itemTypes, sidebarCollections, counts] = await Promise.all([
    getSidebarItemTypes(user.id, plan),
    getSidebarCollections(user.id),
    getDashboardCounts(user.id),
  ]);

  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full overflow-hidden">
        <Sidebar
          user={{ name: user.name, email: user.email }}
          itemTypes={itemTypes}
          favoriteCollections={sidebarCollections.favorites}
          recentCollections={sidebarCollections.recents}
          favoriteItemCount={counts.favoriteItems}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

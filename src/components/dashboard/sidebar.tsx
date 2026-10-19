"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "radix-ui";
import {
  ChevronsLeft,
  ChevronsRight,
  Clock,
  CodeXml,
  Folder,
  House,
  Lock,
  Menu,
  Moon,
  Search,
  Settings,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { FALLBACK_TYPE_ICON, TYPE_ICONS } from "@/lib/item-types";
import { collections, currentUser, itemTypes, items } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import { useSidebar } from "./sidebar-context";

/** Favorites pinned near the top of the collections list. */
const favoriteCollections = collections.filter((collection) => collection.isFavorite);

/** Newest collections, excluding the ones already shown as favorites. */
const recentCollections = collections
  .filter((collection) => !collection.isFavorite)
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  .slice(0, 4);

const favoriteItemCount = items.filter((item) => item.isFavorite).length;

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarNavLinkProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  active: boolean;
  onNavigate?: () => void;
  /** Trailing content (count, shortcut, badge) rendered when expanded. */
  trailing?: ReactNode;
  /** Runtime color token for item types; the documented inline-style exception. */
  iconColor?: string;
};

function SidebarNavLink({
  href,
  icon: Icon,
  label,
  collapsed,
  active,
  onNavigate,
  trailing,
  iconColor,
}: SidebarNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "flex h-8 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-sidebar-foreground/70 outline-none transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring/50",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon
        aria-hidden="true"
        className="size-4 shrink-0"
        style={iconColor ? { color: iconColor } : undefined}
      />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
      {!collapsed && trailing}
    </Link>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="px-2.5 pt-4 pb-1 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </h2>
  );
}

function SectionBreak() {
  return <div className="mx-2 my-1 border-t border-sidebar-border" />;
}

type SidebarHeaderProps = {
  collapsed: boolean;
  mobile: boolean;
  onClose?: () => void;
};

function SidebarHeader({ collapsed, mobile, onClose }: SidebarHeaderProps) {
  const { toggleCollapsed } = useSidebar();

  if (collapsed && !mobile) {
    return (
      <div className="flex h-14 shrink-0 items-center justify-center border-b border-sidebar-border">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          onClick={toggleCollapsed}
          aria-label="Expand sidebar"
        >
          <ChevronsRight aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-3">
      <Link
        href="/dashboard"
        className="flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <CodeXml aria-hidden="true" className="size-4" />
        </span>
        <span className="truncate text-base font-semibold">DevGnosis</span>
      </Link>

      {mobile ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="ml-auto text-muted-foreground"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X aria-hidden="true" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="ml-auto text-muted-foreground"
          onClick={toggleCollapsed}
          aria-label="Collapse sidebar"
        >
          <ChevronsLeft aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

type SidebarPanelProps = {
  collapsed: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
};

function SidebarPanel({ collapsed, mobile = false, onNavigate }: SidebarPanelProps) {
  const pathname = usePathname();
  const initials = currentUser.name.slice(0, 1).toUpperCase();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SidebarHeader collapsed={collapsed} mobile={mobile} onClose={onNavigate} />

      <nav
        aria-label="Dashboard"
        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2"
      >
        <SidebarNavLink
          href="/search"
          icon={Search}
          label="Search"
          collapsed={collapsed}
          active={isPathActive(pathname, "/search")}
          onNavigate={onNavigate}
          trailing={
            <kbd className="rounded border border-sidebar-border px-1.5 py-0.5 font-sans text-[0.65rem] text-muted-foreground">
              ⌘K
            </kbd>
          }
        />
        <SidebarNavLink
          href="/dashboard"
          icon={House}
          label="Home"
          collapsed={collapsed}
          active={isPathActive(pathname, "/dashboard")}
          onNavigate={onNavigate}
        />
        <SidebarNavLink
          href="/favorites"
          icon={Star}
          label="Favorites"
          collapsed={collapsed}
          active={isPathActive(pathname, "/favorites")}
          onNavigate={onNavigate}
          trailing={
            <span className="text-xs tabular-nums text-muted-foreground">{favoriteItemCount}</span>
          }
        />
        <SidebarNavLink
          href="/recently-used"
          icon={Clock}
          label="Recently used"
          collapsed={collapsed}
          active={isPathActive(pathname, "/recently-used")}
          onNavigate={onNavigate}
        />

        {collapsed ? <SectionBreak /> : <SectionLabel>Types</SectionLabel>}
        {itemTypes.map((type) => (
          <SidebarNavLink
            key={type.id}
            href={`/items/${type.key}`}
            icon={TYPE_ICONS[type.key] ?? FALLBACK_TYPE_ICON}
            label={type.name}
            iconColor={type.color}
            collapsed={collapsed}
            active={isPathActive(pathname, `/items/${type.key}`)}
            onNavigate={onNavigate}
            trailing={
              type.isPro ? (
                <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-muted-foreground">
                  <Lock aria-hidden="true" className="size-3" />
                  PRO
                </span>
              ) : (
                <span className="text-xs tabular-nums text-muted-foreground">{type.itemCount}</span>
              )
            }
          />
        ))}

        {favoriteCollections.length > 0 && (
          <>
            {collapsed ? (
              <SectionBreak />
            ) : (
              <SectionLabel>Favorite collections</SectionLabel>
            )}
            {favoriteCollections.map((collection) => (
              <SidebarNavLink
                key={collection.id}
                href={`/collections/${collection.slug}`}
                icon={Star}
                label={collection.name}
                collapsed={collapsed}
                active={isPathActive(pathname, `/collections/${collection.slug}`)}
                onNavigate={onNavigate}
              />
            ))}
          </>
        )}

        {collapsed ? <SectionBreak /> : <SectionLabel>Recent collections</SectionLabel>}
        {recentCollections.map((collection) => (
          <SidebarNavLink
            key={collection.id}
            href={`/collections/${collection.slug}`}
            icon={Folder}
            label={collection.name}
            collapsed={collapsed}
            active={isPathActive(pathname, `/collections/${collection.slug}`)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <SidebarNavLink
          href="/settings"
          icon={Settings}
          label="Settings"
          collapsed={collapsed}
          active={isPathActive(pathname, "/settings")}
          onNavigate={onNavigate}
        />

        <div
          className={cn(
            "flex h-8 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-sidebar-foreground/70",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? "Theme: Dark" : undefined}
        >
          <Moon aria-hidden="true" className="size-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1">Theme</span>
              <span className="text-xs text-muted-foreground">Dark</span>
            </>
          )}
          {collapsed && <span className="sr-only">Theme: Dark</span>}
        </div>

        <div className={cn("mt-1 flex items-center gap-2 rounded-lg p-2", collapsed && "justify-center p-1")}>
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground"
          >
            {initials}
          </span>
          {collapsed ? (
            <span className="sr-only">{`${currentUser.name} — ${currentUser.email}`}</span>
          ) : (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{currentUser.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {currentUser.email}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard sidebar. A collapsible rail on desktop and a modal drawer on
 * mobile; both render the same navigation panel.
 */
export function Sidebar() {
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      <aside
        data-collapsed={isCollapsed}
        className={cn(
          "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out motion-reduce:transition-none md:flex",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarPanel collapsed={isCollapsed} />
      </aside>

      <Dialog.Root open={isMobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none md:hidden" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col border-r border-sidebar-border bg-sidebar shadow-xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left motion-reduce:animate-none md:hidden"
          >
            <Dialog.Title className="sr-only">Dashboard navigation</Dialog.Title>
            <SidebarPanel collapsed={false} mobile onNavigate={() => setMobileOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

/** Top-bar control that opens the mobile navigation drawer. */
export function SidebarTrigger() {
  const { openMobile } = useSidebar();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="md:hidden"
      aria-label="Open navigation"
      onClick={openMobile}
    >
      <Menu aria-hidden="true" />
    </Button>
  );
}

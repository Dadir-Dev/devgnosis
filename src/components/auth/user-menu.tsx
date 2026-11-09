"use client";

import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { LogOut, User } from "lucide-react";
import { useRef, type RefObject } from "react";
import { useFormStatus } from "react-dom";

import { signOutAction } from "@/actions/auth";
import { UserAvatar } from "@/components/auth/user-avatar";
import type { SidebarUser } from "@/features/dashboard/sidebar";
import { cn } from "@/lib/utils";

const menuItemClassName =
  "flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm outline-none select-none data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring/50";

const avatarClassName =
  "bg-sidebar-accent text-sidebar-accent-foreground";

/** Menu item keeps its pending state while the sign-out action runs. */
function SignOutItem({
  formRef,
}: {
  formRef: RefObject<HTMLFormElement | null>;
}) {
  const { pending } = useFormStatus();

  return (
    <DropdownMenu.Item
      aria-disabled={pending || undefined}
      className={cn(menuItemClassName, "w-full", pending && "opacity-50")}
      onSelect={(event) => {
        if (pending) return;

        // Keep the menu open so the pending state is visible until the
        // server action's redirect navigates away.
        event.preventDefault();
        formRef.current?.requestSubmit();
      }}
    >
      <LogOut aria-hidden="true" className="size-4 shrink-0" />
      <span>{pending ? "Signing out…" : "Sign out"}</span>
    </DropdownMenu.Item>
  );
}

type UserMenuProps = {
  user: SidebarUser;
  collapsed: boolean;
  /** Closes the mobile drawer after navigating. */
  onNavigate?: () => void;
};

/**
 * Sidebar identity block. The avatar/name area is the account-menu trigger in
 * both the expanded and collapsed states; the menu holds Profile and Sign out.
 */
export function UserMenu({ user, collapsed, onNavigate }: UserMenuProps) {
  const signOutFormRef = useRef<HTMLFormElement>(null);

  return (
    <DropdownMenu.Root>
      <div className={cn("mt-1", collapsed && "flex flex-col items-center")}>
        <DropdownMenu.Trigger asChild>
          {collapsed ? (
            <button
              type="button"
              title={user.name}
              aria-label="Open account menu"
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50"
            >
              <UserAvatar
                name={user.name}
                email={user.email}
                image={user.image}
                size="sm"
                className={avatarClassName}
              />
            </button>
          ) : (
            <button
              type="button"
              className="flex w-full min-w-0 items-center gap-2 rounded-lg p-1 text-left outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring/50 data-[state=open]:bg-sidebar-accent"
            >
              <UserAvatar
                name={user.name}
                email={user.email}
                image={user.image}
                size="sm"
                className={avatarClassName}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </span>
            </button>
          )}
        </DropdownMenu.Trigger>
        {collapsed && (
          <span className="sr-only">{`${user.name} — ${user.email}`}</span>
        )}
      </div>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="end"
          sideOffset={8}
          className="z-50 min-w-56 rounded-lg border border-sidebar-border bg-sidebar p-1 text-sidebar-foreground shadow-md"
        >
          <DropdownMenu.Label className="flex min-w-0 flex-col px-2 py-1.5">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-sidebar-border" />
          <DropdownMenu.Item asChild>
            <Link href="/profile" onClick={onNavigate} className={menuItemClassName}>
              <User aria-hidden="true" className="size-4 shrink-0" />
              <span>Profile</span>
            </Link>
          </DropdownMenu.Item>
          <form ref={signOutFormRef} action={signOutAction}>
            <SignOutItem formRef={signOutFormRef} />
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

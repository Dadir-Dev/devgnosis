"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type SidebarContextValue = {
  /** Desktop sidebar collapsed to an icon-only rail. */
  isCollapsed: boolean;
  /** Mobile drawer visibility. */
  isMobileOpen: boolean;
  toggleCollapsed: () => void;
  openMobile: () => void;
  closeMobile: () => void;
  setMobileOpen: (open: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * Holds the dashboard sidebar's interactive state so the desktop sidebar and
 * the top-bar trigger (in separate components) stay in sync. State lives here
 * rather than in the server layout, keeping the client boundary small.
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const value = useMemo<SidebarContextValue>(
    () => ({
      isCollapsed,
      isMobileOpen,
      toggleCollapsed: () => setIsCollapsed((collapsed) => !collapsed),
      openMobile: () => setIsMobileOpen(true),
      closeMobile: () => setIsMobileOpen(false),
      setMobileOpen: setIsMobileOpen,
    }),
    [isCollapsed, isMobileOpen],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

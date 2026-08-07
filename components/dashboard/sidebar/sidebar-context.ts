"use client";

import { createContext, useContext } from "react";

import type { DashboardNavConfig } from "./navigation";

export type DashboardSidebarContextValue = {
  /** Role-specific navigation, branding, and placeholder identity. */
  config: DashboardNavConfig;
  /** Desktop rail is icon-only. Never true while the mobile drawer is open. */
  collapsed: boolean;
  /** True while the component renders inside the off-canvas mobile drawer. */
  isMobile: boolean;
  toggleCollapsed: () => void;
  closeMobile: () => void;
};

const DashboardSidebarContext =
  createContext<DashboardSidebarContextValue | null>(null);

export const DashboardSidebarProvider = DashboardSidebarContext.Provider;

export function useDashboardSidebar(): DashboardSidebarContextValue {
  const context = useContext(DashboardSidebarContext);

  if (!context) {
    throw new Error(
      "useDashboardSidebar must be used inside a DashboardSidebar subtree.",
    );
  }

  return context;
}

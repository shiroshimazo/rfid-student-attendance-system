"use client";

import { useMemo } from "react";

import type { DashboardNavConfig } from "./navigation";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNavigation } from "./SidebarNavigation";
import { SidebarProfileFooter } from "./SidebarProfileFooter";
import { DashboardSidebarProvider } from "./sidebar-context";

type DashboardSidebarProps = {
  config: DashboardNavConfig;
  collapsed: boolean;
  isMobile: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
};

/**
 * Fixed header, independently scrolling navigation, pinned profile footer. The
 * three-row column is what keeps the footer on screen when the viewport is
 * short. Role-agnostic — Admin and Student differ only by `config`.
 *
 * The column deliberately does not clip its overflow: the collapsed rail is
 * narrower than the profile flyout, which has to escape sideways to stay
 * readable. Scrolling is contained by the nav itself, not by this element.
 */
export function DashboardSidebar({
  config,
  collapsed,
  isMobile,
  onToggleCollapsed,
  onCloseMobile,
}: DashboardSidebarProps) {
  const contextValue = useMemo(
    () => ({
      config,
      collapsed,
      isMobile,
      toggleCollapsed: onToggleCollapsed,
      closeMobile: onCloseMobile,
    }),
    [config, collapsed, isMobile, onToggleCollapsed, onCloseMobile],
  );

  return (
    <DashboardSidebarProvider value={contextValue}>
      <div className="flex h-full flex-col bg-brand-1 text-rail-fg">
        <SidebarHeader />
        <SidebarNavigation />
        <SidebarProfileFooter />
      </div>
    </DashboardSidebarProvider>
  );
}

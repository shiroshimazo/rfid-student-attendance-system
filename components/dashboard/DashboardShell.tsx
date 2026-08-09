"use client";

import { HamburgerMenu } from "iconsax-reactjs";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { DashboardSidebar } from "./sidebar/DashboardSidebar";
import { type DashboardNavConfig } from "./sidebar/navigation";
import {
  setSidebarCollapsed,
  useSidebarCollapsed,
} from "./use-sidebar-preference";

const expandedWidth = "17rem";
const collapsedWidth = "4.5rem";

type DashboardShellProps = {
  config: DashboardNavConfig;
  children: React.ReactNode;
};

/**
 * Layout shell shared by every role's dashboard: fixed desktop rail, off-canvas
 * mobile drawer, and a content column that tracks the rail width.
 */
export function DashboardShell({ config, children }: DashboardShellProps) {
  const pathname = usePathname();
  const collapsed = useSidebarCollapsed(config.storageKey);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPathname, setDrawerPathname] = useState(pathname);

  // Navigating always dismisses the drawer, including for routes reached
  // outside the nav items (browser back/forward, in-page links). Adjusted
  // during render rather than in an effect so no extra pass is scheduled.
  if (pathname !== drawerPathname) {
    setDrawerPathname(pathname);
    if (drawerOpen) {
      setDrawerOpen(false);
    }
  }

  const toggleCollapsed = useCallback(() => {
    setSidebarCollapsed(config.storageKey, !collapsed);
  }, [collapsed, config.storageKey]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Lock background scrolling and wire Escape while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  const sidebarLabel = `${config.fallbackTitle} sidebar`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop rail — fixed, full height, outside the content flow. */}
      <aside
        aria-label={sidebarLabel}
        style={{ width: collapsed ? collapsedWidth : expandedWidth }}
        className="fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 ease-out md:block"
      >
        <DashboardSidebar
          config={config}
          collapsed={collapsed}
          isMobile={false}
          onToggleCollapsed={toggleCollapsed}
          onCloseMobile={closeDrawer}
        />
      </aside>

      {/* Mobile off-canvas drawer. */}
      <div
        className={cn("md:hidden", !drawerOpen && "pointer-events-none")}
        aria-hidden={!drawerOpen}
      >
        <div
          onClick={closeDrawer}
          className={cn(
            "fixed inset-0 z-40 bg-brand-1/70 backdrop-blur-[2px] transition-opacity duration-200",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          aria-label={sidebarLabel}
          inert={!drawerOpen}
          style={{ width: expandedWidth }}
          className={cn(
            "fixed inset-y-0 left-0 z-50 max-w-[85vw] shadow-2xl transition-transform duration-200 ease-out",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <DashboardSidebar
            config={config}
            collapsed={false}
            isMobile
            onToggleCollapsed={toggleCollapsed}
            onCloseMobile={closeDrawer}
          />
        </aside>
      </div>

      {/* Content column. Margin, not padding, so nothing overflows sideways. */}
      <div
        style={
          {
            "--dashboard-rail-width": collapsed ? collapsedWidth : expandedWidth,
          } as React.CSSProperties
        }
        className="flex min-h-screen min-w-0 flex-col transition-[margin] duration-200 ease-out md:ml-[var(--dashboard-rail-width)]"
      >
        {/*
          The drawer trigger lives here, not in a bar of its own: the shell has
          no header row, so on mobile the button is the only chrome above the
          page content. It disappears at `md`, where the rail is always visible.
        */}
        <div className="px-4 pt-4 sm:px-6 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HamburgerMenu size={20} aria-hidden="true" />
          </button>
        </div>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

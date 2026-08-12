"use client";

import { CloseCircle, SidebarLeft, SidebarRight, Wifi } from "iconsax-reactjs";

import { cn } from "@/lib/utils";

import { useDashboardSidebar } from "./sidebar-context";

/**
 * Brand mark. The project has no logo asset yet, so the RFID signal glyph
 * stands in for it. Shared by every role so the panels stay visually related.
 */
function BrandMark() {
  return (
    <Wifi size={19} variant="Bold" className="rotate-45" aria-hidden="true" />
  );
}

export function SidebarHeader() {
  const { config, collapsed, isMobile, toggleCollapsed, closeMobile } =
    useDashboardSidebar();

  // Collapsed rail is 72px wide, which fits exactly one control. The brand tile
  // doubles as the expand affordance and swaps to the rail icon on hover/focus.
  if (collapsed && !isMobile) {
    return (
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-rail-hairline">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label="Expand sidebar"
          className="group/brand relative flex size-9 items-center justify-center rounded-xl bg-rail-active text-rail-fg transition-colors outline-none hover:bg-rail-hover focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="group-hover/brand:hidden group-focus-visible/brand:hidden">
            <BrandMark />
          </span>
          <SidebarRight
            size={20}
            aria-hidden="true"
            className="hidden group-hover/brand:block group-focus-visible/brand:block"
          />
          <span
            role="tooltip"
            className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg border border-rail-hairline bg-rail-surface px-2.5 py-1.5 text-xs text-rail-fg shadow-lg group-hover/brand:block group-focus-visible/brand:block"
          >
            {config.brandTitle}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-rail-hairline px-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rail-active text-rail-fg">
        <BrandMark />
      </span>

      <span className="min-w-0 flex-1 truncate font-heading text-[15px] font-medium tracking-tight text-rail-fg">
        {config.brandTitle}
      </span>

      <button
        type="button"
        onClick={isMobile ? closeMobile : toggleCollapsed}
        aria-label={isMobile ? "Close navigation" : "Collapse sidebar"}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg text-rail-icon transition-colors outline-none",
          "hover:bg-rail-hover hover:text-rail-fg focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {isMobile ? (
          <CloseCircle size={20} aria-hidden="true" />
        ) : (
          <SidebarLeft size={20} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

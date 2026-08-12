"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import type { NavItem } from "./navigation";
import { useDashboardSidebar } from "./sidebar-context";

type SidebarNavItemProps = {
  item: NavItem;
  active: boolean;
  /** Group label, prefixed onto the collapsed tooltip so context is not lost. */
  groupLabel: string;
};

export function SidebarNavItem({
  item,
  active,
  groupLabel,
}: SidebarNavItemProps) {
  const { collapsed, isMobile, closeMobile } = useDashboardSidebar();
  const iconOnly = collapsed && !isMobile;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={iconOnly ? `${groupLabel}: ${item.label}` : undefined}
      onClick={isMobile ? closeMobile : undefined}
      className={cn(
        "group/item relative flex min-h-10 items-center rounded-lg text-sm transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring",
        iconOnly ? "justify-center px-0" : "gap-3 px-3",
        active
          ? "bg-rail-active font-medium text-rail-fg"
          : "text-rail-muted hover:bg-rail-hover hover:text-rail-fg",
      )}
    >
      {/* Accent bar marking the active route. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-text transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />

      <Icon
        size={20}
        variant={active ? "Bold" : "Linear"}
        aria-hidden="true"
        className={cn("shrink-0", active ? "text-rail-fg" : "text-rail-icon")}
      />

      {!iconOnly && <span className="truncate">{item.label}</span>}

      {iconOnly && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg border border-rail-hairline bg-rail-surface px-2.5 py-1.5 text-xs text-rail-fg shadow-lg group-hover/item:block group-focus-visible/item:block"
        >
          <span className="text-rail-label">{groupLabel} · </span>
          {item.label}
        </span>
      )}
    </Link>
  );
}

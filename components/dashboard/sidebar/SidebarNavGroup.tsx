"use client";

import { ArrowDown2 } from "iconsax-reactjs";
import { useId } from "react";

import { cn } from "@/lib/utils";

import type { NavGroup, NavItem } from "./navigation";
import { SidebarNavItem } from "./SidebarNavItem";

type SidebarNavGroupProps = {
  group: NavGroup;
  open: boolean;
  /** True when any child route is active — keeps the parent visibly current. */
  active: boolean;
  onToggle: (groupId: string) => void;
  isItemActive: (item: NavItem) => boolean;
};

export function SidebarNavGroup({
  group,
  open,
  active,
  onToggle,
  isItemActive,
}: SidebarNavGroupProps) {
  const panelId = useId();
  const GroupIcon = group.icon;

  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(group.id)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-brand-3",
          active
            ? "text-rail-fg"
            : "text-rail-muted hover:bg-rail-hover hover:text-rail-fg",
        )}
      >
        <GroupIcon
          size={20}
          variant={active ? "Bold" : "Linear"}
          aria-hidden="true"
          className={cn("shrink-0", active ? "text-rail-fg" : "text-rail-icon")}
        />

        <span
          className={cn("flex-1 truncate text-left", active && "font-medium")}
        >
          {group.label}
        </span>

        <ArrowDown2
          size={16}
          aria-hidden="true"
          className={cn(
            "shrink-0 text-rail-icon transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* 0fr → 1fr animates to the children's natural height without a
          hard-coded max-height. `inert` keeps collapsed links out of the tab
          order while they stay mounted for the transition. */}
      <div
        id={panelId}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <ul className="ml-[22px] mt-1 space-y-0.5 border-l border-rail-hairline pl-2.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <SidebarNavItem
                  item={item}
                  active={isItemActive(item)}
                  groupLabel={group.label}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

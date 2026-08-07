"use client";

import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";

import {
  findActiveGroupId,
  isNavGroupActive,
  isNavItemActive,
  type NavItem,
} from "./navigation";
import { SidebarNavGroup } from "./SidebarNavGroup";
import { SidebarNavItem } from "./SidebarNavItem";
import { useDashboardSidebar } from "./sidebar-context";

export function SidebarNavigation() {
  const pathname = usePathname();
  const { config, collapsed, isMobile } = useDashboardSidebar();

  /** Every group starts open, matching the reference wireframe. */
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(config.groups.map((group) => [group.id, true])),
  );

  const activeGroupId = findActiveGroupId(config, pathname);
  const [trackedGroupId, setTrackedGroupId] = useState(activeGroupId);

  // Navigating into a collapsed group re-opens it so the current page is never
  // hidden behind a closed heading. Adjusted during render rather than in an
  // effect so the group is already open on the first paint of the new route.
  if (activeGroupId !== trackedGroupId) {
    setTrackedGroupId(activeGroupId);
    if (activeGroupId && !openGroups[activeGroupId]) {
      setOpenGroups({ ...openGroups, [activeGroupId]: true });
    }
  }

  function toggleGroup(groupId: string) {
    setOpenGroups((previous) => ({
      ...previous,
      [groupId]: !previous[groupId],
    }));
  }

  function itemActive(item: NavItem) {
    return isNavItemActive(config, pathname, item);
  }

  const iconOnly = collapsed && !isMobile;

  // Collapsed rail flattens the tree to leaf icons: group headings would hide
  // their children behind a click, and no route may become unreachable.
  if (iconOnly) {
    return (
      <nav
        aria-label={config.navLabel}
        className="rail-scroll flex-1 overflow-y-auto py-3"
      >
        <ul className="space-y-0.5 px-3">
          {config.groups.map((group, groupIndex) => (
            <Fragment key={group.id}>
              {groupIndex > 0 && (
                <li aria-hidden="true" className="py-1.5">
                  <hr className="border-t border-rail-hairline" />
                </li>
              )}
              {group.items.map((item) => (
                <li key={item.href}>
                  <SidebarNavItem
                    item={item}
                    active={itemActive(item)}
                    groupLabel={group.label}
                  />
                </li>
              ))}
            </Fragment>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav
      aria-label={config.navLabel}
      className="rail-scroll flex-1 overflow-y-auto py-3"
    >
      <ul className="space-y-1 px-3">
        {config.groups.map((group) => (
          <SidebarNavGroup
            key={group.id}
            group={group}
            open={openGroups[group.id] ?? false}
            active={isNavGroupActive(config, pathname, group)}
            onToggle={toggleGroup}
            isItemActive={itemActive}
          />
        ))}
      </ul>
    </nav>
  );
}

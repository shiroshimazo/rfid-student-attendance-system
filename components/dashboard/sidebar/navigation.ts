import type { Icon } from "iconsax-reactjs";

/**
 * How the current pathname is compared against an item's href.
 *
 * `exact` is required for section roots that are a prefix of every other route
 * in the section — without it `/student` would light up on every `/student/...`
 * page. `prefix` also matches nested detail routes, so
 * `/student/attendance/42` keeps "Attendance" active.
 */
export type NavMatch = "exact" | "prefix";

export type NavItem = {
  label: string;
  href: string;
  icon: Icon;
  match: NavMatch;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: Icon;
  items: NavItem[];
};

/**
 * An entry in the profile footer menu. `disabled` renders the row as a visible
 * but inert item, which is how a menu entry whose route does not exist yet is
 * represented — no placeholder page is ever created to satisfy the menu.
 */
export type SidebarMenuLink = {
  label: string;
  href: string;
  icon: Icon;
  disabled?: boolean;
};

/** Placeholder identity shown in the footer until a real profile read exists. */
export type SidebarProfile = {
  name: string;
  email: string;
};

/**
 * Everything that differs between the Admin and Student rails. The components
 * themselves are role-agnostic; only this object changes.
 */
export type DashboardNavConfig = {
  /** Public route alias root declared in `next.config.ts`, e.g. `/student`. */
  publicRoot: string;
  /** Internal file-route root the alias rewrites onto. */
  internalRoot: string;
  /** Heading beside the brand mark, and the collapsed brand tooltip. */
  brandTitle: string;
  /** `aria-label` for the `<nav>` landmark. */
  navLabel: string;
  /** Content heading when no nav item matches the current route. */
  fallbackTitle: string;
  /** localStorage key for the collapsed preference. Cosmetic boolean only. */
  storageKey: string;
  groups: NavGroup[];
  menuLinks: SidebarMenuLink[];
  profile: SidebarProfile;
};

function toKebabCase(segment: string): string {
  return segment.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Folds the internal file-route path onto the public alias.
 *
 * `next.config.ts` rewrites `/student/*` onto `/Dashboards/Student/*`, so a
 * prerendered page is generated for the internal path while the hydrated client
 * reads the public one. Comparing either form against the same canonical value
 * keeps active-state markup identical on both sides and avoids the hydration
 * mismatch documented for `usePathname` with rewrites.
 */
export function normalizePathname(
  config: DashboardNavConfig,
  pathname: string,
): string {
  if (pathname === config.internalRoot) {
    return config.publicRoot;
  }

  if (!pathname.startsWith(`${config.internalRoot}/`)) {
    return pathname;
  }

  const segments = pathname
    .slice(config.internalRoot.length)
    .split("/")
    .filter(Boolean)
    .map(toKebabCase);

  return [config.publicRoot, ...segments].join("/");
}

export function isNavItemActive(
  config: DashboardNavConfig,
  pathname: string,
  item: Pick<NavItem, "href" | "match">,
): boolean {
  const current = normalizePathname(config, pathname);

  if (item.match === "exact") {
    return current === item.href;
  }

  return current === item.href || current.startsWith(`${item.href}/`);
}

export function isNavGroupActive(
  config: DashboardNavConfig,
  pathname: string,
  group: NavGroup,
): boolean {
  return group.items.some((item) => isNavItemActive(config, pathname, item));
}

export function findActiveGroupId(
  config: DashboardNavConfig,
  pathname: string,
): string | null {
  return (
    config.groups.find((group) => isNavGroupActive(config, pathname, group))
      ?.id ?? null
  );
}

/**
 * Label of the deepest matching destination, used as the content-area heading.
 * Menu links are considered too, so routes reachable only from the profile menu
 * still get a real title instead of the fallback.
 */
export function getPageTitle(
  config: DashboardNavConfig,
  pathname: string,
): string {
  const destinations = [
    ...config.groups.flatMap((group) => group.items),
    ...config.menuLinks
      .filter((link) => !link.disabled)
      .map((link) => ({ ...link, match: "prefix" as const })),
  ];

  const matches = destinations
    .filter((item) => isNavItemActive(config, pathname, item))
    .sort((a, b) => b.href.length - a.href.length);

  return matches[0]?.label ?? config.fallbackTitle;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  const [first, last] = [parts[0], parts[parts.length - 1]];
  const initials =
    parts.length === 1 ? first.slice(0, 2) : `${first[0]}${last[0]}`;

  return initials.toUpperCase();
}

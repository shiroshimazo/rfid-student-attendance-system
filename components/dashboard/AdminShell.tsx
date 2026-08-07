"use client";

import { DashboardShell } from "./DashboardShell";
import { adminNavConfig } from "./sidebar/admin-navigation";

/**
 * Client entry point for the Admin dashboard.
 *
 * The config holds Iconsax component references, which are not serializable, so
 * it is imported inside the client boundary rather than passed down from the
 * server layout as a prop.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return <DashboardShell config={adminNavConfig}>{children}</DashboardShell>;
}

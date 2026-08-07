"use client";

import { DashboardShell } from "./DashboardShell";
import { studentNavConfig } from "./sidebar/student-navigation";

/**
 * Client entry point for the Student dashboard.
 *
 * The config holds Iconsax component references, which are not serializable, so
 * it is imported inside the client boundary rather than passed down from the
 * server layout as a prop.
 */
export function StudentShell({ children }: { children: React.ReactNode }) {
  return <DashboardShell config={studentNavConfig}>{children}</DashboardShell>;
}

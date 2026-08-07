"use client";

import { DashboardShell } from "./DashboardShell";
import { teacherNavConfig } from "./sidebar/teacher-navigation";

/**
 * Client entry point for the Teacher dashboard.
 *
 * The config holds Iconsax component references, which are not serializable, so
 * it is imported inside the client boundary rather than passed down from the
 * server layout as a prop.
 */
export function TeacherShell({ children }: { children: React.ReactNode }) {
  return <DashboardShell config={teacherNavConfig}>{children}</DashboardShell>;
}

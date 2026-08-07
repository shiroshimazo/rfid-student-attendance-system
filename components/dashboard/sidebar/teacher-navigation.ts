import {
  CalendarTick,
  Chart,
  Edit2,
  Element3,
  Notification,
  Profile2User,
  ProfileCircle,
  VolumeHigh,
} from "iconsax-reactjs";

import type { DashboardNavConfig } from "@/components/dashboard/sidebar/navigation";

/**
 * Teacher rail configuration.
 *
 * Every href below is a public route alias declared in `next.config.ts`, backed
 * by a page file under `app/Dashboards/Teacher`. No route is invented and no
 * page is created to satisfy a menu entry.
 *
 * TODO(supabase): replace `profile` with the authenticated teacher's record
 * once the profiles read is wired up. Nothing here may ever be persisted to
 * localStorage — no email, token, or session data leaves memory.
 */
export const teacherNavConfig: DashboardNavConfig = {
  publicRoot: "/teacher",
  internalRoot: "/Dashboards/Teacher",
  brandTitle: "Teacher Dashboard",
  navLabel: "Teacher",
  fallbackTitle: "Teacher",
  storageKey: "rfid-attendance:teacher-sidebar-collapsed",
  profile: {
    name: "Teacher Name",
    email: "teacher@example.com",
  },
  menuLinks: [
    // Both routes exist (`app/Dashboards/Teacher/Notifications`, `.../Profile`),
    // so neither needs the disabled fallback.
    {
      label: "Notifications",
      href: "/teacher/notifications",
      icon: Notification,
    },
    {
      label: "Profile / Settings",
      href: "/teacher/profile",
      icon: ProfileCircle,
    },
  ],
  groups: [
    {
      id: "overview",
      label: "Overview",
      icon: Element3,
      items: [
        {
          // `exact`, otherwise the section root would light up on every
          // `/teacher/...` page.
          label: "Dashboard",
          href: "/teacher",
          icon: Element3,
          match: "exact",
        },
      ],
    },
    {
      id: "classroom",
      label: "Classroom",
      icon: Profile2User,
      items: [
        {
          label: "My Students",
          href: "/teacher/my-students",
          icon: Profile2User,
          match: "prefix",
        },
        {
          label: "Attendance",
          href: "/teacher/attendance",
          icon: CalendarTick,
          match: "prefix",
        },
        {
          label: "Reports",
          href: "/teacher/reports",
          icon: Chart,
          match: "prefix",
        },
      ],
    },
    {
      id: "workflow",
      label: "Workflow",
      icon: Edit2,
      items: [
        {
          label: "Correction Requests",
          href: "/teacher/correction-requests",
          icon: Edit2,
          match: "prefix",
        },
        {
          label: "Announcements",
          href: "/teacher/announcements",
          icon: VolumeHigh,
          match: "prefix",
        },
      ],
    },
  ],
};

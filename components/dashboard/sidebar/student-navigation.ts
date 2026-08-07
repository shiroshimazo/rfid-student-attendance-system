import {
  CalendarTick,
  Edit2,
  Element3,
  MessageText,
  Notification,
  ProfileCircle,
  VolumeHigh,
} from "iconsax-reactjs";

import type { DashboardNavConfig } from "@/components/dashboard/sidebar/navigation";

/**
 * Student rail configuration.
 *
 * Every href below is a public route alias declared in `next.config.ts`, backed
 * by a page file under `app/Dashboards/Student`. No route is invented and no
 * page is created to satisfy a menu entry.
 *
 * TODO(supabase): replace `profile` with the authenticated student's record
 * once the profiles read is wired up. Nothing here may ever be persisted to
 * localStorage — no email, token, or session data leaves memory.
 */
export const studentNavConfig: DashboardNavConfig = {
  publicRoot: "/student",
  internalRoot: "/Dashboards/Student",
  brandTitle: "Student Dashboard",
  navLabel: "Student",
  fallbackTitle: "Student",
  storageKey: "rfid-attendance:student-sidebar-collapsed",
  profile: {
    name: "Student Name",
    email: "student@example.com",
  },
  menuLinks: [
    // Both routes exist (`app/Dashboards/Student/Notifications`, `.../Profile`),
    // so neither needs the disabled fallback.
    {
      label: "Notifications",
      href: "/student/notifications",
      icon: Notification,
    },
    {
      label: "Profile / Settings",
      href: "/student/profile",
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
          // `/student/...` page.
          label: "Dashboard",
          href: "/student",
          icon: Element3,
          match: "exact",
        },
      ],
    },
    {
      id: "records",
      label: "My Records",
      icon: CalendarTick,
      items: [
        {
          label: "Attendance",
          href: "/student/attendance",
          icon: CalendarTick,
          match: "prefix",
        },
        {
          label: "Correction Requests",
          href: "/student/correction-requests",
          icon: Edit2,
          match: "prefix",
        },
        {
          label: "SMS Status",
          href: "/student/sms-status",
          icon: MessageText,
          match: "prefix",
        },
      ],
    },
    {
      id: "school",
      label: "School",
      icon: VolumeHigh,
      items: [
        {
          label: "Announcements",
          href: "/student/announcements",
          icon: VolumeHigh,
          match: "prefix",
        },
      ],
    },
  ],
};

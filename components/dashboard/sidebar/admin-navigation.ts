import {
  Activity,
  CalendarTick,
  Card,
  Chart,
  ClipboardText,
  Cpu,
  DocumentText,
  Edit2,
  Element3,
  MessageText,
  MonitorMobbile,
  Notification,
  People,
  Profile2User,
  Setting2,
  UserOctagon,
  VolumeHigh,
} from "iconsax-reactjs";

import type { DashboardNavConfig } from "@/components/dashboard/sidebar/navigation";

/**
 * Admin rail configuration.
 *
 * Every href below is a public route alias declared in `next.config.ts`. No
 * route is invented here: an item exists only when the corresponding page file
 * exists under `app/Dashboards/Admin`. "Academic Setup" is deliberately absent
 * because the project has no such route yet.
 *
 * TODO(supabase): replace `profile` with the authenticated admin's record once
 * the profiles read is wired up. Nothing here may ever be persisted to
 * localStorage — no email, token, or session data leaves memory.
 */
export const adminNavConfig: DashboardNavConfig = {
  publicRoot: "/admin",
  internalRoot: "/Dashboards/Admin",
  brandTitle: "RFID Attendance",
  navLabel: "Admin",
  fallbackTitle: "Admin",
  storageKey: "rfid-attendance:admin-sidebar-collapsed",
  profile: {
    name: "Admin Name",
    email: "admin@example.com",
  },
  menuLinks: [
    { label: "Settings", href: "/admin/settings", icon: Setting2 },
    {
      label: "Notifications",
      href: "/admin/notifications",
      icon: Notification,
    },
  ],
  groups: [
    {
      id: "overview",
      label: "Overview",
      icon: Element3,
      items: [
        {
          label: "Dashboard",
          href: "/admin",
          icon: Element3,
          match: "exact",
        },
        {
          label: "Live Monitoring",
          href: "/admin/live-monitoring",
          icon: Activity,
          match: "prefix",
        },
      ],
    },
    {
      id: "attendance",
      label: "Attendance",
      icon: CalendarTick,
      items: [
        {
          label: "Attendance Records",
          href: "/admin/attendance",
          icon: ClipboardText,
          match: "prefix",
        },
        {
          label: "Correction Requests",
          href: "/admin/correction-requests",
          icon: Edit2,
          match: "prefix",
        },
        {
          label: "Reports",
          href: "/admin/reports",
          icon: Chart,
          match: "prefix",
        },
      ],
    },
    {
      id: "people",
      label: "People",
      icon: Profile2User,
      items: [
        {
          label: "Students",
          href: "/admin/students",
          icon: People,
          match: "prefix",
        },
        {
          label: "Users and Roles",
          href: "/admin/users",
          icon: UserOctagon,
          match: "prefix",
        },
      ],
    },
    {
      id: "hardware",
      label: "Hardware",
      icon: Cpu,
      items: [
        {
          label: "RFID Cards",
          href: "/admin/rfid-cards",
          icon: Card,
          match: "prefix",
        },
        {
          label: "Device Monitoring",
          href: "/admin/device-monitoring",
          icon: MonitorMobbile,
          match: "prefix",
        },
      ],
    },
    {
      id: "system",
      label: "System",
      icon: Setting2,
      items: [
        {
          label: "SMS Notifications",
          href: "/admin/sms-notifications",
          icon: MessageText,
          match: "prefix",
        },
        {
          label: "Announcements",
          href: "/admin/announcements",
          icon: VolumeHigh,
          match: "prefix",
        },
        {
          label: "Audit Logs",
          href: "/admin/audit-logs",
          icon: DocumentText,
          match: "prefix",
        },
        {
          label: "Settings",
          href: "/admin/settings",
          icon: Setting2,
          match: "prefix",
        },
      ],
    },
  ],
};

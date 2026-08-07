/**
 * Demo datasets for the Admin home dashboard.
 *
 * TODO: Replace with Supabase-backed dashboard data.
 *
 * Everything here is presentation-free: no icons, no class names, no JSX. The
 * dashboard components own that mapping, which keeps the shape of these arrays
 * close to what a real aggregate query would return and makes the eventual
 * swap a change of source rather than a rewrite of the cards.
 */

/** Category shared by the chart series, the legend and the status badges. */
export type AttendanceSeries = "in" | "out" | "none" | "invalid";

export type SummaryMetricId =
  | "total-students"
  | "in-today"
  | "out-today"
  | "sms-sent"
  | "sms-failed"
  | "active-cards";

export type SummaryMetric = {
  id: SummaryMetricId;
  label: string;
  value: number;
  /** Optional one-line context under the value. */
  hint: string;
};

export type AttendancePoint = {
  /** Axis category label, already formatted for display. */
  label: string;
  in: number;
  out: number;
};

export type AttendanceRange = "today" | "week" | "month";

export type AttendanceStatusSlice = {
  id: AttendanceSeries;
  label: string;
  value: number;
};

export type ScanStatus = "in" | "out" | "rejected" | "duplicate";
export type ScanResult = "success" | "invalid" | "unassigned";

export type RfidScan = {
  id: string;
  student: string;
  section: string;
  status: ScanStatus;
  /** Display time; a real row would carry a timestamp instead. */
  time: string;
  result: ScanResult;
};

export type AttentionItem = {
  id: string;
  label: string;
  count: number;
  /**
   * Public route alias from `next.config.ts`, or `null` when no route exists
   * yet — the row then renders inert instead of inventing a destination.
   */
  href: string | null;
};

export type SectionAttendance = {
  section: string;
  in: number;
  out: number;
  none: number;
};

export type DeviceStatus = "online" | "offline";

export type Device = {
  id: string;
  name: string;
  status: DeviceStatus;
  lastSeen: string;
  mode: string;
};

export const summaryMetrics: SummaryMetric[] = [
  {
    id: "total-students",
    label: "Total Students",
    value: 215,
    hint: "Across 5 active sections",
  },
  {
    id: "in-today",
    label: "Students IN Today",
    value: 173,
    hint: "80% of enrolled students",
  },
  {
    id: "out-today",
    label: "Students OUT Today",
    value: 61,
    hint: "Checked out so far",
  },
  {
    id: "sms-sent",
    label: "SMS Sent Today",
    value: 168,
    hint: "Guardian notifications",
  },
  {
    id: "sms-failed",
    label: "Failed SMS",
    value: 4,
    hint: "Needs a retry",
  },
  {
    id: "active-cards",
    label: "Active RFID Cards",
    value: 202,
    hint: "13 unassigned",
  },
];

/**
 * Half-hour buckets from the 7:00 AM arrival window through afternoon dismissal.
 * IN front-loads before class, OUT spikes at lunch and again at dismissal.
 */
const todayAttendance: AttendancePoint[] = [
  { label: "7:00 AM", in: 12, out: 0 },
  { label: "7:30 AM", in: 31, out: 2 },
  { label: "8:00 AM", in: 44, out: 1 },
  { label: "8:30 AM", in: 38, out: 3 },
  { label: "9:00 AM", in: 22, out: 2 },
  { label: "9:30 AM", in: 9, out: 4 },
  { label: "10:00 AM", in: 6, out: 3 },
  { label: "10:30 AM", in: 4, out: 5 },
  { label: "11:00 AM", in: 3, out: 8 },
  { label: "11:30 AM", in: 2, out: 14 },
  { label: "12:00 PM", in: 1, out: 6 },
  { label: "12:30 PM", in: 1, out: 2 },
  { label: "1:00 PM", in: 0, out: 1 },
  { label: "1:30 PM", in: 0, out: 1 },
  { label: "2:00 PM", in: 0, out: 2 },
  { label: "2:30 PM", in: 0, out: 3 },
  { label: "3:00 PM", in: 0, out: 6 },
  { label: "3:30 PM", in: 0, out: 11 },
  { label: "4:00 PM", in: 0, out: 19 },
  { label: "4:30 PM", in: 0, out: 9 },
];

const weekAttendance: AttendancePoint[] = [
  { label: "Monday", in: 198, out: 191 },
  { label: "Tuesday", in: 204, out: 199 },
  { label: "Wednesday", in: 187, out: 184 },
  { label: "Thursday", in: 209, out: 203 },
  { label: "Friday", in: 173, out: 61 },
];

/** Full month kept intact; the axis thins its own ticks rather than the data. */
const monthAttendance: AttendancePoint[] = [
  { label: "Aug 1", in: 196, out: 193 },
  { label: "Aug 2", in: 188, out: 185 },
  { label: "Aug 3", in: 0, out: 0 },
  { label: "Aug 4", in: 0, out: 0 },
  { label: "Aug 5", in: 201, out: 197 },
  { label: "Aug 6", in: 207, out: 204 },
  { label: "Aug 7", in: 173, out: 61 },
  { label: "Aug 8", in: 199, out: 195 },
  { label: "Aug 9", in: 192, out: 190 },
  { label: "Aug 10", in: 0, out: 0 },
  { label: "Aug 11", in: 0, out: 0 },
  { label: "Aug 12", in: 205, out: 201 },
  { label: "Aug 13", in: 198, out: 196 },
  { label: "Aug 14", in: 211, out: 206 },
  { label: "Aug 15", in: 194, out: 191 },
  { label: "Aug 16", in: 186, out: 183 },
  { label: "Aug 17", in: 0, out: 0 },
  { label: "Aug 18", in: 0, out: 0 },
  { label: "Aug 19", in: 203, out: 200 },
  { label: "Aug 20", in: 208, out: 205 },
  { label: "Aug 21", in: 197, out: 194 },
  { label: "Aug 22", in: 189, out: 187 },
  { label: "Aug 23", in: 182, out: 179 },
  { label: "Aug 24", in: 0, out: 0 },
  { label: "Aug 25", in: 0, out: 0 },
  { label: "Aug 26", in: 206, out: 202 },
  { label: "Aug 27", in: 212, out: 208 },
  { label: "Aug 28", in: 200, out: 198 },
  { label: "Aug 29", in: 193, out: 190 },
  { label: "Aug 30", in: 0, out: 0 },
];

export const attendanceRanges: {
  id: AttendanceRange;
  label: string;
  description: string;
}[] = [
  { id: "today", label: "Today", description: "IN and OUT activity by half hour" },
  { id: "week", label: "This Week", description: "IN and OUT totals per weekday" },
  { id: "month", label: "This Month", description: "IN and OUT totals per day" },
];

export const attendanceByRange: Record<AttendanceRange, AttendancePoint[]> = {
  today: todayAttendance,
  week: weekAttendance,
  month: monthAttendance,
};

export const attendanceStatus: AttendanceStatusSlice[] = [
  { id: "in", label: "Present / Checked IN", value: 112 },
  { id: "out", label: "Checked OUT", value: 61 },
  { id: "none", label: "No Attendance Record Yet", value: 42 },
  { id: "invalid", label: "Invalid / Rejected Scans", value: 7 },
];

/** Newest first, the order a real `order by scanned_at desc` would return. */
export const recentRfidScans: RfidScan[] = [
  { id: "scan-01", student: "Juan Dela Cruz", section: "BSIT-1A", status: "in", time: "7:42 AM", result: "success" },
  { id: "scan-02", student: "Maria Santos", section: "BSIT-2A", status: "out", time: "4:15 PM", result: "success" },
  { id: "scan-03", student: "Ari Reyes", section: "BSIT-3A", status: "in", time: "8:02 AM", result: "success" },
  { id: "scan-04", student: "Carlo Cruz", section: "BSIT-4A", status: "rejected", time: "8:08 AM", result: "invalid" },
  { id: "scan-05", student: "Bea Villanueva", section: "BSIT-4B", status: "in", time: "7:55 AM", result: "success" },
  { id: "scan-06", student: "Nico Ramos", section: "BSIT-1A", status: "duplicate", time: "7:56 AM", result: "success" },
  { id: "scan-07", student: "Liza Domingo", section: "BSIT-2A", status: "out", time: "3:48 PM", result: "success" },
  { id: "scan-08", student: "Paolo Mendoza", section: "BSIT-3A", status: "in", time: "7:38 AM", result: "success" },
  { id: "scan-09", student: "Grace Aquino", section: "BSIT-4B", status: "rejected", time: "8:21 AM", result: "unassigned" },
  { id: "scan-10", student: "Miguel Torres", section: "BSIT-1A", status: "out", time: "4:02 PM", result: "success" },
  { id: "scan-11", student: "Karla Bautista", section: "BSIT-4A", status: "in", time: "8:14 AM", result: "success" },
  { id: "scan-12", student: "Diego Navarro", section: "BSIT-2A", status: "duplicate", time: "8:16 AM", result: "success" },
  { id: "scan-13", student: "Ella Gutierrez", section: "BSIT-3A", status: "out", time: "3:31 PM", result: "success" },
  { id: "scan-14", student: "Rafael Lim", section: "BSIT-4B", status: "rejected", time: "8:44 AM", result: "invalid" },
];

export const attentionItems: AttentionItem[] = [
  {
    id: "correction-requests",
    label: "Pending Correction Requests",
    count: 3,
    href: "/admin/correction-requests",
  },
  {
    id: "failed-sms",
    label: "Failed SMS Notifications",
    count: 4,
    href: "/admin/sms-notifications",
  },
  {
    id: "unassigned-cards",
    label: "Unassigned RFID Cards",
    count: 6,
    href: "/admin/rfid-cards",
  },
  {
    id: "rejected-scans",
    label: "Rejected / Invalid RFID Scans",
    count: 7,
    href: "/admin/attendance",
  },
  {
    id: "offline-devices",
    label: "Offline RFID Devices",
    count: 1,
    href: "/admin/device-monitoring",
  },
];

export const sectionAttendance: SectionAttendance[] = [
  { section: "BSIT-1A", in: 32, out: 4, none: 8 },
  { section: "BSIT-2A", in: 29, out: 7, none: 6 },
  { section: "BSIT-3A", in: 35, out: 3, none: 4 },
  { section: "BSIT-4A", in: 28, out: 8, none: 5 },
  { section: "BSIT-4B", in: 31, out: 6, none: 5 },
];

export const devices: Device[] = [
  {
    id: "device-main-gate",
    name: "Main Gate Reader",
    status: "online",
    lastSeen: "Just now",
    mode: "AUTO",
  },
  {
    id: "device-building-a",
    name: "Building A Reader",
    status: "online",
    lastSeen: "2 minutes ago",
    mode: "AUTO",
  },
  {
    id: "device-building-b",
    name: "Building B Reader",
    status: "offline",
    lastSeen: "1 hour ago",
    mode: "MANUAL",
  },
];

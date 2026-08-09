/**
 * Demo datasets for the Admin Live Monitoring page.
 *
 * TODO: Replace with Supabase Realtime data.
 *
 * Same rule as the home dashboard set: no icons, no class names, no JSX. The
 * cards own that mapping, so these arrays keep the shape a real
 * `order by scanned_at desc` read would return and the eventual swap is a change
 * of source rather than a rewrite of the UI.
 */

import { devices } from "@/lib/mock-data/admin-dashboard";

/** Direction the reader resolved, or a refusal. Drives the feed filters. */
export type LiveScanStatus = "in" | "out" | "rejected";

/** Why the scan ended the way it did — one row of the feed's Result column. */
export type LiveScanResult =
  | "success"
  | "duplicate"
  | "unassigned"
  | "invalid"
  | "out-without-in"
  | "sms-failed";

/** What the attendance write did with the scan. */
export type AttendanceOutcome = "recorded" | "duplicate-ignored" | "not-recorded";

/** Where the guardian notification for the scan got to. */
export type SmsOutcome = "queued" | "sent" | "failed" | "not-sent";

export type LiveScanEvent = {
  id: string;
  /** Display time; a real row would carry a timestamp instead. */
  time: string;
  /** "Unknown Card" for a tap that resolved to no student. */
  student: string;
  /** Em dash when the card maps to no section. */
  section: string;
  status: LiveScanStatus;
  /** Card UID as the reader reports it. */
  rfid: string;
  result: LiveScanResult;
  /** Reader that produced the scan. */
  device: string;
  attendance: AttendanceOutcome;
  sms: SmsOutcome;
};

/**
 * A scan waiting to be simulated into the feed. The board stamps `id` and
 * `time` at arrival so the feed's clock matches the header's.
 */
export type LiveScanTemplate = Omit<LiveScanEvent, "id" | "time">;

export type LiveMetricId =
  | "in-today"
  | "out-today"
  | "inside-now"
  | "successful-scans"
  | "rejected-scans"
  | "failed-sms";

export type LiveMetric = {
  id: LiveMetricId;
  label: string;
  value: number;
  /** One line of context under the value, so no two metrics read alike. */
  hint: string;
};

export type LiveAlertId =
  | "unassigned-rfid"
  | "duplicate-tap"
  | "sms-failed"
  | "out-without-in"
  | "invalid-rfid"
  | "offline-device";

export type LiveAlert = {
  id: LiveAlertId;
  label: string;
  count: number;
};

/**
 * `IN Today` and `Inside Now` are deliberately different numbers: the first is
 * today's historical IN activity, the second is how many students are currently
 * in the IN state. They are never interchangeable.
 */
export const liveMetrics: LiveMetric[] = [
  {
    id: "in-today",
    label: "IN Today",
    value: 173,
    hint: "At least one valid IN today",
  },
  {
    id: "out-today",
    label: "OUT Today",
    value: 61,
    hint: "Recorded a valid OUT today",
  },
  {
    id: "inside-now",
    label: "Inside Now",
    value: 112,
    hint: "Latest valid state is IN",
  },
  {
    id: "successful-scans",
    label: "Successful Scans",
    value: 234,
    hint: "Processed without error",
  },
  {
    id: "rejected-scans",
    label: "Rejected Scans",
    value: 7,
    hint: "Invalid or unassigned cards",
  },
  {
    id: "failed-sms",
    label: "Failed SMS",
    value: 4,
    hint: "Guardian notifications to retry",
  },
];

/**
 * Counts track what the seeded feed below actually contains, so an operator can
 * reconcile an alert against the rows rather than reading two versions of the
 * same morning. `offline-device` comes from the shared device set.
 */
export const liveAlerts: LiveAlert[] = [
  { id: "unassigned-rfid", label: "Unassigned RFID", count: 2 },
  { id: "duplicate-tap", label: "Duplicate Tap", count: 2 },
  { id: "sms-failed", label: "SMS Failed", count: 2 },
  { id: "out-without-in", label: "OUT Without IN", count: 1 },
  { id: "invalid-rfid", label: "Invalid RFID", count: 1 },
  { id: "offline-device", label: "Offline Device", count: 1 },
];

/**
 * The readers are the same hardware the home dashboard reports on, so the set is
 * re-exported rather than copied — one reader cannot be online on one page and
 * offline on another.
 */
export { devices };

/**
 * Seeded feed, newest first. Sized and mixed so every interaction on the page
 * has something to act on: four pages at five rows each, every filter
 * non-empty, and one row for each alert category.
 */
export const initialScanEvents: LiveScanEvent[] = [
  { id: "live-01", time: "08:31:07 AM", student: "Juan Dela Cruz", section: "BSIT-3A", status: "in", rfid: "04:A2:91:FF", result: "success", device: "Main Gate Reader", attendance: "recorded", sms: "queued" },
  { id: "live-02", time: "08:30:22 AM", student: "Maria Santos", section: "BSIT-2A", status: "out", rfid: "04:B1:77:2C", result: "success", device: "Main Gate Reader", attendance: "recorded", sms: "sent" },
  { id: "live-03", time: "08:29:44 AM", student: "Unknown Card", section: "—", status: "rejected", rfid: "91:AB:22:FF", result: "unassigned", device: "Main Gate Reader", attendance: "not-recorded", sms: "not-sent" },
  { id: "live-04", time: "08:28:59 AM", student: "Ari Reyes", section: "BSIT-3A", status: "in", rfid: "04:C3:18:9A", result: "success", device: "Building A Reader", attendance: "recorded", sms: "sent" },
  { id: "live-05", time: "08:28:03 AM", student: "Nico Ramos", section: "BSIT-1A", status: "in", rfid: "04:D4:52:1B", result: "duplicate", device: "Main Gate Reader", attendance: "duplicate-ignored", sms: "not-sent" },
  { id: "live-06", time: "08:27:31 AM", student: "Bea Villanueva", section: "BSIT-4B", status: "in", rfid: "04:E5:63:7D", result: "success", device: "Building A Reader", attendance: "recorded", sms: "queued" },
  { id: "live-07", time: "08:26:48 AM", student: "Carlo Cruz", section: "BSIT-4A", status: "in", rfid: "04:F6:74:8E", result: "sms-failed", device: "Main Gate Reader", attendance: "recorded", sms: "failed" },
  { id: "live-08", time: "08:26:12 AM", student: "Liza Domingo", section: "BSIT-2A", status: "out", rfid: "04:07:85:9F", result: "success", device: "Building B Reader", attendance: "recorded", sms: "sent" },
  { id: "live-09", time: "08:25:37 AM", student: "Grace Aquino", section: "BSIT-4B", status: "out", rfid: "04:18:96:A0", result: "out-without-in", device: "Main Gate Reader", attendance: "not-recorded", sms: "not-sent" },
  { id: "live-10", time: "08:24:31 AM", student: "Paolo Mendoza", section: "BSIT-3A", status: "in", rfid: "04:29:A7:B1", result: "success", device: "Main Gate Reader", attendance: "recorded", sms: "sent" },
  { id: "live-11", time: "08:23:55 AM", student: "Unknown Card", section: "—", status: "rejected", rfid: "7C:44:10:D2", result: "unassigned", device: "Building A Reader", attendance: "not-recorded", sms: "not-sent" },
  { id: "live-12", time: "08:23:18 AM", student: "Karla Bautista", section: "BSIT-4A", status: "in", rfid: "04:3A:B8:C2", result: "success", device: "Main Gate Reader", attendance: "recorded", sms: "queued" },
  { id: "live-13", time: "08:22:40 AM", student: "Diego Navarro", section: "BSIT-2A", status: "in", rfid: "04:4B:C9:D3", result: "duplicate", device: "Building A Reader", attendance: "duplicate-ignored", sms: "not-sent" },
  { id: "live-14", time: "08:22:18 AM", student: "Unknown Card", section: "—", status: "rejected", rfid: "3F:9C:04:E1", result: "invalid", device: "Main Gate Reader", attendance: "not-recorded", sms: "not-sent" },
  { id: "live-15", time: "08:21:36 AM", student: "Ella Gutierrez", section: "BSIT-3A", status: "out", rfid: "04:5C:DA:E4", result: "success", device: "Building B Reader", attendance: "recorded", sms: "sent" },
  { id: "live-16", time: "08:20:52 AM", student: "Rafael Lim", section: "BSIT-4B", status: "in", rfid: "04:6D:EB:F5", result: "sms-failed", device: "Main Gate Reader", attendance: "recorded", sms: "failed" },
  { id: "live-17", time: "08:20:09 AM", student: "Miguel Torres", section: "BSIT-1A", status: "out", rfid: "04:7E:FC:06", result: "success", device: "Main Gate Reader", attendance: "recorded", sms: "sent" },
  { id: "live-18", time: "08:19:24 AM", student: "Sofia Ramirez", section: "BSIT-1A", status: "in", rfid: "04:8F:0D:17", result: "success", device: "Building A Reader", attendance: "recorded", sms: "sent" },
];

/**
 * Cycled by the board to fake arrivals while the feed is running. Ordered so a
 * watcher sees a success, then a rejection, then a duplicate rather than a run
 * of identical rows.
 */
export const simulatedScanTemplates: LiveScanTemplate[] = [
  { student: "Andres Bonifacio", section: "BSIT-2A", status: "in", rfid: "04:9A:1E:28", result: "success", device: "Main Gate Reader", attendance: "recorded", sms: "queued" },
  { student: "Unknown Card", section: "—", status: "rejected", rfid: "5D:33:AF:90", result: "unassigned", device: "Main Gate Reader", attendance: "not-recorded", sms: "not-sent" },
  { student: "Rosa Alvarez", section: "BSIT-4A", status: "out", rfid: "04:AB:2F:39", result: "success", device: "Building A Reader", attendance: "recorded", sms: "sent" },
  { student: "Teodoro Cruz", section: "BSIT-1A", status: "in", rfid: "04:BC:30:4A", result: "duplicate", device: "Main Gate Reader", attendance: "duplicate-ignored", sms: "not-sent" },
  { student: "Ligaya Fernandez", section: "BSIT-3A", status: "in", rfid: "04:CD:41:5B", result: "sms-failed", device: "Building B Reader", attendance: "recorded", sms: "failed" },
  { student: "Emilio Aguilar", section: "BSIT-4B", status: "out", rfid: "04:DE:52:6C", result: "success", device: "Main Gate Reader", attendance: "recorded", sms: "sent" },
];


/**
 * Demo dataset for the Admin Attendance Records page.
 *
 * TODO: Replace mock data with Supabase attendance records.
 *
 * Same rule as the other dashboard sets: no icons, no class names, no JSX. The
 * rows carry the shape a real `attendance join students` read would return —
 * flat, already joined — so the eventual swap is a change of source rather than
 * a rewrite of the table. Dates stay ISO here; the wording and the display
 * format live beside the components that render them.
 */

/** Attendance state of a whole day for one student. */
export type AttendanceStatus =
  | "present"
  | "absent"
  | "incomplete"
  | "correction-requested";

/**
 * The RFID event, which is not the same thing as the status: a record can hold
 * an IN with no OUT, and the day still resolves to `incomplete` rather than to
 * an activity of its own.
 */
export type AttendanceActivity = "in" | "out";

export type AttendanceRecord = {
  id: string;
  /** ISO date; formatted for display by the table and the drawer. */
  date: string;
  student: string;
  /** School-issued student number, shown in its own column. */
  studentId: string;
  section: string;
  /** Card UID as the reader reports it. Drawer only, never a table column. */
  rfid: string;
  /** Display time, or `null` when the event never happened. */
  timeIn: string | null;
  timeOut: string | null;
  /** Reader that produced the IN / OUT, `null` alongside a missing time. */
  inDevice: string | null;
  outDevice: string | null;
  status: AttendanceStatus;
  /** Wording of the pending request, `null` when nothing was filed. */
  correctionNote: string | null;
};

/** The project's five BSIT sections, in the order the filters list them. */
export const attendanceSections = [
  "BSIT-1A",
  "BSIT-2A",
  "BSIT-3A",
  "BSIT-4A",
  "BSIT-4B",
] as const;

/**
 * Newest first, the order a real `order by attendance_date desc` would return.
 * Mixed so every control on the page has something to act on: all five
 * sections, five dates, all four statuses, rows with both events, rows with a
 * missing OUT, and rows with no events at all.
 */
export const attendanceRecords: AttendanceRecord[] = [
  { id: "att-001", date: "2026-08-11", student: "Juan Dela Cruz", studentId: "2024-00123", section: "BSIT-3A", rfid: "04:A2:91:FF", timeIn: "07:42 AM", timeOut: "04:18 PM", inDevice: "Main Gate Reader", outDevice: "Main Gate Reader", status: "present", correctionNote: null },
  { id: "att-002", date: "2026-08-11", student: "Maria Santos", studentId: "2024-00087", section: "BSIT-2A", rfid: "04:B1:77:2C", timeIn: "07:55 AM", timeOut: "04:05 PM", inDevice: "Main Gate Reader", outDevice: "Building B Reader", status: "present", correctionNote: null },
  { id: "att-003", date: "2026-08-11", student: "Nico Ramos", studentId: "2025-00061", section: "BSIT-1A", rfid: "04:D4:52:1B", timeIn: "08:12 AM", timeOut: null, inDevice: "Main Gate Reader", outDevice: null, status: "incomplete", correctionNote: null },
  { id: "att-004", date: "2026-08-11", student: "Carlo Cruz", studentId: "2023-00019", section: "BSIT-4A", rfid: "04:F6:74:8E", timeIn: null, timeOut: null, inDevice: null, outDevice: null, status: "absent", correctionNote: null },
  { id: "att-005", date: "2026-08-11", student: "Bea Villanueva", studentId: "2023-00042", section: "BSIT-4B", rfid: "04:E5:63:7D", timeIn: "07:38 AM", timeOut: null, inDevice: "Building A Reader", outDevice: null, status: "correction-requested", correctionNote: "Tapped OUT at 4:20 PM but the reader did not record it." },
  { id: "att-006", date: "2026-08-10", student: "Ari Reyes", studentId: "2024-00145", section: "BSIT-3A", rfid: "04:C3:18:9A", timeIn: "07:49 AM", timeOut: "04:22 PM", inDevice: "Building A Reader", outDevice: "Main Gate Reader", status: "present", correctionNote: null },
  { id: "att-007", date: "2026-08-10", student: "Liza Domingo", studentId: "2024-00098", section: "BSIT-2A", rfid: "04:07:85:9F", timeIn: "08:02 AM", timeOut: "03:48 PM", inDevice: "Main Gate Reader", outDevice: "Building B Reader", status: "present", correctionNote: null },
  { id: "att-008", date: "2026-08-10", student: "Miguel Torres", studentId: "2025-00074", section: "BSIT-1A", rfid: "04:7E:FC:06", timeIn: "07:31 AM", timeOut: "04:02 PM", inDevice: "Main Gate Reader", outDevice: "Main Gate Reader", status: "present", correctionNote: null },
  { id: "att-009", date: "2026-08-10", student: "Grace Aquino", studentId: "2023-00033", section: "BSIT-4B", rfid: "04:18:96:A0", timeIn: null, timeOut: null, inDevice: null, outDevice: null, status: "absent", correctionNote: null },
  { id: "att-010", date: "2026-08-10", student: "Karla Bautista", studentId: "2023-00027", section: "BSIT-4A", rfid: "04:3A:B8:C2", timeIn: "08:14 AM", timeOut: null, inDevice: "Main Gate Reader", outDevice: null, status: "incomplete", correctionNote: null },
  { id: "att-011", date: "2026-08-07", student: "Sofia Ramirez", studentId: "2025-00058", section: "BSIT-1A", rfid: "04:8F:0D:17", timeIn: "07:27 AM", timeOut: "04:11 PM", inDevice: "Main Gate Reader", outDevice: "Main Gate Reader", status: "present", correctionNote: null },
  { id: "att-012", date: "2026-08-07", student: "Diego Navarro", studentId: "2024-00104", section: "BSIT-2A", rfid: "04:4B:C9:D3", timeIn: "07:58 AM", timeOut: "04:15 PM", inDevice: "Building B Reader", outDevice: "Building B Reader", status: "present", correctionNote: null },
  { id: "att-013", date: "2026-08-07", student: "Paolo Mendoza", studentId: "2024-00131", section: "BSIT-3A", rfid: "04:29:A7:B1", timeIn: "08:05 AM", timeOut: null, inDevice: "Building A Reader", outDevice: null, status: "correction-requested", correctionNote: "Left through the side exit; asks for the OUT to be logged at 3:55 PM." },
  { id: "att-014", date: "2026-08-07", student: "Rafael Lim", studentId: "2023-00048", section: "BSIT-4B", rfid: "04:6D:EB:F5", timeIn: "07:44 AM", timeOut: "04:29 PM", inDevice: "Main Gate Reader", outDevice: "Building A Reader", status: "present", correctionNote: null },
  { id: "att-015", date: "2026-08-07", student: "Karla Bautista", studentId: "2023-00027", section: "BSIT-4A", rfid: "04:3A:B8:C2", timeIn: "07:52 AM", timeOut: "04:07 PM", inDevice: "Main Gate Reader", outDevice: "Main Gate Reader", status: "present", correctionNote: null },
  { id: "att-016", date: "2026-08-06", student: "Juan Dela Cruz", studentId: "2024-00123", section: "BSIT-3A", rfid: "04:A2:91:FF", timeIn: "07:40 AM", timeOut: "04:20 PM", inDevice: "Main Gate Reader", outDevice: "Main Gate Reader", status: "present", correctionNote: null },
  { id: "att-017", date: "2026-08-06", student: "Ella Gutierrez", studentId: "2024-00139", section: "BSIT-3A", rfid: "04:5C:DA:E4", timeIn: null, timeOut: null, inDevice: null, outDevice: null, status: "absent", correctionNote: null },
  { id: "att-018", date: "2026-08-06", student: "Maria Santos", studentId: "2024-00087", section: "BSIT-2A", rfid: "04:B1:77:2C", timeIn: "07:47 AM", timeOut: "04:01 PM", inDevice: "Main Gate Reader", outDevice: "Main Gate Reader", status: "present", correctionNote: null },
  { id: "att-019", date: "2026-08-06", student: "Nico Ramos", studentId: "2025-00061", section: "BSIT-1A", rfid: "04:D4:52:1B", timeIn: "08:21 AM", timeOut: "03:59 PM", inDevice: "Building B Reader", outDevice: "Main Gate Reader", status: "present", correctionNote: null },
  { id: "att-020", date: "2026-08-06", student: "Grace Aquino", studentId: "2023-00033", section: "BSIT-4B", rfid: "04:18:96:A0", timeIn: "07:36 AM", timeOut: null, inDevice: "Main Gate Reader", outDevice: null, status: "incomplete", correctionNote: null },
  { id: "att-021", date: "2026-08-05", student: "Carlo Cruz", studentId: "2023-00019", section: "BSIT-4A", rfid: "04:F6:74:8E", timeIn: "07:59 AM", timeOut: "04:24 PM", inDevice: "Building A Reader", outDevice: "Building A Reader", status: "present", correctionNote: null },
  { id: "att-022", date: "2026-08-05", student: "Ari Reyes", studentId: "2024-00145", section: "BSIT-3A", rfid: "04:C3:18:9A", timeIn: null, timeOut: null, inDevice: null, outDevice: null, status: "absent", correctionNote: null },
  { id: "att-023", date: "2026-08-05", student: "Miguel Torres", studentId: "2025-00074", section: "BSIT-1A", rfid: "04:7E:FC:06", timeIn: "07:33 AM", timeOut: "04:09 PM", inDevice: "Main Gate Reader", outDevice: "Building B Reader", status: "present", correctionNote: null },
  { id: "att-024", date: "2026-08-05", student: "Rafael Lim", studentId: "2023-00048", section: "BSIT-4B", rfid: "04:6D:EB:F5", timeIn: "08:08 AM", timeOut: null, inDevice: "Main Gate Reader", outDevice: null, status: "correction-requested", correctionNote: "Reader missed the morning tap; asks for the IN to be moved to 7:45 AM." },
  { id: "att-025", date: "2026-08-05", student: "Liza Domingo", studentId: "2024-00098", section: "BSIT-2A", rfid: "04:07:85:9F", timeIn: "07:51 AM", timeOut: "04:13 PM", inDevice: "Main Gate Reader", outDevice: "Main Gate Reader", status: "present", correctionNote: null },
];

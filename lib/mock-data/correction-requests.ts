/**
 * Demo dataset for the Admin Correction Requests page.
 *
 * TODO: Replace mock data with Supabase correction requests.
 *
 * Same rule as the other dashboard sets: no icons, no class names, no JSX. The
 * rows carry the shape a real `correction_requests join students` read would
 * return — flat, already joined — so the eventual swap is a change of source
 * rather than a rewrite of the page. Attendance dates stay ISO; the wording and
 * the display format live beside the components that render them.
 *
 * Approving and rejecting are frontend state only. Nothing here is written back,
 * no notification is sent, and no attendance record is edited.
 */

/** Where a request sits in the review queue. */
export type CorrectionStatus = "pending" | "approved" | "rejected";

/** What the student is asking to have fixed. */
export type CorrectionType =
  | "missing-in"
  | "missing-out"
  | "wrong-time"
  | "marked-absent"
  | "duplicate-scan";

export type CorrectionRequest = {
  id: string;
  student: string;
  /** School-issued student number, shown beside the name in the drawers. */
  studentId: string;
  section: string;
  /** ISO attendance date the request is about, not the date it was filed. */
  date: string;
  type: CorrectionType;
  status: CorrectionStatus;
  /** Display time as the reader recorded it, or `null` when it never happened. */
  originalTimeIn: string | null;
  originalTimeOut: string | null;
  /** Display time the student is asking for. */
  requestedTimeIn: string | null;
  requestedTimeOut: string | null;
  /** The student's own explanation, shown verbatim in every view. */
  reason: string;
  /** Already formatted for display; the filed-at stamp, not the attendance date. */
  submittedAt: string;
  /** Administrator who closed the request; `null` while it is still pending. */
  reviewedBy: string | null;
  reviewedAt: string | null;
  /** Required on a rejection, `null` on anything else. */
  rejectionReason: string | null;
};

/** The kinds of event the activity feed reports. */
export type RequestActivityKind = "submitted" | "approved" | "rejected";

export type RequestActivityEvent = {
  id: string;
  kind: RequestActivityKind;
  /** Whose request the event is about, so a row reads without opening it. */
  student: string;
  /**
   * Age in whole minutes rather than a timestamp. A clock read during render
   * would disagree between the server pass and the browser, and the feed only
   * ever shows a relative label.
   */
  minutesAgo: number;
};

/** The project's five BSIT sections, in the order the filters list them. */
export const correctionSections = [
  "BSIT-1A",
  "BSIT-2A",
  "BSIT-3A",
  "BSIT-4A",
  "BSIT-4B",
] as const;

/**
 * Fifteen requests: six pending, six approved, three rejected, spread over all
 * five sections, five attendance dates and every correction type. Enough for
 * three pages at five rows, and enough that search, both filters and the sort
 * each have something to act on.
 */
export const correctionRequests: CorrectionRequest[] = [
  {
    id: "cr-001",
    student: "Juan Dela Cruz",
    studentId: "2024-00123",
    section: "BSIT-2A",
    date: "2026-08-11",
    type: "missing-out",
    status: "pending",
    originalTimeIn: "07:32 AM",
    originalTimeOut: null,
    requestedTimeIn: "07:32 AM",
    requestedTimeOut: "05:31 PM",
    reason: "Forgot to tap out before leaving campus.",
    submittedAt: "Aug 11, 2026 · 6:04 PM",
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
  },
  {
    id: "cr-002",
    student: "Maria Santos",
    studentId: "2024-00087",
    section: "BSIT-2A",
    date: "2026-08-11",
    type: "wrong-time",
    status: "pending",
    originalTimeIn: "08:41 AM",
    originalTimeOut: "04:05 PM",
    requestedTimeIn: "07:41 AM",
    requestedTimeOut: "04:05 PM",
    reason:
      "The reader logged my morning tap an hour late. I was already in the room at 7:41 AM.",
    submittedAt: "Aug 11, 2026 · 5:12 PM",
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
  },
  {
    id: "cr-003",
    student: "Nico Ramos",
    studentId: "2025-00061",
    section: "BSIT-1A",
    date: "2026-08-11",
    type: "missing-in",
    status: "pending",
    originalTimeIn: null,
    originalTimeOut: "04:22 PM",
    requestedTimeIn: "07:58 AM",
    requestedTimeOut: "04:22 PM",
    reason: "Entered through the side gate while the reader there was offline.",
    submittedAt: "Aug 11, 2026 · 4:48 PM",
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
  },
  {
    id: "cr-004",
    student: "Carlo Cruz",
    studentId: "2023-00019",
    section: "BSIT-4A",
    date: "2026-08-10",
    type: "marked-absent",
    status: "pending",
    originalTimeIn: null,
    originalTimeOut: null,
    requestedTimeIn: "07:20 AM",
    requestedTimeOut: "04:10 PM",
    reason:
      "I attended the whole day but my card would not scan on either reader.",
    submittedAt: "Aug 10, 2026 · 7:31 PM",
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
  },
  {
    id: "cr-005",
    student: "Bea Villanueva",
    studentId: "2023-00042",
    section: "BSIT-4B",
    date: "2026-08-10",
    type: "missing-out",
    status: "pending",
    originalTimeIn: "07:38 AM",
    originalTimeOut: null,
    requestedTimeIn: "07:38 AM",
    requestedTimeOut: "04:20 PM",
    reason: "Tapped OUT at 4:20 PM but the reader did not record it.",
    submittedAt: "Aug 10, 2026 · 6:02 PM",
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
  },
  {
    id: "cr-006",
    student: "Paolo Mendoza",
    studentId: "2024-00155",
    section: "BSIT-3A",
    date: "2026-08-07",
    type: "duplicate-scan",
    status: "pending",
    originalTimeIn: "07:35 AM",
    originalTimeOut: "07:36 AM",
    requestedTimeIn: "07:35 AM",
    requestedTimeOut: "04:02 PM",
    reason:
      "My second tap was read as an OUT one minute after I came in, so the day closed early.",
    submittedAt: "Aug 7, 2026 · 5:44 PM",
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
  },
  {
    id: "cr-007",
    student: "Liza Domingo",
    studentId: "2024-00098",
    section: "BSIT-2A",
    date: "2026-08-08",
    type: "missing-out",
    status: "approved",
    originalTimeIn: "07:49 AM",
    originalTimeOut: null,
    requestedTimeIn: "07:49 AM",
    requestedTimeOut: "04:11 PM",
    reason: "Left with the class at 4:11 PM but the reader was already off.",
    submittedAt: "Aug 8, 2026 · 5:26 PM",
    reviewedBy: "Admin Salazar",
    reviewedAt: "Aug 9, 2026 · 8:20 AM",
    rejectionReason: null,
  },
  {
    id: "cr-008",
    student: "Miguel Torres",
    studentId: "2025-00033",
    section: "BSIT-1A",
    date: "2026-08-07",
    type: "wrong-time",
    status: "approved",
    originalTimeIn: "09:14 AM",
    originalTimeOut: "04:02 PM",
    requestedTimeIn: "07:44 AM",
    requestedTimeOut: "04:02 PM",
    reason:
      "The gate reader was restarted that morning and stamped my tap with the wrong time.",
    submittedAt: "Aug 7, 2026 · 6:18 PM",
    reviewedBy: "Admin Salazar",
    reviewedAt: "Aug 8, 2026 · 9:02 AM",
    rejectionReason: null,
  },
  {
    id: "cr-009",
    student: "Grace Aquino",
    studentId: "2023-00071",
    section: "BSIT-4B",
    date: "2026-08-06",
    type: "missing-in",
    status: "approved",
    originalTimeIn: null,
    originalTimeOut: "04:35 PM",
    requestedTimeIn: "07:52 AM",
    requestedTimeOut: "04:35 PM",
    reason: "My card was unassigned that morning, so the IN tap was rejected.",
    submittedAt: "Aug 6, 2026 · 5:03 PM",
    reviewedBy: "Admin Marquez",
    reviewedAt: "Aug 7, 2026 · 8:41 AM",
    rejectionReason: null,
  },
  {
    id: "cr-010",
    student: "Karla Bautista",
    studentId: "2023-00026",
    section: "BSIT-4A",
    date: "2026-08-06",
    type: "marked-absent",
    status: "approved",
    originalTimeIn: null,
    originalTimeOut: null,
    requestedTimeIn: "07:26 AM",
    requestedTimeOut: "04:08 PM",
    reason:
      "I was on the room attendance sheet the whole day; only the card failed.",
    submittedAt: "Aug 6, 2026 · 7:12 PM",
    reviewedBy: "Admin Marquez",
    reviewedAt: "Aug 7, 2026 · 10:15 AM",
    rejectionReason: null,
  },
  {
    id: "cr-011",
    student: "Ella Gutierrez",
    studentId: "2024-00140",
    section: "BSIT-3A",
    date: "2026-08-05",
    type: "missing-out",
    status: "approved",
    originalTimeIn: "07:31 AM",
    originalTimeOut: null,
    requestedTimeIn: "07:31 AM",
    requestedTimeOut: "03:31 PM",
    reason: "Dismissed early for the department program and forgot to tap out.",
    submittedAt: "Aug 5, 2026 · 4:58 PM",
    reviewedBy: "Admin Salazar",
    reviewedAt: "Aug 6, 2026 · 8:33 AM",
    rejectionReason: null,
  },
  {
    id: "cr-012",
    student: "Diego Navarro",
    studentId: "2024-00112",
    section: "BSIT-2A",
    date: "2026-08-05",
    type: "duplicate-scan",
    status: "approved",
    originalTimeIn: "07:44 AM",
    originalTimeOut: "07:45 AM",
    requestedTimeIn: "07:44 AM",
    requestedTimeOut: "04:16 PM",
    reason: "Tapped twice at the gate and the second read closed my day.",
    submittedAt: "Aug 5, 2026 · 6:40 PM",
    reviewedBy: "Admin Marquez",
    reviewedAt: "Aug 6, 2026 · 9:27 AM",
    rejectionReason: null,
  },
  {
    id: "cr-013",
    student: "Rafael Lim",
    studentId: "2023-00058",
    section: "BSIT-4B",
    date: "2026-08-06",
    type: "marked-absent",
    status: "rejected",
    originalTimeIn: null,
    originalTimeOut: null,
    requestedTimeIn: "07:15 AM",
    requestedTimeOut: "04:00 PM",
    reason: "I was present the whole day but the system marked me absent.",
    submittedAt: "Aug 6, 2026 · 8:04 PM",
    reviewedBy: "Admin Salazar",
    reviewedAt: "Aug 7, 2026 · 9:12 AM",
    rejectionReason:
      "The reader log and the room attendance sheet both show no entry for this date.",
  },
  {
    id: "cr-014",
    student: "Ari Reyes",
    studentId: "2024-00131",
    section: "BSIT-3A",
    date: "2026-08-05",
    type: "wrong-time",
    status: "rejected",
    originalTimeIn: "09:38 AM",
    originalTimeOut: "04:04 PM",
    requestedTimeIn: "07:38 AM",
    requestedTimeOut: "04:04 PM",
    reason: "My IN was recorded two hours late.",
    submittedAt: "Aug 5, 2026 · 5:49 PM",
    reviewedBy: "Admin Marquez",
    reviewedAt: "Aug 6, 2026 · 11:05 AM",
    rejectionReason:
      "The reader ran without a restart that morning, and the 9:38 AM stamp matches the gate footage.",
  },
  {
    id: "cr-015",
    student: "Sam Ocampo",
    studentId: "2025-00077",
    section: "BSIT-1A",
    date: "2026-08-04",
    type: "missing-in",
    status: "rejected",
    originalTimeIn: null,
    originalTimeOut: "04:19 PM",
    requestedTimeIn: "07:47 AM",
    requestedTimeOut: "04:19 PM",
    reason: "The morning reader did not pick up my card.",
    submittedAt: "Aug 4, 2026 · 6:22 PM",
    reviewedBy: "Admin Salazar",
    reviewedAt: "Aug 5, 2026 · 8:58 AM",
    rejectionReason:
      "A correction for the same date was already applied on Aug 4, so this one duplicates it.",
  },
];

/**
 * Seed events for the activity feed, newest first. Approving or rejecting adds
 * to this list in frontend state; nothing here is read back from a table.
 */
export const requestActivity: RequestActivityEvent[] = [
  { id: "ra-001", kind: "submitted", student: "Juan Dela Cruz", minutesAgo: 2 },
  { id: "ra-002", kind: "approved", student: "Liza Domingo", minutesAgo: 8 },
  { id: "ra-003", kind: "rejected", student: "Rafael Lim", minutesAgo: 15 },
  { id: "ra-004", kind: "submitted", student: "Maria Santos", minutesAgo: 21 },
  { id: "ra-005", kind: "approved", student: "Miguel Torres", minutesAgo: 46 },
  { id: "ra-006", kind: "submitted", student: "Nico Ramos", minutesAgo: 92 },
];

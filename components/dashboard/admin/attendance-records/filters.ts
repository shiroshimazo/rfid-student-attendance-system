import type { AttendanceRecord } from "@/lib/mock-data/attendance-records";
import { attendanceSections } from "@/lib/mock-data/attendance-records";

/**
 * Filter, search and sort for the records table. Pure functions over the mock
 * array — no fetching, no query building. When this moves to Supabase the same
 * option ids become `where` / `order by` clauses.
 */

export type SectionFilter = "all" | (typeof attendanceSections)[number];
export type StatusFilter =
  | "all"
  | "present"
  | "absent"
  | "incomplete"
  | "correction-requested";
/** The RFID event, kept separate from the attendance status on purpose. */
export type ActivityFilter = "all" | "in" | "out";
export type SortOption =
  | "newest"
  | "oldest"
  | "student-asc"
  | "student-desc"
  | "section-asc";

export type FilterOption<Value extends string> = {
  value: Value;
  label: string;
};

export const sectionOptions: FilterOption<SectionFilter>[] = [
  { value: "all", label: "All Section" },
  ...attendanceSections.map((section) => ({
    value: section,
    label: section,
  })),
];

export const statusOptions: FilterOption<StatusFilter>[] = [
  { value: "all", label: "All Status" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "incomplete", label: "Incomplete" },
  { value: "correction-requested", label: "Correction Requested" },
];

export const activityOptions: FilterOption<ActivityFilter>[] = [
  { value: "all", label: "All Activity" },
  { value: "in", label: "IN" },
  { value: "out", label: "OUT" },
];

export const sortOptions: FilterOption<SortOption>[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "student-asc", label: "Student A–Z" },
  { value: "student-desc", label: "Student Z–A" },
  { value: "section-asc", label: "Section A–Z" },
];

/** The state every control on the page writes into. */
export type RecordFilters = {
  query: string;
  section: SectionFilter;
  status: StatusFilter;
  activity: ActivityFilter;
  sort: SortOption;
};

export const defaultFilters: RecordFilters = {
  query: "",
  section: "all",
  status: "all",
  activity: "all",
  sort: "newest",
};

/**
 * Activity asks whether the record holds that RFID event at all, which is why
 * an `incomplete` day still matches `IN` — the tap happened, only the OUT is
 * missing.
 */
function matchesActivity(record: AttendanceRecord, activity: ActivityFilter) {
  if (activity === "all") {
    return true;
  }

  return activity === "in" ? record.timeIn !== null : record.timeOut !== null;
}

/** Name, student number and card UID, the three fields the search box names. */
function matchesQuery(record: AttendanceRecord, query: string) {
  const needle = query.trim().toLowerCase();

  if (needle.length === 0) {
    return true;
  }

  return [record.student, record.studentId, record.rfid]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export function filterAttendanceRecords(
  records: AttendanceRecord[],
  filters: RecordFilters,
) {
  const matched = records.filter(
    (record) =>
      (filters.section === "all" || record.section === filters.section) &&
      (filters.status === "all" || record.status === filters.status) &&
      matchesActivity(record, filters.activity) &&
      matchesQuery(record, filters.query),
  );

  // Copied before sorting: the imported array is module state shared with every
  // other render, and sorting in place would reorder it permanently.
  return [...matched].sort((a, b) => {
    switch (filters.sort) {
      case "oldest":
        return a.date.localeCompare(b.date) || a.student.localeCompare(b.student);
      case "student-asc":
        return a.student.localeCompare(b.student) || b.date.localeCompare(a.date);
      case "student-desc":
        return b.student.localeCompare(a.student) || b.date.localeCompare(a.date);
      case "section-asc":
        return (
          a.section.localeCompare(b.section) ||
          b.date.localeCompare(a.date) ||
          a.student.localeCompare(b.student)
        );
      case "newest":
      default:
        return b.date.localeCompare(a.date) || a.student.localeCompare(b.student);
    }
  });
}

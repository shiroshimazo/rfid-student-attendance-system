import type { Badge } from "@/components/ui/badge";
import type {
  AttendanceActivity,
  AttendanceRecord,
  AttendanceStatus,
} from "@/lib/mock-data/attendance-records";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

/**
 * Wording, badge tints and date formatting for an attendance record, shared by
 * the table and the details drawer so one record never reads two ways on the
 * same screen.
 *
 * Kept beside the presentation rather than in the mock data: the dataset stays
 * serializable, and the labels stay next to the components that render them.
 */

export const statusLabels: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  incomplete: "Incomplete",
  "correction-requested": "Correction Requested",
};

export const statusVariants: Record<AttendanceStatus, BadgeVariant> = {
  present: "ink",
  absent: "destructive",
  incomplete: "neutral",
  "correction-requested": "accent",
};

export const activityLabels: Record<AttendanceActivity, string> = {
  in: "IN",
  out: "OUT",
};

/** `Aug 11, 2026` — the table's compact form. */
export function formatRecordDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** `August 11, 2026` — the drawer spells the month out. */
export function formatRecordDateLong(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Stands in for a missing time or reader. An em dash rather than an empty cell,
 * so a row with no OUT still reads as a row.
 */
export const missingValue = "—";

/**
 * Initials for the student avatar. Falls back to a single glyph so an unnamed
 * record still renders a filled circle.
 */
export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * The five summary values, counted from the rows themselves rather than stored
 * beside them: a mock total that disagreed with the table would be the first
 * thing to rot.
 */
export function summarizeRecords(records: AttendanceRecord[]) {
  const present = records.filter((row) => row.status === "present").length;
  const absent = records.filter((row) => row.status === "absent").length;
  const corrections = records.filter(
    (row) => row.status === "correction-requested",
  ).length;

  return {
    total: records.length,
    present,
    absent,
    corrections,
    // Present over every logged day; `incomplete` counts against the rate the
    // same way a real report would treat an unfinished day.
    rate:
      records.length === 0
        ? 0
        : Math.round((present / records.length) * 1000) / 10,
  };
}

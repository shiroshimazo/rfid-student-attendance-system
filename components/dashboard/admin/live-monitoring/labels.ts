import type { Badge } from "@/components/ui/badge";
import type {
  AttendanceOutcome,
  LiveScanResult,
  LiveScanStatus,
  SmsOutcome,
} from "@/lib/mock-data/live-monitoring";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

/**
 * Wording and badge tints for a scan, shared by the activity feed and the
 * Current Scan panel so one event never reads two ways on the same screen.
 *
 * Kept beside the presentation rather than in the mock data: the dataset stays
 * serializable, and the labels stay next to the components that render them.
 */

export const statusLabels: Record<LiveScanStatus, string> = {
  in: "IN",
  out: "OUT",
  rejected: "Rejected",
};

export const statusVariants: Record<LiveScanStatus, BadgeVariant> = {
  in: "ink",
  out: "accent",
  rejected: "destructive",
};

export const resultLabels: Record<LiveScanResult, string> = {
  success: "Success",
  duplicate: "Duplicate Tap",
  unassigned: "Unassigned RFID",
  invalid: "Invalid RFID",
  "out-without-in": "OUT Without IN",
  "sms-failed": "SMS Failed",
};

export const resultVariants: Record<LiveScanResult, BadgeVariant> = {
  success: "outline",
  duplicate: "neutral",
  unassigned: "destructive",
  invalid: "destructive",
  "out-without-in": "destructive",
  "sms-failed": "destructive",
};

export const attendanceLabels: Record<AttendanceOutcome, string> = {
  recorded: "Attendance recorded",
  "duplicate-ignored": "Duplicate ignored",
  "not-recorded": "Not recorded",
};

export const smsLabels: Record<SmsOutcome, string> = {
  queued: "SMS queued",
  sent: "SMS sent",
  failed: "SMS failed",
  "not-sent": "No SMS sent",
};

/**
 * Initials for the Current Scan avatar. Falls back to a single glyph so an
 * unresolved card ("Unknown Card") still renders a filled circle.
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

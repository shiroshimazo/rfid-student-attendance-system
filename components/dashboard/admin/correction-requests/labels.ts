/**
 * Wording, formatting and colour mapping for the Correction Requests page.
 *
 * Kept beside the presentation rather than in the mock data: the dataset stays
 * serializable, and the labels stay next to the components that render them.
 */

import type { VariantProps } from "class-variance-authority";

import type { badgeVariants } from "@/components/ui/badge";
import { seriesMeta } from "@/components/dashboard/charts/chart-series";
import type {
  CorrectionRequest,
  CorrectionStatus,
  CorrectionType,
  RequestActivityKind,
} from "@/lib/mock-data/correction-requests";

export const statusLabels: Record<CorrectionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

/**
 * Three states, three of the badge variants the rest of the dashboard already
 * uses. Reusing them keeps the page inside the existing palette instead of
 * introducing a second set of status colours.
 */
export const statusVariants: Record<
  CorrectionStatus,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  pending: "accent",
  approved: "ink",
  rejected: "destructive",
};

export const typeLabels: Record<CorrectionType, string> = {
  "missing-in": "Missing IN",
  "missing-out": "Missing OUT",
  "wrong-time": "Wrong Time",
  "marked-absent": "Marked Absent",
  "duplicate-scan": "Duplicate Scan",
};

/** What the activity feed says about each kind of event. */
export const activityLabels: Record<RequestActivityKind, string> = {
  submitted: "Correction submitted",
  approved: "Request approved",
  rejected: "Request rejected",
};

/**
 * Donut slices borrow the chart series colours already defined in globals.css,
 * so the visualization matches the other dashboard charts in both themes.
 */
export const statusSeries: Record<CorrectionStatus, { color: string }> = {
  approved: { color: seriesMeta.in.color },
  pending: { color: seriesMeta.out.color },
  rejected: { color: seriesMeta.invalid.color },
};

/** Shown wherever the reader never recorded a time. */
export const missingValue = "—";

/** Attendance dates arrive ISO; the table and the drawers show them short. */
export function formatRequestDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The feed stores an age in minutes rather than a timestamp, so the label is a
 * pure function of that number and renders the same on the server and in the
 * browser.
 */
export function formatRelativeMinutes(minutes: number): string {
  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} d ago`;
}

/** First two initials, for the avatar beside a student's name. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const initials = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return initials || "?";
}

export type RequestTotals = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};

/**
 * Counted from the same array the table renders, so the summary cards and the
 * donut cannot drift away from the rows.
 */
export function summarizeRequests(requests: CorrectionRequest[]): RequestTotals {
  return requests.reduce<RequestTotals>(
    (totals, request) => {
      totals[request.status] += 1;
      totals.total += 1;
      return totals;
    },
    { pending: 0, approved: 0, rejected: 0, total: 0 },
  );
}

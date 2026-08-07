import type { AttendanceSeries } from "@/lib/mock-data/admin-dashboard";

/**
 * One definition per attendance category, shared by every chart, legend and
 * badge on the dashboard.
 *
 * `color` is handed straight to SVG `stroke`/`fill`, so it stays a `var()` and
 * follows the theme without the charts re-rendering. `swatch`/`text` exist for
 * the DOM side (legends, badges) where a Tailwind class is the cheaper route.
 */
export type SeriesMeta = {
  id: AttendanceSeries;
  label: string;
  /** Short form used where a legend row is tight. */
  shortLabel: string;
  color: string;
  swatch: string;
  text: string;
};

export const seriesMeta: Record<AttendanceSeries, SeriesMeta> = {
  in: {
    id: "in",
    label: "IN",
    shortLabel: "IN",
    color: "var(--series-in)",
    swatch: "bg-series-in",
    text: "text-series-in",
  },
  out: {
    id: "out",
    label: "OUT",
    shortLabel: "OUT",
    color: "var(--series-out)",
    swatch: "bg-series-out",
    text: "text-series-out",
  },
  none: {
    id: "none",
    label: "No Record",
    shortLabel: "No Record",
    color: "var(--series-none)",
    swatch: "bg-series-none",
    text: "text-series-none",
  },
  invalid: {
    id: "invalid",
    label: "Invalid / Rejected",
    shortLabel: "Invalid",
    color: "var(--series-invalid)",
    swatch: "bg-series-invalid",
    text: "text-series-invalid",
  },
};

/**
 * Thins axis categories to a readable count while the underlying dataset stays
 * whole — a 31-day month keeps all 31 points and shows roughly 8 labels.
 */
export function tickInterval(count: number, maxLabels = 8): number {
  if (count <= maxLabels) {
    return 0;
  }

  return Math.ceil(count / maxLabels) - 1;
}

export function toPercent(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

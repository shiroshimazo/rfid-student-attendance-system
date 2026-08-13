export type ReportSeries = "present" | "absent" | "late";

type ReportSeriesMeta = {
  label: string;
  color: string;
  swatch: string;
};

/** Shared semantic mapping for every reports chart, legend, and KPI. */
export const reportSeriesMeta: Record<ReportSeries, ReportSeriesMeta> = {
  present: {
    label: "Present",
    color: "var(--series-in)",
    swatch: "bg-series-in",
  },
  absent: {
    label: "Absent",
    color: "var(--series-out)",
    swatch: "bg-series-out",
  },
  late: {
    label: "Late",
    color: "var(--warning)",
    swatch: "bg-warning",
  },
};

import type { LiveScanEvent } from "@/lib/mock-data/live-monitoring";

import { resultLabels, statusLabels } from "./labels";

/** Tabs above the activity feed. `all` is the default. */
export type ActivityFilter = "all" | "in" | "out" | "rejected";

export const activityFilters: { id: ActivityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in", label: "IN" },
  { id: "out", label: "OUT" },
  { id: "rejected", label: "Rejected" },
];

/**
 * Local filtering for the mock feed — no query leaves the browser.
 *
 * Search matches the fields an operator would type from memory: student name,
 * card UID, section, and the human status/result wording rather than the
 * internal ids, so typing "rejected" or "duplicate tap" works.
 */
export function filterScanEvents(
  events: LiveScanEvent[],
  filter: ActivityFilter,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return events.filter((event) => {
    if (filter !== "all" && event.status !== filter) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      event.student,
      event.rfid,
      event.section,
      statusLabels[event.status],
      resultLabels[event.result],
      event.device,
      event.time,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

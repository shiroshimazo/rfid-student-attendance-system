/**
 * Search, filtering and sorting for the correction requests table. Pure
 * functions over an array so the same code keeps working once the rows come from
 * Supabase instead of the mock file.
 */

import {
  correctionSections,
  type CorrectionRequest,
} from "@/lib/mock-data/correction-requests";

import { statusLabels } from "./labels";

export type SectionFilter = "all" | (typeof correctionSections)[number];
export type StatusFilter = "all" | CorrectionRequest["status"];
export type SortOption = "newest" | "oldest" | "student";

export type FilterOption<Value extends string> = {
  value: Value;
  label: string;
};

export const sectionOptions: FilterOption<SectionFilter>[] = [
  { value: "all", label: "All Section" },
  ...correctionSections.map((section) => ({
    value: section,
    label: section,
  })),
];

export const statusOptions: FilterOption<StatusFilter>[] = [
  { value: "all", label: "All Status" },
  { value: "pending", label: statusLabels.pending },
  { value: "approved", label: statusLabels.approved },
  { value: "rejected", label: statusLabels.rejected },
];

export const sortOptions: FilterOption<SortOption>[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "student", label: "Student A–Z" },
];

export type RequestFilters = {
  query: string;
  section: SectionFilter;
  status: StatusFilter;
  sort: SortOption;
};

export const defaultFilters: RequestFilters = {
  query: "",
  section: "all",
  status: "all",
  sort: "newest",
};

/**
 * Matches on the student's name as well as the ID. The field is labelled for the
 * ID because that is what an administrator is handed, but typing a name should
 * not come back empty.
 */
function matchesQuery(request: CorrectionRequest, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") {
    return true;
  }

  return (
    request.studentId.toLowerCase().includes(needle) ||
    request.student.toLowerCase().includes(needle)
  );
}

export function filterCorrectionRequests(
  requests: CorrectionRequest[],
  filters: RequestFilters,
): CorrectionRequest[] {
  const matched = requests.filter(
    (request) =>
      matchesQuery(request, filters.query) &&
      (filters.section === "all" || request.section === filters.section) &&
      (filters.status === "all" || request.status === filters.status),
  );

  // Copied before sorting: the imported array is module state shared with every
  // other render, and sorting in place would reorder it permanently.
  return [...matched].sort((a, b) => {
    if (filters.sort === "student") {
      return a.student.localeCompare(b.student);
    }

    // Same attendance date happens often, so the ID breaks the tie and keeps
    // the order stable between renders.
    const byDate = a.date.localeCompare(b.date);
    const compared = byDate !== 0 ? byDate : a.id.localeCompare(b.id);

    return filters.sort === "oldest" ? compared : -compared;
  });
}

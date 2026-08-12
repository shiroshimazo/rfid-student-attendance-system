"use client";

import * as React from "react";
import { SearchNormal1 } from "iconsax-reactjs";

import { BentoCard } from "@/components/dashboard/BentoCard";
import { Input } from "@/components/ui/input";
import type {
  CorrectionRequest,
  CorrectionStatus,
} from "@/lib/mock-data/correction-requests";

import { CorrectionRequestsSummaryCards } from "./CorrectionRequestsSummaryCards";
import { CorrectionRequestsTable } from "./CorrectionRequestsTable";
import { QuickActionsCard } from "./QuickActionsCard";
import { RequestActivityCard } from "./RequestActivityCard";
import { RequestDetailsDrawer } from "./RequestDetailsDrawer";
import { RequestListDrawer } from "./RequestListDrawer";
import { RequestSummaryCard } from "./RequestSummaryCard";
import { RequestFilterSelect } from "./RequestFilterSelect";
import { useCorrectionRequests } from "./correction-requests-context";
import {
  defaultFilters,
  filterCorrectionRequests,
  sectionOptions,
  sortOptions,
  statusOptions,
  type RequestFilters,
} from "./filters";
import { statusLabels, summarizeRequests } from "./labels";

const rowsPerPage = 5;

/** Wording of each Quick Action drawer, keyed by the status it lists. */
const listDrawerCopy: Record<
  CorrectionStatus,
  { title: string; description: string; actionLabel: string; empty: string }
> = {
  pending: {
    title: "Review Pending",
    description: "Correction requests that require administrator review",
    actionLabel: "Review Request",
    empty: "No pending requests.",
  },
  approved: {
    title: "Approved Requests",
    description: "Corrections that were applied to attendance",
    actionLabel: "View",
    empty: "No approved requests.",
  },
  rejected: {
    title: "Rejected Requests",
    description: "Corrections that were not applied to attendance",
    actionLabel: "View",
    empty: "No rejected requests.",
  },
};

export function CorrectionRequestsBoard() {
  const { requests } = useCorrectionRequests();

  const [filters, setFilters] = React.useState<RequestFilters>(defaultFilters);
  const [page, setPage] = React.useState(1);

  // Which Quick Action list is open, and which request is open on top of it.
  const [listStatus, setListStatus] = React.useState<CorrectionStatus | null>(
    null,
  );
  const [listOpen, setListOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const totals = summarizeRequests(requests);

  const rows = React.useMemo(
    () => filterCorrectionRequests(requests, filters),
    [requests, filters],
  );

  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));

  // A filter that shortens the list can strand the viewer past the last page.
  // Clamping during render avoids the extra pass an effect would schedule.
  const currentPage = Math.min(page, pageCount);
  if (currentPage !== page) {
    setPage(currentPage);
  }

  const start = (currentPage - 1) * rowsPerPage;
  const pageRows = rows.slice(start, start + rowsPerPage);

  // Looked up by id rather than held as an object, so approving a request
  // re-renders the open drawer with its new status instead of a stale copy.
  const selected =
    selectedId === null
      ? null
      : (requests.find((request) => request.id === selectedId) ?? null);

  const listRequests =
    listStatus === null
      ? []
      : requests.filter((request) => request.status === listStatus);

  function updateFilters(patch: Partial<RequestFilters>) {
    setFilters((previous) => ({ ...previous, ...patch }));
    setPage(1);
  }

  function openDetails(request: CorrectionRequest) {
    setSelectedId(request.id);
    setDetailsOpen(true);
  }

  function openList(status: CorrectionStatus) {
    setListStatus(status);
    setListOpen(true);
  }

  return (
    <div className="flex flex-col gap-3">
      <CorrectionRequestsSummaryCards
        pending={totals.pending}
        approved={totals.approved}
        rejected={totals.rejected}
        total={totals.total}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
        <BentoCard
          title="Correction Requests"
          description="Review and manage submitted corrections"
          headingLevel="h2"
          className="lg:col-span-4"
          contentClassName="flex flex-col"
        >
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <div className="relative min-w-0 flex-1 basis-56">
              <SearchNormal1
                size={14}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={filters.query}
                onChange={(event) =>
                  updateFilters({ query: event.target.value })
                }
                aria-label="Search student ID"
                placeholder="Search student ID..."
                className="h-9 pl-8"
              />
            </div>

            <RequestFilterSelect
              label="Filter by section"
              options={sectionOptions}
              value={filters.section}
              onValueChange={(section) => updateFilters({ section })}
            />
            <RequestFilterSelect
              label="Filter by status"
              options={statusOptions}
              value={filters.status}
              onValueChange={(status) => updateFilters({ status })}
            />
            <RequestFilterSelect
              label="Sort requests"
              options={sortOptions}
              value={filters.sort}
              onValueChange={(sort) => updateFilters({ sort })}
            />
          </div>

          <CorrectionRequestsTable
            rows={pageRows}
            totalRows={rows.length}
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
            onOpen={openDetails}
            onResetFilters={() => {
              setFilters(defaultFilters);
              setPage(1);
            }}
          />
        </BentoCard>

        <RequestSummaryCard />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
        <RequestActivityCard />
        <QuickActionsCard
          counts={{
            pending: totals.pending,
            approved: totals.approved,
            rejected: totals.rejected,
          }}
          onOpen={openList}
        />
      </div>

      {listStatus === null ? null : (
        <RequestListDrawer
          title={listDrawerCopy[listStatus].title}
          description={listDrawerCopy[listStatus].description}
          actionLabel={listDrawerCopy[listStatus].actionLabel}
          emptyMessage={listDrawerCopy[listStatus].empty}
          requests={listRequests}
          open={listOpen}
          onOpenChange={setListOpen}
          onSelect={openDetails}
        />
      )}

      <RequestDetailsDrawer
        request={selected}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <p className="sr-only" aria-live="polite">
        {totals.pending} {statusLabels.pending}, {totals.approved}{" "}
        {statusLabels.approved}, {totals.rejected} {statusLabels.rejected}.
      </p>
    </div>
  );
}

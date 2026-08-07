"use client";

import { ArrowLeft2, ArrowRight2, Wifi } from "iconsax-reactjs";
import { useMemo, useState } from "react";

import { BentoCard } from "@/components/dashboard/BentoCard";
import { useDashboardSearch } from "@/components/dashboard/admin/dashboard-search-context";
import { ChartEmptyState } from "@/components/dashboard/charts/ChartEmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  recentRfidScans,
  type ScanResult,
  type ScanStatus,
} from "@/lib/mock-data/admin-dashboard";

const rowsPerPage = 5;

const statusLabels: Record<ScanStatus, string> = {
  in: "IN",
  out: "OUT",
  rejected: "Rejected",
  duplicate: "Duplicate Tap",
};

const statusVariants: Record<
  ScanStatus,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  in: "ink",
  out: "accent",
  rejected: "destructive",
  duplicate: "neutral",
};

const resultLabels: Record<ScanResult, string> = {
  success: "Success",
  invalid: "Invalid",
  unassigned: "Unassigned",
};

const resultVariants: Record<
  ScanResult,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  success: "outline",
  invalid: "destructive",
  unassigned: "neutral",
};

const columnClass = "px-3 py-2 text-left text-xs font-medium text-muted-foreground";

export function RecentActivityCard() {
  // Local filter text from the dashboard header. Never sent anywhere.
  const { query } = useDashboardSearch();
  const [page, setPage] = useState(1);

  const normalizedQuery = query.trim().toLowerCase();

  const rows = useMemo(() => {
    if (!normalizedQuery) {
      return recentRfidScans;
    }

    return recentRfidScans.filter((scan) =>
      [
        scan.student,
        scan.section,
        statusLabels[scan.status],
        scan.time,
        resultLabels[scan.result],
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));

  // A filter that shortens the list can strand the viewer past the last page.
  // Clamping during render avoids the extra pass an effect would schedule.
  const currentPage = Math.min(page, pageCount);
  if (currentPage !== page) {
    setPage(currentPage);
  }

  const start = (currentPage - 1) * rowsPerPage;
  const pageRows = rows.slice(start, start + rowsPerPage);

  return (
    <BentoCard
      title="Recent RFID Activity"
      description="Latest student RFID scans"
      className="lg:col-span-4"
      contentClassName="flex flex-col"
    >
      {rows.length === 0 ? (
        <ChartEmptyState
          message={
            normalizedQuery
              ? `No RFID activity matches “${query.trim()}”.`
              : "No recent RFID activity."
          }
          icon={Wifi}
        />
      ) : (
        <>
          {/*
            The scroll container is the table alone, so a narrow viewport never
            pushes the page itself sideways.
          */}
          <div className="-mx-1 min-w-0 flex-1 overflow-x-auto px-1">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <caption className="sr-only">
                Latest RFID scans, {rows.length} in total, page {currentPage} of{" "}
                {pageCount}
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className={columnClass}>
                    Student
                  </th>
                  <th scope="col" className={columnClass}>
                    Section
                  </th>
                  <th scope="col" className={columnClass}>
                    Status
                  </th>
                  <th scope="col" className={columnClass}>
                    Time
                  </th>
                  <th scope="col" className={columnClass}>
                    RFID
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((scan) => (
                  <tr
                    key={scan.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <th
                      scope="row"
                      className="px-3 py-2.5 text-left text-sm font-medium text-card-foreground"
                    >
                      {scan.student}
                    </th>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {scan.section}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={statusVariants[scan.status]}>
                        {statusLabels[scan.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">
                      {scan.time}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={resultVariants[scan.result]}>
                        {resultLabels[scan.result]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav
            aria-label="Recent RFID activity pages"
            className="mt-3 flex shrink-0 items-center justify-between gap-3 border-t border-border pt-3"
          >
            <p aria-live="polite" className="text-xs tabular-nums text-muted-foreground">
              Page {currentPage} of {pageCount}
            </p>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              >
                <ArrowLeft2 data-icon="inline-start" aria-hidden="true" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === pageCount}
                onClick={() =>
                  setPage((previous) => Math.min(pageCount, previous + 1))
                }
              >
                Next
                <ArrowRight2 data-icon="inline-end" aria-hidden="true" />
              </Button>
            </div>
          </nav>
        </>
      )}
    </BentoCard>
  );
}

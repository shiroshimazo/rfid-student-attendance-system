"use client";

import { ArrowLeft2, ArrowRight2, Wifi } from "iconsax-reactjs";

import { BentoCard } from "@/components/dashboard/BentoCard";
import { ChartEmptyState } from "@/components/dashboard/charts/ChartEmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LiveScanEvent } from "@/lib/mock-data/live-monitoring";

import {
  resultLabels,
  resultVariants,
  statusLabels,
  statusVariants,
} from "./labels";
import type { ActivityFilter } from "./filters";
import { activityFilters } from "./filters";

type LiveActivityCardProps = {
  /** The current page of rows, already filtered and searched by the board. */
  rows: LiveScanEvent[];
  /** Total matching rows across every page, for the table caption. */
  totalRows: number;
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Ids that arrived since mount, held briefly for a subtle highlight. */
  newIds: ReadonlySet<string>;
  hasQuery: boolean;
};

const columnClass =
  "px-3 py-2 text-left text-xs font-medium whitespace-nowrap text-muted-foreground";

export function LiveActivityCard({
  rows,
  totalRows,
  filter,
  onFilterChange,
  page,
  pageCount,
  onPageChange,
  selectedId,
  onSelect,
  newIds,
  hasQuery,
}: LiveActivityCardProps) {
  return (
    <BentoCard
      title="Live RFID Activity"
      description="Newest scans first"
      headingLevel="h2"
      className="lg:col-span-4"
      contentClassName="flex flex-col"
      action={
        <div
          role="group"
          aria-label="Filter activity by scan type"
          className="flex items-center gap-1 rounded-lg bg-muted/60 p-0.5"
        >
          {activityFilters.map((entry) => {
            const isActive = entry.id === filter;

            return (
              <button
                key={entry.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onFilterChange(entry.id)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition-colors outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-card text-card-foreground shadow-[0_1px_2px_-1px_rgb(0_0_0/0.08)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
      }
    >
      {rows.length === 0 ? (
        <ChartEmptyState
          message={
            hasQuery
              ? "No scans match this search."
              : "No scans in this category yet."
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
            <table className="w-full min-w-[42rem] border-collapse text-sm">
              <caption className="sr-only">
                Live RFID scans, {totalRows} matching, page {page} of{" "}
                {pageCount}. Select a row to inspect it.
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className={columnClass}>
                    Timestamp
                  </th>
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
                    RFID
                  </th>
                  <th scope="col" className={columnClass}>
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((event) => {
                  const isSelected = event.id === selectedId;

                  return (
                    <tr
                      key={event.id}
                      onClick={() => onSelect(event.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className={cn(
                        "cursor-pointer border-b border-border/60 transition-colors last:border-0",
                        isSelected ? "bg-muted/70" : "hover:bg-muted/40",
                        // Newly arrived rows lift briefly, no motion required.
                        newIds.has(event.id) && !isSelected && "bg-series-out/10",
                      )}
                    >
                      <th scope="row" className="px-3 py-2.5 text-left">
                        {/*
                          The button is what keyboard users reach; the row click
                          is a convenience for the mouse and stops here so the
                          handler never fires twice.
                        */}
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            onSelect(event.id);
                          }}
                          className="rounded-md text-xs font-medium tabular-nums whitespace-nowrap text-card-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {event.time}
                          <span className="sr-only">
                            {" "}
                            — show scan details for {event.student}
                          </span>
                        </button>
                      </th>
                      <td className="px-3 py-2.5 text-sm text-card-foreground">
                        {event.student}
                      </td>
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap text-muted-foreground">
                        {event.section}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant={statusVariants[event.status]}>
                          {statusLabels[event.status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap text-muted-foreground">
                        {event.rfid}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant={resultVariants[event.result]}>
                          {resultLabels[event.result]}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/*
            Frontend pagination over the mock feed — nothing is fetched per page.
          */}
          <nav
            aria-label="Live RFID activity pages"
            className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-3"
          >
            <p
              aria-live="polite"
              className="text-xs tabular-nums text-muted-foreground"
            >
              Page {page} of {pageCount}
            </p>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ArrowLeft2 data-icon="inline-start" aria-hidden="true" />
                Previous
              </Button>

              <ul className="flex items-center gap-1">
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                  (pageNumber) => (
                    <li key={pageNumber}>
                      <Button
                        variant={pageNumber === page ? "secondary" : "ghost"}
                        size="icon-sm"
                        aria-label={`Page ${pageNumber}`}
                        aria-current={pageNumber === page ? "page" : undefined}
                        onClick={() => onPageChange(pageNumber)}
                        className="tabular-nums"
                      >
                        {pageNumber}
                      </Button>
                    </li>
                  ),
                )}
              </ul>

              <Button
                variant="outline"
                size="sm"
                disabled={page === pageCount}
                onClick={() => onPageChange(page + 1)}
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

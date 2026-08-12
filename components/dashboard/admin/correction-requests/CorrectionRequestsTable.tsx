"use client";

import { ArrowLeft2, ArrowRight2, ClipboardText, Eye } from "iconsax-reactjs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CorrectionRequest } from "@/lib/mock-data/correction-requests";

import {
  formatRequestDate,
  initialsOf,
  statusLabels,
  statusVariants,
  typeLabels,
} from "./labels";

type CorrectionRequestsTableProps = {
  rows: CorrectionRequest[];
  /** Every matching request, not just the page — used by the caption. */
  totalRows: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onOpen: (request: CorrectionRequest) => void;
  onResetFilters: () => void;
};

const columnClass =
  "px-3 py-2 text-left text-xs font-medium whitespace-nowrap text-muted-foreground";

const cellClass = "px-3 py-2.5 text-sm text-card-foreground";

export function CorrectionRequestsTable({
  rows,
  totalRows,
  page,
  pageCount,
  onPageChange,
  onOpen,
  onResetFilters,
}: CorrectionRequestsTableProps) {
  if (totalRows === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
        <ClipboardText
          size={20}
          aria-hidden="true"
          className="text-muted-foreground"
        />
        <p className="text-sm font-medium text-card-foreground">
          No correction requests found
        </p>
        <p className="text-xs text-muted-foreground">
          Try changing your search or filters.
        </p>
        <Button variant="outline" size="sm" onClick={onResetFilters}>
          Reset Filters
        </Button>
      </div>
    );
  }

  // Three pages at five rows on the seeded data; the range follows the count so
  // a filtered list never offers a page that has nothing on it.
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <>
      {/*
        The scroll container is the table alone, so a narrow viewport never
        pushes the page itself sideways.
      */}
      <div className="-mx-1 min-w-0 flex-1 overflow-x-auto px-1">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <caption className="sr-only">
            Student correction requests, {totalRows} matching, page {page} of{" "}
            {pageCount}.
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
                Date
              </th>
              <th scope="col" className={columnClass}>
                Type
              </th>
              <th scope="col" className={columnClass}>
                Status
              </th>
              <th scope="col" className={columnClass}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((request) => {
              const pending = request.status === "pending";

              return (
                <tr
                  key={request.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                >
                  <th scope="row" className={`${cellClass} font-normal`}>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-[0.6875rem] font-medium text-muted-foreground"
                      >
                        {initialsOf(request.student)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {request.student}
                        </span>
                        <span className="block truncate text-xs tabular-nums text-muted-foreground">
                          {request.studentId}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap text-muted-foreground">
                    {request.section}
                  </td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap text-muted-foreground">
                    {formatRequestDate(request.date)}
                  </td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap text-muted-foreground">
                    {typeLabels[request.type]}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant={statusVariants[request.status]}>
                      {statusLabels[request.status]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    {/*
                      Pending rows open the reviewable drawer; a settled request
                      opens the same drawer read-only.
                    */}
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => onOpen(request)}
                    >
                      <Eye data-icon="inline-start" aria-hidden="true" />
                      {pending ? "Review" : "View"}
                      <span className="sr-only">
                        {" "}
                        correction request for {request.student} on{" "}
                        {formatRequestDate(request.date)}
                      </span>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="Correction request pages"
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
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            <ArrowLeft2 data-icon="inline-start" aria-hidden="true" />
            Prev
          </Button>

          {pageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === page ? "secondary" : "ghost"}
              size="icon-sm"
              aria-current={pageNumber === page ? "page" : undefined}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
              <span className="sr-only"> Page {pageNumber}</span>
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            disabled={page === pageCount}
            onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          >
            Next
            <ArrowRight2 data-icon="inline-end" aria-hidden="true" />
          </Button>
        </div>
      </nav>
    </>
  );
}

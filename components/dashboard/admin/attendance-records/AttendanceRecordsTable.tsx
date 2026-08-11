"use client";

import { ArrowLeft2, ArrowRight2, ClipboardText, Eye } from "iconsax-reactjs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AttendanceRecord } from "@/lib/mock-data/attendance-records";

import {
  formatRecordDate,
  initialsOf,
  missingValue,
  statusLabels,
  statusVariants,
} from "./labels";

type AttendanceRecordsTableProps = {
  /** The current page of rows, already filtered and sorted by the board. */
  rows: AttendanceRecord[];
  /** Total matching rows across every page, for the table caption. */
  totalRows: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onView: (record: AttendanceRecord) => void;
  onResetFilters: () => void;
};

const columnClass =
  "px-3 py-2 text-left text-xs font-medium whitespace-nowrap text-muted-foreground";

const cellClass = "px-3 py-2.5 text-sm text-card-foreground";

export function AttendanceRecordsTable({
  rows,
  totalRows,
  page,
  pageCount,
  onPageChange,
  onView,
  onResetFilters,
}: AttendanceRecordsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
        <ClipboardText
          size={20}
          aria-hidden="true"
          className="text-muted-foreground"
        />
        <p className="text-sm font-medium text-card-foreground">
          No attendance records found
        </p>
        <p className="text-xs text-pretty text-muted-foreground">
          Try changing your search or filters.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="mt-2"
        >
          Reset Filters
        </Button>
      </div>
    );
  }

  return (
    <>
      {/*
        The scroll container is the table alone, so a narrow viewport never
        pushes the page itself sideways.
      */}
      <div className="-mx-1 min-w-0 flex-1 overflow-x-auto px-1">
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <caption className="sr-only">
            Student attendance records, {totalRows} matching, page {page} of{" "}
            {pageCount}.
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className={columnClass}>
                Date
              </th>
              <th scope="col" className={columnClass}>
                Student
              </th>
              <th scope="col" className={columnClass}>
                ID
              </th>
              <th scope="col" className={columnClass}>
                Section
              </th>
              <th scope="col" className={columnClass}>
                IN
              </th>
              <th scope="col" className={columnClass}>
                OUT
              </th>
              <th scope="col" className={columnClass}>
                Status
              </th>
              <th scope="col" className={cn(columnClass, "text-right")}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((record) => (
              <tr
                key={record.id}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
              >
                <th
                  scope="row"
                  className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-card-foreground"
                >
                  {formatRecordDate(record.date)}
                </th>

                <td className={cellClass}>
                  <span className="flex min-w-0 items-center gap-2.5">
                    {/*
                      Initials stand in for the student photo the real record
                      will carry.
                    */}
                    <span
                      aria-hidden="true"
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-[0.6875rem] font-medium text-muted-foreground"
                    >
                      {initialsOf(record.student)}
                    </span>
                    <span className="min-w-0 truncate">{record.student}</span>
                  </span>
                </td>

                <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap text-muted-foreground">
                  {record.studentId}
                </td>

                <td className="px-3 py-2.5 text-xs whitespace-nowrap text-muted-foreground">
                  {record.section}
                </td>

                <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap text-card-foreground">
                  {record.timeIn ?? (
                    <span className="text-muted-foreground">
                      {missingValue}
                    </span>
                  )}
                </td>

                <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap text-card-foreground">
                  {record.timeOut ?? (
                    <span className="text-muted-foreground">
                      {missingValue}
                    </span>
                  )}
                </td>

                <td className="px-3 py-2.5">
                  <Badge variant={statusVariants[record.status]}>
                    {statusLabels[record.status]}
                  </Badge>
                </td>

                <td className="px-3 py-2.5 text-right">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => onView(record)}
                  >
                    <Eye data-icon="inline-start" aria-hidden="true" />
                    View
                    {/* The visible label repeats on every row, so the row's
                        subject is spelled out for screen readers. */}
                    <span className="sr-only">
                      {" "}
                      attendance details for {record.student} on{" "}
                      {formatRecordDate(record.date)}
                    </span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/*
        Frontend pagination over the mock array — nothing is fetched per page.
      */}
      <nav
        aria-label="Attendance record pages"
        className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-3"
      >
        <p aria-live="polite" className="text-xs tabular-nums text-muted-foreground">
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
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { SearchNormal1 } from "iconsax-reactjs";

import { BentoCard } from "@/components/dashboard/BentoCard";
import { Input } from "@/components/ui/input";
import {
  attendanceRecords,
  type AttendanceRecord,
} from "@/lib/mock-data/attendance-records";

import { AttendanceDetailsDrawer } from "./AttendanceDetailsDrawer";
import { AttendanceRecordsTable } from "./AttendanceRecordsTable";
import {
  activityOptions,
  defaultFilters,
  filterAttendanceRecords,
  sectionOptions,
  sortOptions,
  statusOptions,
  type ActivityFilter,
  type RecordFilters,
  type SectionFilter,
  type SortOption,
  type StatusFilter,
} from "./filters";
import { RecordFilterSelect } from "./RecordFilterSelect";

/** Rows per page of the mock table. Frontend-only pagination. */
const rowsPerPage = 5;

/**
 * Owns the records state: search, the four dropdowns, the page, and which row
 * the drawer is showing.
 *
 * TODO: Replace mock data with Supabase attendance records. Everything here runs
 * over the local array — no query, no realtime subscription, and nothing that
 * touches the readers, attendance processing or SMS.
 */
export function AttendanceRecordsBoard() {
  const [filters, setFilters] = useState<RecordFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AttendanceRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rows = useMemo(
    () => filterAttendanceRecords(attendanceRecords, filters),
    [filters],
  );

  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));

  // A narrowing search or filter can strand the viewer past the last page.
  // Clamping during render avoids the extra pass an effect would schedule.
  const currentPage = Math.min(page, pageCount);
  if (currentPage !== page) {
    setPage(currentPage);
  }

  const start = (currentPage - 1) * rowsPerPage;
  const pageRows = rows.slice(start, start + rowsPerPage);

  // Every filter and search change restarts pagination at page 1.
  const updateFilters = useCallback((patch: Partial<RecordFilters>) => {
    setFilters((previous) => ({ ...previous, ...patch }));
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setFilters(defaultFilters);
    setPage(1);
  }, []);

  const handleView = useCallback((record: AttendanceRecord) => {
    setSelected(record);
    setDrawerOpen(true);
  }, []);

  return (
    <>
      <BentoCard
        title="Attendance Records"
        description="Newest first"
        headingLevel="h2"
        contentClassName="flex flex-col"
      >
        {/*
          Search and the four dropdowns wrap on narrow screens rather than
          shrinking the table's own scroll container.
        */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-64">
            <SearchNormal1
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
            />
            <label htmlFor="attendance-records-search" className="sr-only">
              Search student, ID or RFID
            </label>
            <Input
              id="attendance-records-search"
              type="search"
              value={filters.query}
              onChange={(event) => updateFilters({ query: event.target.value })}
              placeholder="Search Student, ID, RFID..."
              className="h-9 pl-8"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RecordFilterSelect<SectionFilter>
              label="Filter by section"
              options={sectionOptions}
              value={filters.section}
              onValueChange={(section) => updateFilters({ section })}
            />
            <RecordFilterSelect<StatusFilter>
              label="Filter by status"
              options={statusOptions}
              value={filters.status}
              onValueChange={(status) => updateFilters({ status })}
            />
            {/* Activity is the RFID event; status is the day's state. */}
            <RecordFilterSelect<ActivityFilter>
              label="Filter by activity"
              options={activityOptions}
              value={filters.activity}
              onValueChange={(activity) => updateFilters({ activity })}
            />
            <RecordFilterSelect<SortOption>
              label="Sort records"
              options={sortOptions}
              value={filters.sort}
              onValueChange={(sort) => updateFilters({ sort })}
            />
          </div>
        </div>

        <div className="mt-4 flex min-w-0 flex-1 flex-col">
          <AttendanceRecordsTable
            rows={pageRows}
            totalRows={rows.length}
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
            onView={handleView}
            onResetFilters={handleReset}
          />
        </div>
      </BentoCard>

      <AttendanceDetailsDrawer
        record={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}

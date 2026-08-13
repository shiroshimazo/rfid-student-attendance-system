"use client";

import {
  ArrowLeft2,
  ArrowRight2,
  Edit2,
  Eye,
  ProfileRemove,
  SearchNormal1,
  Trash,
} from "iconsax-reactjs";

import { BentoCard } from "@/components/dashboard/BentoCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  Student,
  StudentSortOption,
} from "@/lib/mock-data/students";

import {
  StudentFilterSelect,
  studentSectionOptions,
  studentSortOptions,
  studentStatusOptions,
  type StudentSectionFilter,
  type StudentStatusFilter,
} from "./StudentFilterSelect";

type StudentDirectoryCardProps = {
  /** Current five-row page. Filtering, sorting, and pagination stay with parent. */
  rows: Student[];
  totalRows: number;
  page: number;
  pageCount: number;
  searchQuery: string;
  section: StudentSectionFilter;
  status: StudentStatusFilter;
  sort: StudentSortOption;
  onSearchChange: (query: string) => void;
  onSectionChange: (section: StudentSectionFilter) => void;
  onStatusChange: (status: StudentStatusFilter) => void;
  onSortChange: (sort: StudentSortOption) => void;
  onPageChange: (page: number) => void;
  onEdit: (student: Student) => void;
  onView: (student: Student) => void;
  onDelete: (student: Student) => void;
  onResetFilters: () => void;
  className?: string;
};

const columnClass =
  "px-3 py-2 text-left text-xs font-medium whitespace-nowrap text-muted-foreground";

const actionClass = "h-11 px-3 sm:h-10";

export function StudentDirectoryCard({
  rows,
  totalRows,
  page,
  pageCount,
  searchQuery,
  section,
  status,
  sort,
  onSearchChange,
  onSectionChange,
  onStatusChange,
  onSortChange,
  onPageChange,
  onEdit,
  onView,
  onDelete,
  onResetFilters,
  className,
}: StudentDirectoryCardProps) {
  const safePageCount = Math.max(1, pageCount);
  const safePage = Math.min(Math.max(page, 1), safePageCount);
  const firstRow = totalRows === 0 ? 0 : (safePage - 1) * 5 + 1;
  const lastRow = Math.min(firstRow + rows.length - 1, totalRows);
  const paginationItems = buildPaginationItems(safePage, safePageCount);

  return (
    <BentoCard
      title="Student Directory"
      description={`${totalRows.toLocaleString()} matching ${totalRows === 1 ? "student" : "students"}`}
      headingLevel="h2"
      className={cn("min-h-[32rem]", className)}
      contentClassName="flex min-h-0 flex-col"
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <SearchNormal1
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <label htmlFor="student-directory-search" className="sr-only">
            Search directory by name, student ID, or RFID
          </label>
          <Input
            id="student-directory-search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search student, ID or RFID…"
            className="h-11 pl-9 sm:h-10"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 min-[26rem]:grid-cols-3 lg:flex lg:shrink-0">
          <StudentFilterSelect<StudentSectionFilter>
            label="Filter students by section"
            options={studentSectionOptions}
            value={section}
            onValueChange={onSectionChange}
            className="w-full min-[26rem]:min-w-0 lg:w-36"
          />
          <StudentFilterSelect<StudentStatusFilter>
            label="Filter students by status"
            options={studentStatusOptions}
            value={status}
            onValueChange={onStatusChange}
            className="w-full min-[26rem]:min-w-0 lg:w-36"
          />
          <StudentFilterSelect<StudentSortOption>
            label="Sort students"
            options={studentSortOptions}
            value={sort}
            onValueChange={onSortChange}
            className="w-full min-[26rem]:min-w-0 lg:w-36"
          />
        </div>
      </div>

      <div className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col">
        {totalRows === 0 ? (
          <StudentDirectoryEmptyState onResetFilters={onResetFilters} />
        ) : (
          <>
            <div className="-mx-1 min-w-0 flex-1 overflow-x-auto px-1">
              <table className="w-full min-w-[55rem] border-collapse text-sm">
                <caption className="sr-only">
                  Student directory, {totalRows} matching, page {safePage} of{" "}
                  {safePageCount}.
                </caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={columnClass}>
                      Student Name
                    </th>
                    <th scope="col" className={columnClass}>
                      Student ID
                    </th>
                    <th scope="col" className={columnClass}>
                      RFID
                    </th>
                    <th scope="col" className={columnClass}>
                      Status
                    </th>
                    <th scope="col" className={cn(columnClass, "text-right")}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((student) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      onEdit={onEdit}
                      onView={onView}
                      onDelete={onDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <nav
              aria-label="Student directory pages"
              className="mt-3 flex shrink-0 items-center justify-between gap-3 border-t border-border pt-3"
            >
              <p
                aria-live="polite"
                className="hidden text-xs tabular-nums text-muted-foreground lg:block"
              >
                Showing {firstRow}–{lastRow} of {totalRows}
              </p>

              <div className="flex w-full items-center justify-between gap-2 lg:w-auto lg:justify-end">
                <PaginationArrow
                  direction="previous"
                  disabled={safePage === 1}
                  onClick={() => onPageChange(safePage - 1)}
                />

                <p className="text-xs tabular-nums whitespace-nowrap text-muted-foreground sm:hidden">
                  Page {safePage} of {safePageCount}
                </p>

                <ol className="hidden items-center gap-1 sm:flex">
                  {paginationItems.map((item) =>
                    typeof item === "number" ? (
                      <li key={item}>
                        <Button
                          variant={item === safePage ? "secondary" : "ghost"}
                          size="icon-sm"
                          aria-label={`Go to page ${item}`}
                          aria-current={item === safePage ? "page" : undefined}
                          onClick={() => onPageChange(item)}
                          className="size-10 tabular-nums"
                        >
                          {item}
                        </Button>
                      </li>
                    ) : (
                      <li
                        key={item}
                        aria-hidden="true"
                        className="flex size-6 items-center justify-center text-xs text-muted-foreground"
                      >
                        …
                      </li>
                    ),
                  )}
                </ol>

                <PaginationArrow
                  direction="next"
                  disabled={safePage === safePageCount}
                  onClick={() => onPageChange(safePage + 1)}
                />
              </div>
            </nav>
          </>
        )}
      </div>
    </BentoCard>
  );
}

type StudentRowProps = Pick<
  StudentDirectoryCardProps,
  "onEdit" | "onView" | "onDelete"
> & {
  student: Student;
};

function StudentRow({ student, onEdit, onView, onDelete }: StudentRowProps) {
  const initials = student.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <tr className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40">
      <th scope="row" className="px-3 py-2.5 text-left font-normal text-card-foreground">
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-[0.6875rem] font-medium text-muted-foreground"
          >
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{student.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {student.section}
            </span>
          </span>
        </span>
      </th>
      <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap text-muted-foreground">
        {student.studentId}
      </td>
      <td className="px-3 py-2.5 font-mono text-xs tabular-nums whitespace-nowrap text-muted-foreground">
        {student.rfid ?? <span className="font-sans italic">Unassigned</span>}
      </td>
      <td className="px-3 py-2.5">
        <Badge
          className={cn(
            student.status === "active"
              ? "bg-success/15 text-success"
              : "bg-muted text-muted-foreground",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              student.status === "active" ? "bg-success" : "bg-disabled",
            )}
          />
          {student.status === "active" ? "Active" : "Inactive"}
        </Badge>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(student)}
            className={cn(actionClass, "text-info hover:bg-info/15 hover:text-info")}
          >
            <Edit2 data-icon="inline-start" aria-hidden="true" />
            Edit
            <span className="sr-only"> {student.name}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(student)}
            className={cn(
              actionClass,
              "text-success hover:bg-success/15 hover:text-success",
            )}
          >
            <Eye data-icon="inline-start" aria-hidden="true" />
            View
            <span className="sr-only"> {student.name}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(student)}
            className={cn(
              actionClass,
              "text-destructive-foreground hover:bg-destructive/15 hover:text-destructive-foreground",
            )}
          >
            <Trash data-icon="inline-start" aria-hidden="true" />
            Delete
            <span className="sr-only"> {student.name}</span>
          </Button>
        </div>
      </td>
    </tr>
  );
}

function StudentDirectoryEmptyState({
  onResetFilters,
}: Pick<StudentDirectoryCardProps, "onResetFilters">) {
  return (
    <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
      <ProfileRemove size={22} aria-hidden="true" className="text-muted-foreground" />
      <p className="text-sm font-medium text-card-foreground">
        No students found
      </p>
      <p className="text-xs text-pretty text-muted-foreground">
        Try changing your search or filters.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onResetFilters}
        className="mt-2 h-11 px-3 sm:h-10"
      >
        Reset Filters
      </Button>
    </div>
  );
}

type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

function buildPaginationItems(page: number, pageCount: number): PaginationItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const candidates = [1, page - 1, page, page + 1, pageCount]
    .filter((candidate) => candidate >= 1 && candidate <= pageCount)
    .filter((candidate, index, values) => values.indexOf(candidate) === index)
    .sort((left, right) => left - right);
  const items: PaginationItem[] = [];

  candidates.forEach((candidate, index) => {
    const previous = candidates[index - 1];

    if (previous !== undefined && candidate - previous === 2) {
      items.push(previous + 1);
    } else if (previous !== undefined && candidate - previous > 2) {
      items.push(index === 1 ? "ellipsis-start" : "ellipsis-end");
    }

    items.push(candidate);
  });

  return items;
}

function PaginationArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const previous = direction === "previous";
  const Icon = previous ? ArrowLeft2 : ArrowRight2;

  return (
    <Button
      variant="outline"
      size="icon-sm"
      disabled={disabled}
      onClick={onClick}
      aria-label={previous ? "Previous page" : "Next page"}
      className="size-11 sm:size-10"
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}

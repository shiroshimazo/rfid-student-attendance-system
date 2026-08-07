"use client";

import { Select } from "@base-ui/react/select";
import { ArrowDown2, TickCircle } from "iconsax-reactjs";

import {
  attendanceRanges,
  type AttendanceRange,
} from "@/lib/mock-data/admin-dashboard";
import { cn } from "@/lib/utils";

type AttendanceRangeSelectProps = {
  value: AttendanceRange;
  onValueChange: (value: AttendanceRange) => void;
};

/**
 * `Select.Value` renders the raw value unless the root is told the item shape,
 * so the trigger would read "today" instead of "Today" without this.
 */
const items = attendanceRanges.map((range) => ({
  label: range.label,
  value: range.id,
}));

/**
 * Range switcher for the attendance chart.
 *
 * Built on the same `@base-ui/react` primitives the rest of the UI layer uses,
 * so the listbox gets real `role="option"` semantics, type-ahead and arrow-key
 * navigation instead of a div that only responds to a mouse.
 */
export function AttendanceRangeSelect({
  value,
  onValueChange,
}: AttendanceRangeSelectProps) {
  return (
    <Select.Root
      items={items}
      value={value}
      onValueChange={(next) => onValueChange(next as AttendanceRange)}
    >
      <Select.Trigger
        aria-label="Attendance time range"
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground",
          "transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        )}
      >
        <Select.Value />
        <Select.Icon className="flex text-muted-foreground">
          <ArrowDown2 size={14} aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={6} align="end" className="z-50">
          <Select.Popup className="min-w-36 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
            <Select.List className="flex flex-col gap-0.5 outline-none">
              {attendanceRanges.map((range) => (
                <Select.Item
                  key={range.id}
                  value={range.id}
                  className={cn(
                    // Grid rather than flex: the indicator column is reserved on
                    // every row, so selecting one does not shift the labels.
                    "grid min-h-8 cursor-default grid-cols-[0.875rem_1fr] items-center gap-2 rounded-lg px-2 text-xs outline-none",
                    "data-highlighted:bg-muted data-highlighted:text-foreground",
                  )}
                >
                  <Select.ItemIndicator className="col-start-1 flex">
                    <TickCircle size={14} aria-hidden="true" />
                  </Select.ItemIndicator>
                  <Select.ItemText className="col-start-2 truncate">
                    {range.label}
                  </Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

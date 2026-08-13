"use client";

import { Select } from "@base-ui/react/select";
import { ArrowDown2, TickCircle } from "iconsax-reactjs";

import { cn } from "@/lib/utils";
import type {
  StudentSection,
  StudentSortOption,
  StudentStatus,
} from "@/lib/mock-data/students";

export type StudentFilterOption<Value extends string> = {
  label: string;
  value: Value;
};

export type StudentSectionFilter = "all" | StudentSection;
export type StudentStatusFilter = "all" | StudentStatus;

export const studentSectionOptions: StudentFilterOption<StudentSectionFilter>[] = [
  { label: "All Sections", value: "all" },
  { label: "Section A", value: "Section A" },
  { label: "Section B", value: "Section B" },
  { label: "Section C", value: "Section C" },
];

export const studentStatusOptions: StudentFilterOption<StudentStatusFilter>[] = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const studentSortOptions: StudentFilterOption<StudentSortOption>[] = [
  { label: "Name A–Z", value: "name-asc" },
  { label: "Name Z–A", value: "name-desc" },
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
];

type StudentFilterSelectProps<Value extends string> = {
  label: string;
  options: StudentFilterOption<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
  className?: string;
};

/** Accessible shared dropdown for directory section, status, and sort controls. */
export function StudentFilterSelect<Value extends string>({
  label,
  options,
  value,
  onValueChange,
  className,
}: StudentFilterSelectProps<Value>) {
  return (
    <Select.Root
      items={options}
      value={value}
      onValueChange={(next) => onValueChange(next as Value)}
    >
      <Select.Trigger
        aria-label={label}
        className={cn(
          "inline-flex h-11 min-w-36 items-center justify-between gap-2 rounded-lg border border-input bg-input/30 px-3 text-xs font-medium text-foreground",
          "transition-colors outline-none hover:bg-input/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-10",
          className,
        )}
      >
        <Select.Value className="truncate" />
        <Select.Icon className="flex shrink-0 text-muted-foreground">
          <ArrowDown2 size={14} aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={6} align="start" className="z-50">
          <Select.Popup className="min-w-44 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
            <Select.List className="flex flex-col gap-0.5 outline-none">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "grid min-h-11 cursor-default grid-cols-[0.875rem_1fr] items-center gap-2 rounded-lg px-2.5 text-xs outline-none sm:min-h-10",
                    "data-highlighted:bg-muted data-highlighted:text-foreground",
                  )}
                >
                  <Select.ItemIndicator className="col-start-1 flex text-foreground">
                    <TickCircle size={14} aria-hidden="true" />
                  </Select.ItemIndicator>
                  <Select.ItemText className="col-start-2 truncate">
                    {option.label}
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

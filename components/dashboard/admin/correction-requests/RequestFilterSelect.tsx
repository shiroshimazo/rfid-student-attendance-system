"use client";

import { Select } from "@base-ui/react/select";
import { ArrowDown2, TickCircle } from "iconsax-reactjs";

import { cn } from "@/lib/utils";

import type { FilterOption } from "./filters";

type RequestFilterSelectProps<Value extends string> = {
  /** Announced name of the control; the trigger itself shows only the value. */
  label: string;
  options: FilterOption<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
};

/**
 * One dropdown of the requests filter row, shared by Section, Status and Sort so
 * the three read and behave identically.
 *
 * Built on the same `@base-ui/react` primitives as the rest of the UI layer, so
 * the listbox gets real `role="option"` semantics, type-ahead and arrow-key
 * navigation instead of a div that only responds to a mouse.
 */
export function RequestFilterSelect<Value extends string>({
  label,
  options,
  value,
  onValueChange,
}: RequestFilterSelectProps<Value>) {
  return (
    <Select.Root
      // `Select.Value` renders the raw value unless the root is told the item
      // shape, so the trigger would read "all" instead of "All Status".
      items={options}
      value={value}
      onValueChange={(next) => onValueChange(next as Value)}
    >
      <Select.Trigger
        aria-label={label}
        className={cn(
          "inline-flex h-9 min-w-0 items-center justify-between gap-1.5 rounded-lg border border-input bg-input/30 px-2.5 text-xs font-medium text-foreground",
          "transition-colors outline-none hover:bg-input/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
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

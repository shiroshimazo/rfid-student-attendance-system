"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Calendar, CloseCircle } from "iconsax-reactjs";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  buildReportSnapshot,
  customPeriod,
  formatDateRange,
  parseIsoDate,
  periodForPreset,
  type ReportPeriod,
  type ReportPreset,
} from "@/lib/mock-data/attendance-reports";
import { cn } from "@/lib/utils";

import { RangeCalendar } from "./RangeCalendar";

type ReportPeriodDialogProps = {
  open: boolean;
  period: ReportPeriod;
  seedPreset: ReportPreset | null;
  onOpenChange: (open: boolean) => void;
  onRunReport: (period: ReportPeriod) => void;
};

const presets: { id: ReportPreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function ReportPeriodDialog({
  open,
  period,
  seedPreset,
  onOpenChange,
  onRunReport,
}: ReportPeriodDialogProps) {
  const seeded = seedPreset ? periodForPreset(seedPreset) : period;
  const [draft, setDraft] = useState<ReportPeriod>(seeded);
  const [activeEndpoint, setActiveEndpoint] = useState<"start" | "end">("start");
  const [previousOpen, setPreviousOpen] = useState(open);
  const [month, setMonth] = useState(() => {
    const date = parseIsoDate(seeded.start);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  // Reset the draft only on the closed-to-open transition. Keeping this in
  // render avoids an effect pass that would briefly expose the previous draft.
  if (open !== previousOpen) {
    setPreviousOpen(open);
  }
  if (open && !previousOpen) {
    const next = seedPreset ? periodForPreset(seedPreset) : period;
    const nextMonth = parseIsoDate(next.start);
    setDraft(next);
    setActiveEndpoint("start");
    setMonth(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
  }

  const preview = useMemo(() => buildReportSnapshot(draft), [draft]);

  function selectPreset(preset: ReportPreset) {
    const next = periodForPreset(preset);
    const date = parseIsoDate(next.start);
    setDraft(next);
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  function selectDate(date: string) {
    if (activeEndpoint === "start") {
      const nextStart = date;
      const nextEnd = date > draft.end ? date : draft.end;
      setDraft(customPeriod(nextStart, nextEnd));
      setActiveEndpoint("end");
      return;
    }

    if (date < draft.start) {
      setDraft(customPeriod(date, draft.start));
      return;
    }

    setDraft(customPeriod(draft.start, date));
  }

  const selectedPreset = draft.kind === "custom" ? null : draft.kind;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 min-h-dvh bg-brand-base/75 backdrop-blur-[2px] transition-opacity duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex min-h-dvh items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4">
          <Dialog.Popup className="flex max-h-[95dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-card text-card-foreground shadow-2xl outline-none transition-[transform,opacity] duration-200 ease-out data-ending-style:translate-y-3 data-ending-style:opacity-0 data-starting-style:translate-y-3 data-starting-style:opacity-0 sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
              <div className="min-w-0">
                <Dialog.Title className="font-heading text-lg font-medium tracking-tight text-balance text-card-foreground">
                  Select Report Period
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-pretty text-muted-foreground">
                  Choose a preset or set a custom attendance reporting range.
                </Dialog.Description>
              </div>
              <Dialog.Close
                render={
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Close report period dialog"
                    className="size-11 sm:size-9"
                  >
                    <CloseCircle aria-hidden="true" />
                  </Button>
                }
              />
            </div>

            <div className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/40 p-1">
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={selectedPreset === preset.id ? "secondary" : "ghost"}
                    size="lg"
                    aria-pressed={selectedPreset === preset.id}
                    onClick={() => selectPreset(preset.id)}
                    className="min-h-11 sm:min-h-9"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <fieldset className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <legend className="sr-only">Custom date range</legend>
                {(["start", "end"] as const).map((endpoint) => {
                  const active = activeEndpoint === endpoint;
                  const value = draft[endpoint];

                  return (
                    <div key={endpoint}>
                      <p className="mb-1.5 text-[0.625rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                        {endpoint === "start" ? "Start Date" : "End Date"}
                      </p>
                      <button
                        type="button"
                        aria-label={`${endpoint === "start" ? "Start Date" : "End Date"}, ${dateFormatter.format(parseIsoDate(value))}`}
                        aria-pressed={active}
                        onClick={() => {
                          setActiveEndpoint(endpoint);
                          const date = parseIsoDate(value);
                          setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                        }}
                        className={cn(
                          "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border bg-input/30 px-3 text-left text-sm tabular-nums outline-none transition-[background-color,border-color,box-shadow] duration-150",
                          "hover:bg-input/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                          active ? "border-ring" : "border-input",
                        )}
                      >
                        {dateFormatter.format(parseIsoDate(value))}
                        <Calendar size={17} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                      </button>
                    </div>
                  );
                })}
              </fieldset>

              <div className="mt-4">
                <RangeCalendar
                  month={month}
                  start={draft.start}
                  end={draft.end}
                  activeEndpoint={activeEndpoint}
                  onMonthChange={setMonth}
                  onDateSelect={selectDate}
                />
              </div>

              <div className="mt-4 rounded-xl bg-muted/30 px-4 py-3" aria-live="polite">
                <p className="text-sm font-medium tabular-nums text-card-foreground">
                  {formatDateRange(draft.start, draft.end)}
                </p>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  {preview.recordCount.toLocaleString()} records selected
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
              <Dialog.Close
                render={
                  <Button variant="outline" size="lg" className="min-h-11 sm:min-h-9">
                    Cancel
                  </Button>
                }
              />
              <Button
                type="button"
                size="lg"
                onClick={() => {
                  onRunReport(draft);
                  onOpenChange(false);
                }}
                className="min-h-11 sm:min-h-9"
              >
                Run Report
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

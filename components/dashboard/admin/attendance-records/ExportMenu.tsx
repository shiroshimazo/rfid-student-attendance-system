"use client";

import * as React from "react";
import { Popover } from "@base-ui/react/popover";
import {
  Document,
  DocumentDownload,
  DocumentText,
  ExportCurve,
  type Icon,
} from "iconsax-reactjs";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExportFormat = "pdf" | "word" | "excel";

type ExportOption = {
  value: ExportFormat;
  label: string;
  icon: Icon;
};

const exportOptions: ExportOption[] = [
  { value: "pdf", label: "PDF", icon: DocumentText },
  { value: "word", label: "Word", icon: Document },
  { value: "excel", label: "Excel", icon: DocumentDownload },
];

const formatLabels: Record<ExportFormat, string> = {
  pdf: "PDF",
  word: "Word",
  excel: "Excel",
};

/**
 * The header's export selector. Picking a format is real local state; producing
 * the file is not — the project has no document generator yet, so the panel says
 * what was selected rather than pretending a download happened.
 */
export function ExportMenu() {
  const [format, setFormat] = React.useState<ExportFormat | null>(null);

  return (
    <Popover.Root
      onOpenChange={(open) => {
        // Reopening starts from a clean panel instead of showing the previous
        // session's selection as if it were still pending.
        if (!open) {
          setFormat(null);
        }
      }}
    >
      <Popover.Trigger
        className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
      >
        <ExportCurve data-icon="inline-start" aria-hidden="true" />
        Export
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="end" className="z-50">
          <Popover.Popup className="w-64 origin-[var(--transform-origin)] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none transition-[transform,opacity] duration-150 ease-out data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0">
            <Popover.Title className="font-heading text-sm font-medium tracking-tight text-card-foreground">
              Export Attendance Records
            </Popover.Title>
            <Popover.Description className="mt-1 text-xs text-pretty text-muted-foreground">
              Choose a format for the current records.
            </Popover.Description>

            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {exportOptions.map((option) => {
                const OptionIcon = option.icon;
                const selected = option.value === format;

                return (
                  <Button
                    key={option.value}
                    variant={selected ? "secondary" : "outline"}
                    size="sm"
                    aria-pressed={selected}
                    onClick={() => setFormat(option.value)}
                    className="h-auto flex-col gap-1 px-1 py-2"
                  >
                    <OptionIcon aria-hidden="true" />
                    {option.label}
                  </Button>
                );
              })}
            </div>

            {/*
              No file is written and nothing is fetched. Generation lands with the
              backend work, so the panel only reports the choice.
            */}
            <p
              aria-live="polite"
              className="mt-3 text-[0.6875rem] text-pretty text-muted-foreground"
            >
              {format === null
                ? "Select a format to continue."
                : `${formatLabels[format]} selected. Export runs once the records backend is connected.`}
            </p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

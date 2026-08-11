"use client";

import { Drawer } from "@base-ui/react/drawer";
import { Calendar, CloseCircle } from "iconsax-reactjs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AttendanceRecord } from "@/lib/mock-data/attendance-records";

import {
  activityLabels,
  formatRecordDateLong,
  initialsOf,
  missingValue,
  statusLabels,
  statusVariants,
} from "./labels";

type AttendanceDetailsDrawerProps = {
  /** The row the table last asked to view; `null` keeps the drawer closed. */
  record: AttendanceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type TimelineEvent = {
  activity: "in" | "out";
  time: string | null;
  device: string | null;
};

const fieldLabelClass = "text-[0.6875rem] text-muted-foreground";

const fieldValueClass = "mt-0.5 text-sm text-card-foreground";

/**
 * Read-only detail panel for one attendance record — the RFID UID lives here
 * rather than in the table, so the hardware identifier stays out of the default
 * view without becoming unreachable.
 *
 * Built on `@base-ui/react/drawer` with `swipeDirection="right"`: focus trapping,
 * `aria-modal`, Escape-to-close and the labelled title come from the primitive
 * instead of being re-implemented.
 */
export function AttendanceDetailsDrawer({
  record,
  open,
  onOpenChange,
}: AttendanceDetailsDrawerProps) {
  // The record is cleared by the board after the close transition, so a null
  // record while closing would otherwise blank the panel mid-animation.
  if (record === null) {
    return null;
  }

  const timeline: TimelineEvent[] = [
    { activity: "in", time: record.timeIn, device: record.inDevice },
    { activity: "out", time: record.timeOut, device: record.outDevice },
  ];

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 min-h-dvh bg-black/40 transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0" />

        {/*
          `justify-end` is what puts the panel on the right; on a phone the popup
          takes the full width instead, per the wireframe.
        */}
        <Drawer.Viewport className="fixed inset-0 flex items-stretch justify-end">
          <Drawer.Popup className="flex h-full w-full flex-col overflow-y-auto overscroll-contain border-border bg-card text-card-foreground outline-none transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] [transform:translateX(var(--drawer-swipe-movement-x))] data-ending-style:[transform:translateX(100%)] data-starting-style:[transform:translateX(100%)] data-swiping:select-none sm:w-[24rem] sm:border-l">
            <Drawer.Content className="flex min-h-full flex-col gap-5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Drawer.Title className="font-heading text-base font-medium tracking-tight text-card-foreground">
                    Attendance Details
                  </Drawer.Title>
                  <Drawer.Description className={fieldLabelClass}>
                    Recorded from the RFID reader logs.
                  </Drawer.Description>
                </div>

                <Drawer.Close
                  render={
                    <Button variant="ghost" size="icon-sm" aria-label="Close attendance details">
                      <CloseCircle aria-hidden="true" />
                    </Button>
                  }
                />
              </div>

              <div className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/40 p-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-xs font-medium text-muted-foreground"
                >
                  {initialsOf(record.student)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {record.student}
                  </p>
                  <p className="mt-0.5 truncate text-xs tabular-nums text-muted-foreground">
                    {record.studentId} · {record.section}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className={fieldLabelClass}>Attendance Date</dt>
                  <dd className={fieldValueClass}>
                    <span className="flex items-center gap-1.5">
                      <Calendar
                        size={14}
                        aria-hidden="true"
                        className="shrink-0 text-muted-foreground"
                      />
                      {formatRecordDateLong(record.date)}
                    </span>
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className={fieldLabelClass}>RFID Card</dt>
                  {/* Mock UID — the real value comes from the reader. */}
                  <dd className="mt-0.5 font-mono text-sm tabular-nums text-card-foreground">
                    {record.rfid}
                  </dd>
                </div>
              </dl>

              <section aria-labelledby="attendance-timeline-heading">
                <h3
                  id="attendance-timeline-heading"
                  className="font-heading text-xs font-medium tracking-tight text-card-foreground"
                >
                  Attendance Timeline
                </h3>

                <ol className="mt-3 flex flex-col gap-3">
                  {timeline.map((event) => (
                    <li key={event.activity} className="flex min-w-0 gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-card-foreground">
                          {activityLabels[event.activity]}
                        </p>
                        <p className="mt-0.5 text-sm tabular-nums text-card-foreground">
                          {event.time ?? missingValue}
                        </p>
                        <p className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">
                          {event.device ?? "No reader recorded"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <dl className="flex flex-col gap-3 border-t border-border pt-4">
                <div className="flex items-center justify-between gap-3">
                  <dt className={fieldLabelClass}>Status</dt>
                  <dd>
                    <Badge variant={statusVariants[record.status]}>
                      {statusLabels[record.status]}
                    </Badge>
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className={fieldLabelClass}>Correction</dt>
                  {/*
                    Read-only on purpose: reviewing and approving a correction is
                    backend work that is not part of this page.
                  */}
                  <dd className="mt-0.5 text-sm text-pretty text-card-foreground">
                    {record.correctionNote === null ? (
                      "No correction request"
                    ) : (
                      <>
                        Correction Requested
                        <span className="mt-1 block text-xs text-pretty text-muted-foreground">
                          {record.correctionNote}
                        </span>
                      </>
                    )}
                  </dd>
                </div>
              </dl>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

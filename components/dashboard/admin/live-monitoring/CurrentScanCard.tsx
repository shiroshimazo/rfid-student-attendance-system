import {
  CloseCircle,
  Cpu,
  InfoCircle,
  MessageText,
  ClipboardTick,
  TickCircle,
  Wifi,
} from "iconsax-reactjs";

import { BentoCard } from "@/components/dashboard/BentoCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LiveScanEvent } from "@/lib/mock-data/live-monitoring";

import {
  attendanceLabels,
  initialsOf,
  resultLabels,
  resultVariants,
  smsLabels,
  statusLabels,
  statusVariants,
} from "./labels";

type CurrentScanCardProps = {
  /** `null` before anything is selected and before the first mock arrival. */
  scan: LiveScanEvent | null;
};

/** One labelled line of the detail list. */
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm text-card-foreground">
        {children}
      </dd>
    </div>
  );
}

export function CurrentScanCard({ scan }: CurrentScanCardProps) {
  return (
    <BentoCard
      title="Current Scan"
      description="Details of the selected event"
      headingLevel="h2"
      className="lg:col-span-2"
      contentClassName="flex flex-col"
    >
      {scan === null ? (
        <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center">
          <Wifi size={20} aria-hidden="true" className="text-muted-foreground" />
          <p className="text-sm font-medium text-card-foreground">
            No recent scan
          </p>
          <p className="text-xs text-pretty text-muted-foreground">
            Waiting for RFID activity...
          </p>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {/*
              Initials stand in for the student photo the real record will carry.
            */}
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-sm font-medium text-muted-foreground"
            >
              {initialsOf(scan.student)}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-card-foreground">
                {scan.student}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {scan.section}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariants[scan.status]}>
              {statusLabels[scan.status]}
            </Badge>
            <span className="text-xs tabular-nums text-muted-foreground">
              {scan.time}
            </span>
          </div>

          <dl className="min-w-0 divide-y divide-border/60 border-y border-border/60">
            <DetailRow label="RFID">
              <span className="font-mono text-xs">{scan.rfid}</span>
            </DetailRow>
            <DetailRow label="Reader">
              <span className="inline-flex items-center gap-1.5">
                <Cpu size={14} aria-hidden="true" className="text-muted-foreground" />
                {scan.device}
              </span>
            </DetailRow>
            <DetailRow label="Result">
              <Badge variant={resultVariants[scan.result]}>
                {resultLabels[scan.result]}
              </Badge>
            </DetailRow>
          </dl>

          {/*
            Processing outcomes. The icon repeats what the text already says, so
            state is never carried by the tint alone.
          */}
          <ul className="flex flex-col gap-2">
            {(
              [
                {
                  key: "attendance",
                  icon: ClipboardTick,
                  label: attendanceLabels[scan.attendance],
                  tone:
                    scan.attendance === "recorded"
                      ? "ok"
                      : scan.attendance === "duplicate-ignored"
                        ? "muted"
                        : "fault",
                },
                {
                  key: "sms",
                  icon: MessageText,
                  label: smsLabels[scan.sms],
                  tone:
                    scan.sms === "failed"
                      ? "fault"
                      : scan.sms === "not-sent"
                        ? "muted"
                        : "ok",
                },
              ] as const
            ).map((entry) => {
              const EntryIcon = entry.icon;
              const StateIcon =
                entry.tone === "ok"
                  ? TickCircle
                  : entry.tone === "fault"
                    ? CloseCircle
                    : InfoCircle;

              return (
                <li
                  key={entry.key}
                  className={cn(
                    "flex min-w-0 items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-xs",
                    entry.tone === "fault"
                      ? "text-destructive"
                      : "text-card-foreground",
                  )}
                >
                  <EntryIcon
                    size={14}
                    aria-hidden="true"
                    className={cn(
                      "shrink-0",
                      entry.tone === "fault" ? "" : "text-muted-foreground",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                  <StateIcon size={14} aria-hidden="true" className="shrink-0" />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </BentoCard>
  );
}

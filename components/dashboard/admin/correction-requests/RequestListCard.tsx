"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CorrectionRequest } from "@/lib/mock-data/correction-requests";

import {
  formatRequestDate,
  missingValue,
  statusLabels,
  statusVariants,
} from "./labels";

/** Shared field wording so the cards and the detail panel read the same. */
export const fieldLabelClass = "text-[0.6875rem] text-muted-foreground";

export const fieldValueClass = "mt-0.5 text-sm text-card-foreground";

/** `IN 7:32 AM • OUT 5:01 PM`, with a dash wherever the reader has nothing. */
export function formatTimePair(
  timeIn: string | null,
  timeOut: string | null,
): string {
  return `IN ${timeIn ?? missingValue} • OUT ${timeOut ?? missingValue}`;
}

/**
 * One request in a Quick Action drawer's list. The button label and the fields
 * below the header change with the status, but the frame is shared so the three
 * lists stay visually identical.
 */
export function RequestListCard({
  request,
  actionLabel,
  onAction,
}: {
  request: CorrectionRequest;
  actionLabel: string;
  onAction: (request: CorrectionRequest) => void;
}) {
  return (
    <li className="rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-muted/40">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-card-foreground">
            {request.student}
          </p>
          <p className="mt-0.5 truncate text-xs tabular-nums text-muted-foreground">
            {request.section} • {request.studentId}
          </p>
        </div>
        <Badge variant={statusVariants[request.status]}>
          {statusLabels[request.status]}
        </Badge>
      </div>

      <dl className="mt-3 flex flex-col gap-2.5">
        <div className="min-w-0">
          <dt className={fieldLabelClass}>Attendance Date</dt>
          <dd className={fieldValueClass}>{formatRequestDate(request.date)}</dd>
        </div>

        <div className="min-w-0">
          <dt className={fieldLabelClass}>Original</dt>
          <dd className="mt-0.5 text-sm tabular-nums text-card-foreground">
            {formatTimePair(request.originalTimeIn, request.originalTimeOut)}
          </dd>
        </div>

        <div className="min-w-0">
          <dt className={fieldLabelClass}>
            {request.status === "approved" ? "Corrected" : "Requested"}
          </dt>
          <dd className="mt-0.5 text-sm tabular-nums text-card-foreground">
            {formatTimePair(request.requestedTimeIn, request.requestedTimeOut)}
          </dd>
        </div>

        <div className="min-w-0">
          <dt className={fieldLabelClass}>Student Reason</dt>
          <dd className="mt-0.5 text-sm text-pretty text-card-foreground">
            “{request.reason}”
          </dd>
        </div>

        {request.rejectionReason === null ? null : (
          <div className="min-w-0">
            <dt className={fieldLabelClass}>Rejection Reason</dt>
            <dd className="mt-0.5 text-sm text-pretty text-card-foreground">
              {request.rejectionReason}
            </dd>
          </div>
        )}

        <div className="min-w-0">
          {/*
            A pending request has no reviewer yet, so the card falls back to when
            the student filed it.
          */}
          <dt className={fieldLabelClass}>
            {request.reviewedBy === null
              ? "Submitted"
              : request.status === "approved"
                ? "Approved By"
                : "Rejected By"}
          </dt>
          <dd className="mt-0.5 text-xs text-muted-foreground">
            {request.reviewedBy === null
              ? request.submittedAt
              : `${request.reviewedBy} · ${request.reviewedAt}`}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => onAction(request)}>
          {actionLabel}
          <span className="sr-only"> for {request.student}</span>
        </Button>
      </div>
    </li>
  );
}

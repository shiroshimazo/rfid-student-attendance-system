"use client";

import * as React from "react";
import { Drawer } from "@base-ui/react/drawer";
import { Field } from "@base-ui/react/field";
import { CloseCircle, TickCircle, Warning2 } from "iconsax-reactjs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CorrectionRequest } from "@/lib/mock-data/correction-requests";
import { cn } from "@/lib/utils";

import { useCorrectionRequests } from "./correction-requests-context";
import {
  formatRequestDate,
  initialsOf,
  missingValue,
  statusLabels,
  statusVariants,
  typeLabels,
} from "./labels";
import { fieldLabelClass } from "./RequestListCard";

type RequestDetailsDrawerProps = {
  /** The request last opened; `null` keeps the drawer closed. */
  request: CorrectionRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** IN / OUT pair, shown as its own two-row block in the detail panel. */
function TimeBlock({
  title,
  timeIn,
  timeOut,
}: {
  title: string;
  timeIn: string | null;
  timeOut: string | null;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-muted/40 p-3">
      <p className="text-xs font-medium text-card-foreground">{title}</p>
      <dl className="mt-2 flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <dt className={fieldLabelClass}>IN</dt>
          <dd className="text-sm tabular-nums text-card-foreground">
            {timeIn ?? missingValue}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className={fieldLabelClass}>OUT</dt>
          <dd className="text-sm tabular-nums text-card-foreground">
            {timeOut ?? missingValue}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * The full record for one request.
 *
 * A pending request gets Reject and Approve at the bottom; an approved or
 * rejected one is read-only, so neither button is rendered at all. Both
 * decisions are frontend state — see the provider.
 */
export function RequestDetailsDrawer({
  request,
  open,
  onOpenChange,
}: RequestDetailsDrawerProps) {
  const { approveRequest, rejectRequest } = useCorrectionRequests();

  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");

  // Reopening starts from the details rather than dropping the admin back into
  // a half-filled rejection form from the previous request.
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) {
        setRejecting(false);
        setReason("");
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  if (request === null) {
    return null;
  }

  // Captured after the guard: narrowing on a parameter does not reach into the
  // handlers below, and a const binding keeps them free of assertions.
  const active = request;
  const pending = active.status === "pending";

  function handleApprove() {
    approveRequest(active.id);
    handleOpenChange(false);
  }

  function handleReject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // The field is `required`, so an empty submit is stopped by validation
    // before it reaches here; the guard covers a whitespace-only reason.
    if (reason.trim() === "") {
      return;
    }

    rejectRequest(active.id, reason);
    handleOpenChange(false);
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={handleOpenChange}
      swipeDirection="right"
    >
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 min-h-dvh bg-brand-base/70 transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0" />

        <Drawer.Viewport className="fixed inset-0 flex items-stretch justify-end">
          <Drawer.Popup className="flex h-full w-full flex-col overflow-y-auto overscroll-contain border-border bg-card text-card-foreground outline-none transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] [transform:translateX(var(--drawer-swipe-movement-x))] data-ending-style:[transform:translateX(100%)] data-starting-style:[transform:translateX(100%)] data-swiping:select-none sm:w-[26rem] sm:border-l">
            <Drawer.Content className="flex min-h-full flex-col gap-5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Drawer.Title className="font-heading text-base font-medium tracking-tight text-card-foreground">
                    {pending ? "Review Request" : "Request Details"}
                  </Drawer.Title>
                  <Drawer.Description className={fieldLabelClass}>
                    {pending
                      ? "Approve or reject this correction request."
                      : "This request has already been reviewed."}
                  </Drawer.Description>
                </div>

                <Drawer.Close
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Close request details"
                    >
                      <CloseCircle aria-hidden="true" />
                    </Button>
                  }
                />
              </div>

              <section aria-labelledby="request-student-heading">
                <h3 id="request-student-heading" className="sr-only">
                  Student Information
                </h3>
                <div className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/40 p-3">
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-heading text-xs font-medium text-muted-foreground"
                  >
                    {initialsOf(request.student)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {request.student}
                    </p>
                    <p className="mt-0.5 truncate text-xs tabular-nums text-muted-foreground">
                      {request.studentId} · {request.section}
                    </p>
                  </div>
                  <Badge variant={statusVariants[request.status]}>
                    {statusLabels[request.status]}
                  </Badge>
                </div>
              </section>

              <dl className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <dt className={fieldLabelClass}>Attendance Date</dt>
                  <dd className="mt-0.5 text-sm text-card-foreground">
                    {formatRequestDate(request.date)}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className={fieldLabelClass}>Correction Type</dt>
                  <dd className="mt-0.5 text-sm text-card-foreground">
                    {typeLabels[request.type]}
                  </dd>
                </div>
              </dl>

              <section
                aria-labelledby="request-attendance-heading"
                className="flex flex-col gap-3"
              >
                <h3
                  id="request-attendance-heading"
                  className="font-heading text-xs font-medium tracking-tight text-card-foreground"
                >
                  Attendance Information
                </h3>

                <TimeBlock
                  title="Original Attendance"
                  timeIn={request.originalTimeIn}
                  timeOut={request.originalTimeOut}
                />
                <TimeBlock
                  title={
                    request.status === "approved"
                      ? "Corrected Attendance"
                      : "Requested Correction"
                  }
                  timeIn={request.requestedTimeIn}
                  timeOut={request.requestedTimeOut}
                />
              </section>

              <section aria-labelledby="request-reason-heading">
                <h3
                  id="request-reason-heading"
                  className="font-heading text-xs font-medium tracking-tight text-card-foreground"
                >
                  Student Reason
                </h3>
                <p className="mt-2 text-sm text-pretty text-card-foreground">
                  “{request.reason}”
                </p>
                <p className="mt-1.5 text-[0.6875rem] text-muted-foreground">
                  Submitted {request.submittedAt}
                </p>
              </section>

              {request.rejectionReason === null ? null : (
                <section aria-labelledby="request-rejection-heading">
                  <h3
                    id="request-rejection-heading"
                    className="flex items-center gap-1.5 font-heading text-xs font-medium tracking-tight text-card-foreground"
                  >
                    <Warning2
                      size={14}
                      aria-hidden="true"
                      className="shrink-0 text-muted-foreground"
                    />
                    Rejection Reason
                  </h3>
                  <p className="mt-2 text-sm text-pretty text-card-foreground">
                    {request.rejectionReason}
                  </p>
                </section>
              )}

              {request.reviewedBy === null ? null : (
                <dl className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <dt className={fieldLabelClass}>
                    {request.status === "approved" ? "Approved By" : "Rejected By"}
                  </dt>
                  <dd className="text-xs text-muted-foreground">
                    {request.reviewedBy} · {request.reviewedAt}
                  </dd>
                </dl>
              )}

              {/*
                Admin actions exist only while the request is pending. An approved
                or rejected request is read-only, so nothing below renders for it.
              */}
              {pending ? (
                <div className="mt-auto border-t border-border pt-4">
                  {rejecting ? (
                    <Field.Root
                      render={
                        <form
                          onSubmit={handleReject}
                          className="flex flex-col gap-2"
                        />
                      }
                    >
                      <Field.Label className="text-xs font-medium text-card-foreground">
                        Rejection Reason
                      </Field.Label>
                      <Field.Control
                        required
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Enter the reason for rejecting this request..."
                        render={<textarea rows={3} />}
                        className={cn(
                          "w-full resize-y rounded-lg border border-input bg-input/30 px-2.5 py-1.5 text-sm transition-colors outline-none",
                          "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                          "aria-invalid:border-destructive/50 aria-invalid:ring-3 aria-invalid:ring-destructive/40",
                        )}
                      />
                      <Field.Error
                        match="valueMissing"
                        className="text-xs text-destructive"
                      >
                        Enter a reason before rejecting this request.
                      </Field.Error>

                      <div className="mt-1 flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRejecting(false);
                            setReason("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" variant="destructive" size="sm">
                          Reject Request
                        </Button>
                      </div>
                    </Field.Root>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRejecting(true)}
                      >
                        <CloseCircle data-icon="inline-start" aria-hidden="true" />
                        Reject
                      </Button>
                      <Button size="sm" onClick={handleApprove}>
                        <TickCircle data-icon="inline-start" aria-hidden="true" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

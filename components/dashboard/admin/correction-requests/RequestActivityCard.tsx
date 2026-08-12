"use client";

import { ClipboardClose, ClipboardText, ClipboardTick } from "iconsax-reactjs";

import { BentoCard } from "@/components/dashboard/BentoCard";
import { ChartEmptyState } from "@/components/dashboard/charts/ChartEmptyState";
import type { RequestActivityKind } from "@/lib/mock-data/correction-requests";

import { useCorrectionRequests } from "./correction-requests-context";
import { activityLabels, formatRelativeMinutes } from "./labels";

/** One icon per event kind, so the row reads before its text does. */
const activityIcons = {
  submitted: ClipboardText,
  approved: ClipboardTick,
  rejected: ClipboardClose,
} as const satisfies Record<
  RequestActivityKind,
  typeof ClipboardText
>;

/**
 * Recent correction-request events, newest first. Approving or rejecting pushes
 * a "Just now" row onto the top of this list — frontend state only.
 */
export function RequestActivityCard() {
  const { activity } = useCorrectionRequests();

  return (
    <BentoCard
      title="Request Activity"
      description="Latest correction request events"
      headingLevel="h2"
      className="lg:col-span-4"
      contentClassName="flex flex-col"
    >
      {activity.length === 0 ? (
        <ChartEmptyState
          message="No correction request activity yet."
          icon={ClipboardText}
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {activity.map((event) => {
            const EventIcon = activityIcons[event.kind];

            return (
              <li
                key={event.id}
                className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
              >
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <EventIcon size={14} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-card-foreground">
                    {activityLabels[event.kind]}
                  </p>
                  <p className="truncate text-[0.6875rem] text-muted-foreground">
                    {event.student}
                  </p>
                </div>

                <span className="shrink-0 text-xs tabular-nums whitespace-nowrap text-muted-foreground">
                  {formatRelativeMinutes(event.minutesAgo)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </BentoCard>
  );
}

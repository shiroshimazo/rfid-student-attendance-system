"use client";

import { Chart } from "iconsax-reactjs";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from "recharts";

import { BentoCard } from "@/components/dashboard/BentoCard";
import { ChartEmptyState } from "@/components/dashboard/charts/ChartEmptyState";
import { ChartTooltip } from "@/components/dashboard/charts/ChartTooltip";
import { toPercent } from "@/components/dashboard/charts/chart-series";
import type { CorrectionStatus } from "@/lib/mock-data/correction-requests";

import { useCorrectionRequests } from "./correction-requests-context";
import { statusLabels, statusSeries, summarizeRequests } from "./labels";

type Slice = {
  id: CorrectionStatus;
  label: string;
  value: number;
  /**
   * Carried on the slice rather than derived in the tooltip: the tooltip only
   * ever receives the hovered datum, and this keeps it out of the render scope
   * that owns the running total.
   */
  share: number;
};

/**
 * Defined at module scope so hovering a slice does not remount the tooltip on
 * every parent render, the way an inline component would.
 */
function StatusTooltip({ active, payload }: TooltipContentProps) {
  const slice = payload?.[0]?.payload as Slice | undefined;

  if (!active || slice === undefined) {
    return null;
  }

  return (
    <ChartTooltip
      title={slice.label}
      rows={[
        {
          key: slice.id,
          label: "Requests",
          color: statusSeries[slice.id].color,
          value: slice.value,
          note: `· ${slice.share}%`,
        },
      ]}
    />
  );
}

/**
 * The status split of every request on the page. Slices are counted from the
 * same array the table renders, so approving a request moves the donut in the
 * same pass as the badge and the summary cards.
 */
export function RequestSummaryCard() {
  const { requests } = useCorrectionRequests();
  const totals = summarizeRequests(requests);

  const total = totals.total;

  // Approved first so the donut reads clockwise from the settled work.
  const slices: Slice[] = (
    [
      { id: "approved", label: statusLabels.approved, value: totals.approved },
      { id: "pending", label: statusLabels.pending, value: totals.pending },
      { id: "rejected", label: statusLabels.rejected, value: totals.rejected },
    ] satisfies Omit<Slice, "share">[]
  ).map((slice) => ({ ...slice, share: toPercent(slice.value, total) }));

  return (
    <BentoCard
      title="Request Summary"
      description="Status split"
      headingLevel="h2"
      className="lg:col-span-2"
      contentClassName="flex flex-col gap-4"
    >
      {total === 0 ? (
        <ChartEmptyState message="No correction requests yet." icon={Chart} />
      ) : (
        <>
          <div className="relative mx-auto h-40 w-full max-w-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/*
                  The centre total is an absolutely positioned sibling below, so
                  the tooltip needs a stacking context of its own to sit above it.
                */}
                <Tooltip content={StatusTooltip} wrapperStyle={{ zIndex: 10 }} />
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="66%"
                  outerRadius="100%"
                  paddingAngle={2}
                  strokeWidth={0}
                  isAnimationActive={false}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.id} fill={statusSeries[slice.id].color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-2xl font-medium tabular-nums text-card-foreground">
                {total}
              </span>
              <span className="text-[0.6875rem] text-muted-foreground">
                Total requests
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-1">
            {slices.map((slice) => (
              <div key={slice.id} className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: statusSeries[slice.id].color }}
                />
                <dt className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {slice.label}
                </dt>
                <dd className="shrink-0 text-xs tabular-nums text-card-foreground">
                  <span className="font-medium">{slice.value}</span>
                  <span className="ml-1 text-muted-foreground">
                    {slice.share}%
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </BentoCard>
  );
}

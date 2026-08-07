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
import {
  seriesMeta,
  toPercent,
} from "@/components/dashboard/charts/chart-series";
import { attendanceStatus } from "@/lib/mock-data/admin-dashboard";

/** Constant dataset, so the total is derived once at module scope. */
const total = attendanceStatus.reduce((sum, slice) => sum + slice.value, 0);

function StatusTooltip({
  active,
  payload,
}: TooltipContentProps) {
  const slice = payload?.[0]?.payload as
    | (typeof attendanceStatus)[number]
    | undefined;

  if (!active || !slice) {
    return null;
  }

  return (
    <ChartTooltip
      title={slice.label}
      rows={[
        {
          key: slice.id,
          label: "Students",
          color: seriesMeta[slice.id].color,
          value: slice.value,
          note: `· ${toPercent(slice.value, total)}%`,
        },
      ]}
    />
  );
}

export function AttendanceStatusCard() {
  return (
    <BentoCard
      title="Attendance Status"
      description="Today's attendance breakdown"
      className="lg:col-span-2"
      contentClassName="flex flex-col gap-4"
    >
      {total === 0 ? (
        <ChartEmptyState message="No attendance activity yet." icon={Chart} />
      ) : (
        <>
          <div className="relative mx-auto h-40 w-full max-w-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={StatusTooltip} />
                <Pie
                  data={attendanceStatus}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="66%"
                  outerRadius="100%"
                  paddingAngle={2}
                  strokeWidth={0}
                  isAnimationActive={false}
                >
                  {attendanceStatus.map((slice) => (
                    <Cell key={slice.id} fill={seriesMeta[slice.id].color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center total. Inert so it never intercepts a segment hover. */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-2xl font-medium tabular-nums text-card-foreground">
                {total.toLocaleString()}
              </span>
              <span className="text-[0.6875rem] text-muted-foreground">
                Total records
              </span>
            </div>
          </div>

          {/*
            A two-column list rather than a swatch row: each category needs its
            count and share beside it, and the label carries the meaning so the
            chart does not depend on color alone.
          */}
          <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-1">
            {attendanceStatus.map((slice) => (
              <div
                key={slice.id}
                className="flex min-w-0 items-center gap-2 text-xs"
              >
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: seriesMeta[slice.id].color }}
                  className="size-2 shrink-0 rounded-full"
                />
                <dt className="min-w-0 flex-1 truncate text-muted-foreground">
                  {slice.label}
                </dt>
                <dd className="shrink-0 tabular-nums text-card-foreground">
                  <span className="font-medium">{slice.value}</span>
                  <span className="ml-1 text-muted-foreground">
                    {toPercent(slice.value, total)}%
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

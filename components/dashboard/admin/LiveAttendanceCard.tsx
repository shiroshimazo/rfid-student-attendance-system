"use client";

import { Activity } from "iconsax-reactjs";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import { BentoCard } from "@/components/dashboard/BentoCard";
import { ChartEmptyState } from "@/components/dashboard/charts/ChartEmptyState";
import { ChartLegend } from "@/components/dashboard/charts/ChartLegend";
import { ChartTooltip } from "@/components/dashboard/charts/ChartTooltip";
import {
  seriesMeta,
  tickInterval,
} from "@/components/dashboard/charts/chart-series";
import {
  attendanceByRange,
  attendanceRanges,
  type AttendanceRange,
} from "@/lib/mock-data/admin-dashboard";

import { AttendanceRangeSelect } from "./AttendanceRangeSelect";

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };

function AttendanceTooltip({
  active,
  payload,
  label,
}: TooltipContentProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <ChartTooltip
      title={String(label)}
      rows={(["in", "out"] as const).map((key) => ({
        key,
        label: seriesMeta[key].label,
        color: seriesMeta[key].color,
        value: Number(
          payload.find((entry) => entry.dataKey === key)?.value ?? 0,
        ),
      }))}
    />
  );
}

export function LiveAttendanceCard() {
  const [range, setRange] = useState<AttendanceRange>("today");
  const data = attendanceByRange[range];

  const description =
    attendanceRanges.find((entry) => entry.id === range)?.description ??
    "IN and OUT activity over time";

  // The dataset is never trimmed; only the label density changes with it.
  const interval = useMemo(() => tickInterval(data.length), [data.length]);

  const totals = useMemo(
    () =>
      data.reduce(
        (accumulator, point) => ({
          in: accumulator.in + point.in,
          out: accumulator.out + point.out,
        }),
        { in: 0, out: 0 },
      ),
    [data],
  );

  return (
    <BentoCard
      title="Live Attendance Overview"
      description={description}
      className="lg:col-span-4"
      action={<AttendanceRangeSelect value={range} onValueChange={setRange} />}
      contentClassName="flex flex-col gap-3"
    >
      {data.length === 0 ? (
        <ChartEmptyState message="No attendance activity yet." icon={Activity} />
      ) : (
        <>
          <ChartLegend
            entries={(["in", "out"] as const).map((key) => ({
              key,
              label: seriesMeta[key].label,
              color: seriesMeta[key].color,
              value: totals[key],
            }))}
          />

          <div className="h-56 w-full sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 4, right: 8, bottom: 0, left: -18 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  interval={interval}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={4}
                />
                <YAxis
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  allowDecimals={false}
                />
                <Tooltip
                  content={AttendanceTooltip}
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="in"
                  name={seriesMeta.in.label}
                  stroke={seriesMeta.in.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="out"
                  name={seriesMeta.out.label}
                  stroke={seriesMeta.out.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </BentoCard>
  );
}

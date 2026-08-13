"use client";

import { useMemo } from "react";
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
import { ChartLegend } from "@/components/dashboard/charts/ChartLegend";
import { ChartTooltip } from "@/components/dashboard/charts/ChartTooltip";
import { tickInterval } from "@/components/dashboard/charts/chart-series";
import { Button } from "@/components/ui/button";
import type {
  AttendanceReportSnapshot,
  ReportPreset,
} from "@/lib/mock-data/attendance-reports";
import { cn } from "@/lib/utils";

import { reportSeriesMeta } from "./report-series";

type AttendancePerformanceCardProps = {
  snapshot: AttendanceReportSnapshot;
  selectedPreset: ReportPreset | null;
  onPresetChange: (preset: ReportPreset) => void;
};

const presets: { id: ReportPreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };

function PerformanceTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as
    | AttendanceReportSnapshot["points"][number]
    | undefined;

  if (!active || !point) {
    return null;
  }

  return (
    <ChartTooltip
      title={point.detail}
      rows={(Object.keys(reportSeriesMeta) as (keyof typeof reportSeriesMeta)[])
        .filter((key) => key !== "late")
        .map((key) => ({
          key,
          label: reportSeriesMeta[key].label,
          color: reportSeriesMeta[key].color,
          value: point[key],
        }))}
    />
  );
}

export function AttendancePerformanceCard({
  snapshot,
  selectedPreset,
  onPresetChange,
}: AttendancePerformanceCardProps) {
  const interval = useMemo(
    () => tickInterval(snapshot.points.length, 7),
    [snapshot.points.length],
  );

  return (
    <BentoCard
      title="Attendance Performance"
      description={`Present and absent attendance for ${snapshot.period.label.toLowerCase()}`}
      headingLevel="h2"
      className="lg:col-span-4"
      contentClassName="flex flex-col gap-4"
    >
      <ChartLegend
        entries={(Object.keys(reportSeriesMeta) as (keyof typeof reportSeriesMeta)[])
          .filter((key) => key !== "late")
          .map((key) => ({
            key,
            label: reportSeriesMeta[key].label,
            color: reportSeriesMeta[key].color,
            value: snapshot[key],
          }))}
      />

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={snapshot.points}
            margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
            title={`Attendance Performance — ${snapshot.period.label}`}
            desc="Interactive line chart comparing present and absent attendance over the selected reporting period."
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
              minTickGap={8}
            />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={44}
              allowDecimals={false}
            />
            <Tooltip
              content={PerformanceTooltip}
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="present"
              name="Present"
              stroke={reportSeriesMeta.present.color}
              strokeWidth={2}
              dot={{ r: 2, strokeWidth: 0 }}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="absent"
              name="Absent"
              stroke={reportSeriesMeta.absent.color}
              strokeWidth={2}
              dot={{ r: 2, strokeWidth: 0 }}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>Attendance performance data for {snapshot.period.label}</caption>
        <thead>
          <tr>
            <th scope="col">Date or time</th>
            <th scope="col">Present</th>
            <th scope="col">Absent</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.points.map((point) => (
            <tr key={point.detail}>
              <th scope="row">{point.detail}</th>
              <td>{point.present}</td>
              <td>{point.absent}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        className="grid grid-cols-3 gap-1 rounded-xl bg-muted/40 p-1 sm:w-fit"
        aria-label="Report period"
      >
        {presets.map((preset) => {
          const selected = selectedPreset === preset.id;

          return (
            <Button
              key={preset.id}
              type="button"
              variant={selected ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={selected}
              onClick={() => onPresetChange(preset.id)}
              className={cn("min-h-11 px-4 sm:min-h-9", selected && "shadow-sm")}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
    </BentoCard>
  );
}

"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from "recharts";

import { BentoCard } from "@/components/dashboard/BentoCard";
import { ChartTooltip } from "@/components/dashboard/charts/ChartTooltip";
import type { AttendanceReportSnapshot } from "@/lib/mock-data/attendance-reports";

import { reportSeriesMeta } from "./report-series";

type AttendanceStatusCardProps = {
  snapshot: AttendanceReportSnapshot;
};

type StatusSlice = {
  id: "present" | "absent";
  label: string;
  value: number;
};

function StatusTooltip({ active, payload }: TooltipContentProps) {
  const slice = payload?.[0]?.payload as StatusSlice | undefined;
  const total = Number(payload?.[0]?.payload?.total ?? 0);

  if (!active || !slice || total <= 0) {
    return null;
  }

  const percentage = (slice.value / total) * 100;

  return (
    <ChartTooltip
      title={slice.label}
      rows={[
        {
          key: slice.id,
          label: "Count",
          color: reportSeriesMeta[slice.id].color,
          value: slice.value,
          note: `· ${percentage.toFixed(1)}%`,
        },
      ]}
    />
  );
}

export function AttendanceStatusCard({ snapshot }: AttendanceStatusCardProps) {
  const total = snapshot.present + snapshot.absent;
  const data: (StatusSlice & { total: number })[] = [
    { id: "present", label: "Present", value: snapshot.present, total },
    { id: "absent", label: "Absent", value: snapshot.absent, total },
  ];

  return (
    <BentoCard
      title="Attendance Status"
      description={snapshot.period.label}
      headingLevel="h2"
      className="lg:col-span-2"
      contentClassName="flex flex-col gap-5"
    >
      <div className="relative mx-auto h-52 w-full max-w-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart
            title={`Attendance Status — ${snapshot.period.label}`}
            desc={`Donut chart showing ${snapshot.present.toLocaleString()} present and ${snapshot.absent.toLocaleString()} absent attendance records.`}
          >
            <Tooltip content={StatusTooltip} wrapperStyle={{ zIndex: 10 }} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive={false}
            >
              {data.map((slice) => (
                <Cell
                  key={slice.id}
                  fill={reportSeriesMeta[slice.id].color}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-3xl font-medium tabular-nums text-card-foreground">
            {snapshot.attendanceRate.toFixed(1)}%
          </span>
          <span className="mt-1 text-[0.6875rem] tracking-[0.16em] text-muted-foreground uppercase">
            Present
          </span>
        </div>
      </div>

      <dl className="space-y-2">
        {data.map((slice) => (
          <div key={slice.id} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              style={{ backgroundColor: reportSeriesMeta[slice.id].color }}
              className="size-2 shrink-0 rounded-full"
            />
            <dt className="min-w-0 flex-1 text-muted-foreground">
              {slice.label}
            </dt>
            <dd className="font-medium tabular-nums text-card-foreground">
              {slice.value.toLocaleString()}
              <span className="ml-1 font-normal text-muted-foreground">
                {total > 0 ? ((slice.value / total) * 100).toFixed(1) : "0.0"}%
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </BentoCard>
  );
}

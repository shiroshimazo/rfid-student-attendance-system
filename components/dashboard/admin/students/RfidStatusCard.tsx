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
import type { Student } from "@/lib/mock-data/students";

type RfidStatusCardProps = {
  students: Student[];
};

type RfidSlice = {
  id: "assigned" | "unassigned";
  label: string;
  value: number;
  total: number;
  color: string;
};

function RfidTooltip({ active, payload }: TooltipContentProps) {
  const slice = payload?.[0]?.payload as RfidSlice | undefined;

  if (!active || !slice) return null;

  const percent = slice.total > 0 ? (slice.value / slice.total) * 100 : 0;

  return (
    <ChartTooltip
      title={slice.label}
      rows={[
        {
          key: slice.id,
          label: "Students",
          color: slice.color,
          value: slice.value,
          note: `· ${percent.toFixed(1)}%`,
        },
      ]}
    />
  );
}

export function RfidStatusCard({ students }: RfidStatusCardProps) {
  const assigned = students.filter((student) => student.rfid !== null).length;
  const total = students.length;
  const data: RfidSlice[] = [
    {
      id: "assigned",
      label: "Assigned",
      value: assigned,
      total,
      color: "var(--success)",
    },
    {
      id: "unassigned",
      label: "Unassigned",
      value: total - assigned,
      total,
      color: "var(--series-none)",
    },
  ];

  return (
    <BentoCard
      title="RFID Status"
      description="Current card assignments"
      headingLevel="h2"
      contentClassName="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,0.8fr)] lg:grid-cols-[minmax(0,1fr)_minmax(9rem,0.8fr)]"
    >
      <div className="relative mx-auto h-44 w-full max-w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart
            title="RFID assignment status"
            desc={`Donut chart showing ${assigned.toLocaleString()} assigned and ${(total - assigned).toLocaleString()} unassigned students.`}
          >
            <Tooltip content={RfidTooltip} wrapperStyle={{ zIndex: 10 }} />
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
                <Cell key={slice.id} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-medium tabular-nums text-card-foreground">
            {total > 0 ? ((assigned / total) * 100).toFixed(1) : "0.0"}%
          </span>
          <span className="mt-1 text-[0.625rem] tracking-[0.14em] text-muted-foreground uppercase">
            Assigned
          </span>
        </div>
      </div>

      <dl className="space-y-2.5">
        {data.map((slice) => (
          <div key={slice.id} className="flex min-w-0 items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <dt className="min-w-0 flex-1 truncate text-muted-foreground">
              {slice.label}
            </dt>
            <dd className="shrink-0 font-medium tabular-nums text-card-foreground">
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

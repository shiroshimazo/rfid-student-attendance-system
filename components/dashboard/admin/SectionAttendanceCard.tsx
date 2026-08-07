"use client";

import { Chart2 } from "iconsax-reactjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { seriesMeta } from "@/components/dashboard/charts/chart-series";
import { sectionAttendance } from "@/lib/mock-data/admin-dashboard";

const stack = ["in", "out", "none"] as const;
const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };

function SectionTooltip({
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
      rows={stack.map((key) => ({
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

export function SectionAttendanceCard() {
  return (
    <BentoCard
      title="Section Attendance"
      description="Today's attendance across BSIT sections"
      className="lg:col-span-4"
      contentClassName="flex flex-col gap-3"
    >
      {sectionAttendance.length === 0 ? (
        <ChartEmptyState message="No attendance activity yet." icon={Chart2} />
      ) : (
        <>
          <ChartLegend
            entries={stack.map((key) => ({
              key,
              label: seriesMeta[key].label,
              color: seriesMeta[key].color,
            }))}
          />

          {/*
            Horizontal bars: five section labels read cleanly down the Y axis at
            every width, where vertical bars would crowd them on a narrow card.
          */}
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={sectionAttendance}
                barSize={16}
                margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  type="number"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="section"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                />
                <Tooltip
                  content={SectionTooltip}
                  cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }}
                />
                {stack.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    name={seriesMeta[key].label}
                    stackId="section"
                    fill={seriesMeta[key].color}
                    isAnimationActive={false}
                    // Only the outer ends of the stack get rounded.
                    radius={
                      index === 0
                        ? [4, 0, 0, 4]
                        : index === stack.length - 1
                          ? [0, 4, 4, 0]
                          : 0
                    }
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </BentoCard>
  );
}

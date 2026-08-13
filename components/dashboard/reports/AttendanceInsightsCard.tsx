import { ArrowDown, ArrowUp, Clock } from "iconsax-reactjs";

import { BentoCard } from "@/components/dashboard/BentoCard";
import type { AttendanceReportSnapshot } from "@/lib/mock-data/attendance-reports";

type AttendanceInsightsCardProps = {
  snapshot: AttendanceReportSnapshot;
};

export function AttendanceInsightsCard({ snapshot }: AttendanceInsightsCardProps) {
  const total = snapshot.present + snapshot.absent;
  const presentShare = total > 0 ? (snapshot.present / total) * 100 : 0;
  const absentShare = total > 0 ? (snapshot.absent / total) * 100 : 0;
  const change = snapshot.attendanceRate - snapshot.previousRate;
  const strongest = snapshot.sections[0];

  return (
    <BentoCard
      title="Attendance Insights"
      description="Supporting breakdown for selected period"
      headingLevel="h2"
      className="lg:col-span-4"
      contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      <div className="rounded-xl bg-muted/30 p-3.5">
        <p className="text-xs text-muted-foreground">Present share</p>
        <p className="mt-2 font-heading text-2xl font-medium tabular-nums text-card-foreground">
          {presentShare.toFixed(1)}%
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
          {change >= 0 ? (
            <ArrowUp size={13} aria-hidden="true" />
          ) : (
            <ArrowDown size={13} aria-hidden="true" />
          )}
          {Math.abs(change).toFixed(1)} points vs prior period
        </p>
      </div>

      <div className="rounded-xl bg-muted/30 p-3.5">
        <p className="text-xs text-muted-foreground">Absent share</p>
        <p className="mt-2 font-heading text-2xl font-medium tabular-nums text-card-foreground">
          {absentShare.toFixed(1)}%
        </p>
        <p className="mt-2 text-[0.6875rem] text-pretty text-muted-foreground">
          {snapshot.absent.toLocaleString()} of {total.toLocaleString()} expected records
        </p>
      </div>

      <div className="rounded-xl bg-muted/30 p-3.5">
        <p className="text-xs text-muted-foreground">Late arrivals</p>
        <p className="mt-2 font-heading text-2xl font-medium tabular-nums text-card-foreground">
          {snapshot.late.toLocaleString()}
        </p>
        <p className="mt-2 flex items-start gap-1.5 text-[0.6875rem] text-pretty text-muted-foreground">
          <Clock size={13} aria-hidden="true" className="mt-px shrink-0" />
          {strongest ? `${strongest.name} leads at ${strongest.rate.toFixed(1)}%.` : "No section data."}
        </p>
      </div>
    </BentoCard>
  );
}

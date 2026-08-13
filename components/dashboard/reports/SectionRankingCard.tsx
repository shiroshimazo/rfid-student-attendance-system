import { BentoCard } from "@/components/dashboard/BentoCard";
import type { AttendanceReportSnapshot } from "@/lib/mock-data/attendance-reports";

type SectionRankingCardProps = {
  snapshot: AttendanceReportSnapshot;
};

export function SectionRankingCard({ snapshot }: SectionRankingCardProps) {
  return (
    <BentoCard
      title="Section Ranking"
      description="Attendance rate by section"
      headingLevel="h2"
      className="lg:col-span-2"
    >
      <ol className="space-y-4">
        {snapshot.sections.map((section, index) => (
          <li key={section.name} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2.5">
            <span className="text-xs tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-card-foreground">
                {section.name}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-series-in"
                  style={{ width: `${section.rate}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium tabular-nums text-card-foreground">
              {section.rate.toFixed(1)}%
            </span>
          </li>
        ))}
      </ol>
    </BentoCard>
  );
}

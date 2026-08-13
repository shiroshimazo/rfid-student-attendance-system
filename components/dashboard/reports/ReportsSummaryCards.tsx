import {
  Clock,
  PercentageSquare,
  TickCircle,
  UserRemove,
  type Icon,
} from "iconsax-reactjs";

import type { AttendanceReportSnapshot } from "@/lib/mock-data/attendance-reports";

type ReportsSummaryCardsProps = {
  snapshot: AttendanceReportSnapshot;
};

type SummaryCard = {
  id: string;
  label: string;
  value: string;
  hint: string;
  icon: Icon;
};

export function ReportsSummaryCards({ snapshot }: ReportsSummaryCardsProps) {
  const change = snapshot.attendanceRate - snapshot.previousRate;
  const cards: SummaryCard[] = [
    {
      id: "attendance-rate",
      label: "Attendance Rate",
      value: `${snapshot.attendanceRate.toFixed(1)}%`,
      hint: `${change >= 0 ? "+" : ""}${change.toFixed(1)} pts vs prior period`,
      icon: PercentageSquare,
    },
    {
      id: "present",
      label: "Present",
      value: snapshot.present.toLocaleString(),
      hint: "Recorded attendances",
      icon: TickCircle,
    },
    {
      id: "absent",
      label: "Absent",
      value: snapshot.absent.toLocaleString(),
      hint: "Expected attendance missed",
      icon: UserRemove,
    },
    {
      id: "late",
      label: "Late",
      value: snapshot.late.toLocaleString(),
      hint: "Included in present count",
      icon: Clock,
    },
  ];

  return (
    <section aria-labelledby="reports-summary-heading">
      <h2 id="reports-summary-heading" className="sr-only">
        Report summary
      </h2>

      <ul className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => {
          const CardIcon = card.icon;

          return (
            <li
              key={card.id}
              className={
                index === 0
                  ? "min-w-0 rounded-2xl bg-card p-4 shadow-[0_1px_0_rgb(255_255_255/0.04)_inset,0_10px_30px_-24px_rgb(0_0_0/0.9)]"
                  : "min-w-0 rounded-2xl bg-card p-4 transition-colors duration-150 hover:bg-muted/40"
              }
            >
              <div className="flex items-center gap-2">
                <CardIcon
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-muted-foreground"
                />
                <p className="min-w-0 truncate text-xs text-muted-foreground">
                  {card.label}
                </p>
              </div>
              <p className="mt-3 font-heading text-3xl leading-none font-medium tabular-nums text-card-foreground">
                {card.value}
              </p>
              <p className="mt-2 truncate text-[0.6875rem] text-muted-foreground">
                {card.hint}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

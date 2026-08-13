import {
  Calendar,
  CalendarTick,
  Chart,
  type Icon,
} from "iconsax-reactjs";

import { BentoCard } from "@/components/dashboard/BentoCard";
import { Button } from "@/components/ui/button";
import type { ReportPreset } from "@/lib/mock-data/attendance-reports";

type ActionableReportsCardProps = {
  onSelect: (preset: ReportPreset) => void;
};

const reports: {
  preset: ReportPreset;
  label: string;
  description: string;
  icon: Icon;
}[] = [
  {
    preset: "today",
    label: "Daily Report",
    description: "Review a single day",
    icon: Calendar,
  },
  {
    preset: "week",
    label: "Weekly Report",
    description: "Compare seven days",
    icon: CalendarTick,
  },
  {
    preset: "month",
    label: "Monthly Report",
    description: "Analyze a full month",
    icon: Chart,
  },
];

export function ActionableReportsCard({ onSelect }: ActionableReportsCardProps) {
  return (
    <BentoCard
      title="Actionable Reports"
      description="Choose a report type, then confirm its reporting period"
      headingLevel="h2"
      className="lg:col-span-6"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {reports.map((report) => {
          const ReportIcon = report.icon;

          return (
            <Button
              key={report.preset}
              type="button"
              variant="outline"
              onClick={() => onSelect(report.preset)}
              className="h-auto min-h-16 justify-start gap-3 rounded-xl px-3 py-3 text-left whitespace-normal"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ReportIcon size={17} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {report.label}
                </span>
                <span className="mt-0.5 block text-[0.6875rem] font-normal text-muted-foreground">
                  {report.description}
                </span>
              </span>
            </Button>
          );
        })}
      </div>
    </BentoCard>
  );
}

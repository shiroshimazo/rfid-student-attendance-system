import {
  ClipboardText,
  Edit2,
  type Icon,
  LoginCurve,
  PercentageSquare,
  UserRemove,
} from "iconsax-reactjs";

import { attendanceRecords } from "@/lib/mock-data/attendance-records";

import { summarizeRecords } from "./labels";

type SummaryCard = {
  id: string;
  label: string;
  value: string;
  hint: string;
  icon: Icon;
};

/**
 * The five KPI cards above the records table. Counted from the same array the
 * table renders, so the numbers cannot drift away from the rows.
 */
export function AttendanceSummaryCards() {
  const summary = summarizeRecords(attendanceRecords);

  const cards: SummaryCard[] = [
    {
      id: "total-records",
      label: "Total Records",
      value: summary.total.toLocaleString(),
      hint: "Across all sections",
      icon: ClipboardText,
    },
    {
      id: "present",
      label: "Present",
      value: summary.present.toLocaleString(),
      hint: "Complete IN and OUT",
      icon: LoginCurve,
    },
    {
      id: "absent",
      label: "Absent",
      value: summary.absent.toLocaleString(),
      hint: "No scan recorded",
      icon: UserRemove,
    },
    {
      id: "corrections",
      label: "Corrections",
      value: summary.corrections.toLocaleString(),
      hint: "Awaiting review",
      icon: Edit2,
    },
    {
      id: "attendance-rate",
      label: "Attendance Rate",
      value: `${summary.rate}%`,
      hint: "Present over all records",
      icon: PercentageSquare,
    },
  ];

  return (
    <section aria-labelledby="attendance-summary-heading">
      <h2 id="attendance-summary-heading" className="sr-only">
        Attendance summary
      </h2>

      {/*
        Stacked on a phone, wrapped on a tablet, all five in one row on desktop —
        the cards wrap instead of shrinking below a readable width.
      */}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => {
          const CardIcon = card.icon;

          return (
            <li
              key={card.id}
              className="min-w-0 rounded-xl bg-card p-3.5 transition-colors hover:bg-muted/40"
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

              <p className="mt-2 font-heading text-2xl leading-none font-medium tabular-nums text-card-foreground">
                {card.value}
              </p>
              <p className="mt-1.5 truncate text-[0.6875rem] text-muted-foreground">
                {card.hint}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import {
  CardTick,
  Profile2User,
  ProfileRemove,
  ProfileTick,
  type Icon,
} from "iconsax-reactjs";

import type { Student } from "@/lib/mock-data/students";

type StudentsSummaryCardsProps = {
  students: Student[];
};

type SummaryCard = {
  id: string;
  label: string;
  value: number;
  hint: string;
  icon: Icon;
  iconClassName: string;
};

export function StudentsSummaryCards({ students }: StudentsSummaryCardsProps) {
  const active = students.filter((student) => student.status === "active").length;
  const assigned = students.filter((student) => student.rfid !== null).length;

  const cards: SummaryCard[] = [
    {
      id: "total",
      label: "Total Students",
      value: students.length,
      hint: "All enrolled profiles",
      icon: Profile2User,
      iconClassName: "text-muted-foreground",
    },
    {
      id: "active",
      label: "Active Students",
      value: active,
      hint: "Currently enrolled",
      icon: ProfileTick,
      iconClassName: "text-success",
    },
    {
      id: "inactive",
      label: "Inactive Students",
      value: students.length - active,
      hint: "Not currently active",
      icon: ProfileRemove,
      iconClassName: "text-warning",
    },
    {
      id: "rfid",
      label: "RFID Assigned",
      value: assigned,
      hint: `${students.length - assigned} awaiting a card`,
      icon: CardTick,
      iconClassName: "text-info",
    },
  ];

  return (
    <section aria-labelledby="students-summary-heading">
      <h2 id="students-summary-heading" className="sr-only">
        Student summary
      </h2>

      <ul className="grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const CardIcon = card.icon;

          return (
            <li
              key={card.id}
              className="min-w-0 rounded-2xl bg-card p-4 shadow-[0_1px_0_rgb(255_255_255/0.03)_inset]"
            >
              <div className="flex items-center gap-2">
                <CardIcon
                  size={17}
                  aria-hidden="true"
                  className={`shrink-0 ${card.iconClassName}`}
                />
                <p className="min-w-0 truncate text-xs text-muted-foreground">
                  {card.label}
                </p>
              </div>
              <p className="mt-3 font-heading text-3xl leading-none font-medium tabular-nums text-card-foreground">
                {card.value.toLocaleString()}
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

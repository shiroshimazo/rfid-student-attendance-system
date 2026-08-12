import {
  Activity,
  ClipboardTick,
  ClipboardText,
  ClipboardClose,
  type Icon,
} from "iconsax-reactjs";

type SummaryCard = {
  id: "pending" | "approved" | "rejected" | "total";
  label: string;
  value: number;
  hint: string;
  icon: Icon;
};

/**
 * The four headline numbers for the page. Each card's hint describes the status
 * in the same words the badges use, so the count and the row colour agree.
 */
export function CorrectionRequestsSummaryCards({
  pending,
  approved,
  rejected,
  total,
}: {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}) {
  const cards: SummaryCard[] = [
    {
      id: "pending",
      label: "Pending",
      value: pending,
      hint: "Awaiting review",
      icon: ClipboardText,
    },
    {
      id: "approved",
      label: "Approved",
      value: approved,
      hint: "Applied to attendance",
      icon: ClipboardTick,
    },
    {
      id: "rejected",
      label: "Rejected",
      value: rejected,
      hint: "Not applied",
      icon: ClipboardClose,
    },
    {
      id: "total",
      label: "Total",
      value: total,
      hint: "All requests",
      icon: Activity,
    },
  ];

  return (
    <section aria-labelledby="correction-summary-heading">
      <h2 id="correction-summary-heading" className="sr-only">
        Correction request summary
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <li
            key={card.id}
            className="min-w-0 rounded-xl bg-card p-3.5 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs text-muted-foreground">
                {card.label}
              </p>
              <card.icon
                size={16}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
            </div>
            <p className="mt-2 font-heading text-2xl leading-none font-medium tabular-nums text-card-foreground">
              {card.value}
            </p>
            <p className="mt-1.5 truncate text-[0.6875rem] text-muted-foreground">
              {card.hint}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

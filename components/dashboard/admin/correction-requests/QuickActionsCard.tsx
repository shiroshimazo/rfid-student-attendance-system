"use client";

import {
  ArrowRight2,
  ClipboardClose,
  ClipboardText,
  ClipboardTick,
  type Icon,
} from "iconsax-reactjs";

import { BentoCard } from "@/components/dashboard/BentoCard";
import type { CorrectionStatus } from "@/lib/mock-data/correction-requests";

type QuickAction = {
  status: CorrectionStatus;
  label: string;
  icon: Icon;
};

const quickActions: QuickAction[] = [
  { status: "pending", label: "Review Pending", icon: ClipboardText },
  { status: "approved", label: "View Approved", icon: ClipboardTick },
  { status: "rejected", label: "View Rejected", icon: ClipboardClose },
];

/**
 * The three shortcuts into the request lists. These open drawers rather than
 * navigating, so they are buttons — not links to a route.
 */
export function QuickActionsCard({
  counts,
  onOpen,
}: {
  counts: Record<CorrectionStatus, number>;
  onOpen: (status: CorrectionStatus) => void;
}) {
  return (
    <BentoCard
      title="Quick Actions"
      description="Open a request list"
      headingLevel="h2"
      className="lg:col-span-2"
      contentClassName="flex flex-col gap-2"
    >
      {quickActions.map((action) => (
        <button
          key={action.status}
          type="button"
          onClick={() => onOpen(action.status)}
          className="flex min-w-0 items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <action.icon
            size={16}
            aria-hidden="true"
            className="shrink-0 text-muted-foreground"
          />
          <span className="min-w-0 flex-1 truncate text-sm text-card-foreground">
            {action.label}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {counts[action.status]}
          </span>
          <ArrowRight2
            size={14}
            aria-hidden="true"
            className="shrink-0 text-muted-foreground"
          />
        </button>
      ))}
    </BentoCard>
  );
}

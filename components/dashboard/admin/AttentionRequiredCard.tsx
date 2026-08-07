import {
  ArrowRight2,
  Card,
  CloseCircle,
  Danger,
  Edit2,
  MessageRemove,
  TickCircle,
  type Icon,
} from "iconsax-reactjs";
import Link from "next/link";

import { BentoCard } from "@/components/dashboard/BentoCard";
import { ChartEmptyState } from "@/components/dashboard/charts/ChartEmptyState";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  attentionItems,
  type AttentionItem,
} from "@/lib/mock-data/admin-dashboard";

/**
 * Icon per item, kept beside the presentation. Only the two fault categories
 * get a destructive tint; the rest stay muted so the eye lands on the counts.
 */
const itemIcons: Record<AttentionItem["id"], Icon> = {
  "correction-requests": Edit2,
  "failed-sms": MessageRemove,
  "unassigned-cards": Card,
  "rejected-scans": CloseCircle,
  "offline-devices": Danger,
};

const faultTints = new Set<AttentionItem["id"]>(["failed-sms", "rejected-scans"]);

export function AttentionRequiredCard() {
  return (
    <BentoCard
      title="Attention Required"
      description="Items that may need your action"
      className="lg:col-span-2"
      contentClassName="flex flex-col"
    >
      {attentionItems.length === 0 ? (
        <ChartEmptyState message="Everything looks good." icon={TickCircle} />
      ) : (
        <ul className="flex flex-col">
          {attentionItems.map((item) => {
            const ItemIcon = itemIcons[item.id];
            const isFault = faultTints.has(item.id);

            /*
             * No route yet: render as an inert row so the count still reads but
             * nothing invites a dead click.
             */
            const rowClassName = cn(
              "-mx-2 flex w-[calc(100%+1rem)] min-w-0 items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
              item.href ? "hover:bg-muted/60" : "cursor-default",
            );

            const body = (
              <>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    isFault ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
                  )}
                >
                  <ItemIcon size={16} />
                </span>
                <span className="min-w-0 flex-1 truncate text-card-foreground">
                  {item.label}
                </span>
                <Badge variant="neutral">{item.count}</Badge>
                {/*
                  The chevron only appears where it means something. An inert
                  row keeps the space so every count stays on the same column.
                */}
                <ArrowRight2
                  size={14}
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 text-muted-foreground",
                    item.href ? "" : "invisible",
                  )}
                />
              </>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className={rowClassName}>
                    {body}
                  </Link>
                ) : (
                  <span aria-disabled="true" className={rowClassName}>
                    {body}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </BentoCard>
  );
}

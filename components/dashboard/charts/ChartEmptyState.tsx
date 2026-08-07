import type { Icon } from "iconsax-reactjs";

import { cn } from "@/lib/utils";

type ChartEmptyStateProps = {
  message: string;
  icon?: Icon;
  className?: string;
};

/**
 * Shown wherever a dataset comes back empty, so a card never collapses to a
 * bare heading. Sized to fill its parent rather than to a fixed height, which
 * keeps the bento row aligned whether the card has content or not.
 */
export function ChartEmptyState({
  message,
  icon: EmptyIcon,
  className,
}: ChartEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center",
        className,
      )}
    >
      {EmptyIcon ? (
        <EmptyIcon size={20} aria-hidden="true" className="text-muted-foreground" />
      ) : null}
      <p className="text-xs text-pretty text-muted-foreground">{message}</p>
    </div>
  );
}

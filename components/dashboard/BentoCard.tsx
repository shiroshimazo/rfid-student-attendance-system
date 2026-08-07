import { cn } from "@/lib/utils";

type BentoCardProps = {
  title: string;
  description?: string;
  /**
   * Upper-right slot for a control that belongs to this card — a range
   * selector, a "view all" link. Rendered inside the header row so it stays
   * aligned with the title on every breakpoint.
   */
  action?: React.ReactNode;
  /**
   * Heading level. The shell already owns the page `h1` and the dashboard owns
   * an `h2`, so cards default to `h3` and the outline stays well-formed.
   */
  headingLevel?: "h2" | "h3";
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

/**
 * The single surface every dashboard tile is built on.
 *
 * Grid placement is deliberately not a prop: the parent grid owns the spans, so
 * a card can be moved or resized without touching the card itself.
 */
export function BentoCard({
  title,
  description,
  action,
  headingLevel: Heading = "h3",
  className,
  contentClassName,
  children,
}: BentoCardProps) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5",
        "shadow-[0_1px_2px_-1px_rgb(0_0_0/0.06),0_2px_4px_0_rgb(0_0_0/0.04)]",
        className,
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <Heading className="font-heading text-sm font-medium tracking-tight text-balance text-card-foreground">
            {title}
          </Heading>
          {description ? (
            <p className="mt-0.5 text-xs text-pretty text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className={cn("mt-4 min-w-0 flex-1", contentClassName)}>
        {children}
      </div>
    </section>
  );
}

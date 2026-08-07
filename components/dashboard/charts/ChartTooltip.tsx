import { cn } from "@/lib/utils";

export type ChartTooltipRow = {
  key: string;
  label: string;
  /** Rendered as the swatch; a CSS color so it matches the SVG exactly. */
  color: string;
  value: number;
  /** Optional trailing note, e.g. a share of the total. */
  note?: string;
};

type ChartTooltipProps = {
  title: string;
  rows: ChartTooltipRow[];
  className?: string;
};

/**
 * Shared tooltip surface for every chart on the dashboard.
 *
 * Deliberately not a native `title` attribute: those cannot be styled, are
 * delayed, and never appear for keyboard users. Recharts renders this inside
 * its own positioned wrapper, so the component owns appearance only.
 */
export function ChartTooltip({ title, rows, className }: ChartTooltipProps) {
  return (
    <div
      role="tooltip"
      className={cn(
        "pointer-events-none min-w-36 rounded-xl border border-border bg-popover px-3 py-2 shadow-lg",
        className,
      )}
    >
      <p className="text-xs font-medium text-popover-foreground">{title}</p>

      <dl className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              style={{ backgroundColor: row.color }}
              className="size-2 shrink-0 rounded-full"
            />
            <dt className="min-w-0 flex-1 truncate text-muted-foreground">
              {row.label}
            </dt>
            <dd className="shrink-0 font-medium tabular-nums text-popover-foreground">
              {row.value.toLocaleString()}
              {row.note ? (
                <span className="ml-1 font-normal text-muted-foreground">
                  {row.note}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

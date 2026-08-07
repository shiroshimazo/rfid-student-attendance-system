import { cn } from "@/lib/utils";

export type ChartLegendEntry = {
  key: string;
  label: string;
  color: string;
  value?: number;
  note?: string;
};

type ChartLegendProps = {
  entries: ChartLegendEntry[];
  className?: string;
};

/**
 * Legend for the dashboard charts.
 *
 * Every entry carries its own text label, so the swatch is decoration rather
 * than the only carrier of meaning — the chart is still readable without color
 * perception.
 */
export function ChartLegend({ entries, className }: ChartLegendProps) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {entries.map((entry) => (
        <li key={entry.key} className="flex items-center gap-1.5 text-xs">
          <span
            aria-hidden="true"
            style={{ backgroundColor: entry.color }}
            className="size-2 shrink-0 rounded-full"
          />
          <span className="text-muted-foreground">{entry.label}</span>
          {entry.value === undefined ? null : (
            <span className="font-medium tabular-nums text-card-foreground">
              {entry.value.toLocaleString()}
            </span>
          )}
          {entry.note ? (
            <span className="text-muted-foreground">{entry.note}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

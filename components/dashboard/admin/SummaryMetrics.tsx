import {
  Card,
  type Icon,
  LoginCurve,
  LogoutCurve,
  MessageRemove,
  MessageTick,
  People,
} from "iconsax-reactjs";

import {
  summaryMetrics,
  type SummaryMetricId,
} from "@/lib/mock-data/admin-dashboard";

/**
 * Icon per metric. Kept beside the presentation rather than in the mock data so
 * the dataset stays serializable and free of component references.
 */
const metricIcons: Record<SummaryMetricId, Icon> = {
  "total-students": People,
  "in-today": LoginCurve,
  "out-today": LogoutCurve,
  "sms-sent": MessageTick,
  "sms-failed": MessageRemove,
  "active-cards": Card,
};

export function SummaryMetrics() {
  return (
    <section aria-labelledby="summary-metrics-heading">
      <h2 id="summary-metrics-heading" className="sr-only">
        Today&apos;s summary
      </h2>

      {/*
        Two columns on the smallest screens, then four, then all six on a wide
        desktop — the cards wrap instead of shrinking below a readable width.
      */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {summaryMetrics.map((metric) => {
          const MetricIcon = metricIcons[metric.id];

          return (
            <li
              key={metric.id}
              className="min-w-0 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-ring/40 hover:bg-muted/40"
            >
              <div className="flex items-center gap-2">
                <MetricIcon
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-muted-foreground"
                />
                <p className="min-w-0 truncate text-xs text-muted-foreground">
                  {metric.label}
                </p>
              </div>

              <p className="mt-2 font-heading text-2xl leading-none font-medium tabular-nums text-card-foreground">
                {metric.value.toLocaleString()}
              </p>
              <p className="mt-1.5 truncate text-[0.6875rem] text-muted-foreground">
                {metric.hint}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

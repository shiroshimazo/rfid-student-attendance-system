import {
  CloseCircle,
  type Icon,
  LoginCurve,
  LogoutCurve,
  MessageRemove,
  People,
  TickCircle,
} from "iconsax-reactjs";

import {
  liveMetrics,
  type LiveMetricId,
} from "@/lib/mock-data/live-monitoring";

/**
 * Icon per metric, kept beside the presentation so the dataset stays free of
 * component references. `Inside Now` uses People rather than a direction icon:
 * it is a headcount, not an event count.
 */
const metricIcons: Record<LiveMetricId, Icon> = {
  "in-today": LoginCurve,
  "out-today": LogoutCurve,
  "inside-now": People,
  "successful-scans": TickCircle,
  "rejected-scans": CloseCircle,
  "failed-sms": MessageRemove,
};

export function LiveMetrics() {
  return (
    <section aria-labelledby="live-metrics-heading">
      <h2 id="live-metrics-heading" className="sr-only">
        Today&apos;s scan totals
      </h2>

      {/*
        Two columns on the smallest screens, then three, then all six on a wide
        desktop — the cards wrap instead of shrinking below a readable width.
      */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {liveMetrics.map((metric) => {
          const MetricIcon = metricIcons[metric.id];

          return (
            <li
              key={metric.id}
              className="min-w-0 rounded-xl bg-card p-3.5 transition-colors hover:bg-muted/40"
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

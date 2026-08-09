import {
  CardRemove,
  Danger,
  type Icon,
  LogoutCurve,
  MessageRemove,
  Repeat,
  ShieldCross,
  TickCircle,
} from "iconsax-reactjs";

import { BentoCard } from "@/components/dashboard/BentoCard";
import { ChartEmptyState } from "@/components/dashboard/charts/ChartEmptyState";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { liveAlerts, type LiveAlertId } from "@/lib/mock-data/live-monitoring";

/**
 * Icon per alert, kept beside the presentation. Operational live issues only —
 * general Admin follow-up work belongs on the home dashboard, not here.
 */
const alertIcons: Record<LiveAlertId, Icon> = {
  "unassigned-rfid": CardRemove,
  "duplicate-tap": Repeat,
  "sms-failed": MessageRemove,
  "out-without-in": LogoutCurve,
  "invalid-rfid": ShieldCross,
  "offline-device": Danger,
};

/**
 * Categories that mean something is broken rather than merely noisy. A duplicate
 * tap is expected traffic; a failed SMS or a dead reader is a fault.
 */
const faultTints = new Set<LiveAlertId>([
  "sms-failed",
  "invalid-rfid",
  "offline-device",
]);

export function LiveAlertsCard() {
  return (
    <BentoCard
      title="Live Events Alerts"
      description="Operational issues seen in the current feed"
      headingLevel="h2"
      className="lg:col-span-4"
      contentClassName="flex flex-col"
    >
      {liveAlerts.length === 0 ? (
        <ChartEmptyState message="No live issues right now." icon={TickCircle} />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {liveAlerts.map((alert) => {
            const AlertIcon = alertIcons[alert.id];
            const isFault = faultTints.has(alert.id);

            return (
              <li
                key={alert.id}
                className="flex min-w-0 items-center gap-2.5 rounded-lg border border-border px-3 py-2.5"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    isFault
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <AlertIcon size={16} />
                </span>

                <span className="min-w-0 flex-1 truncate text-sm text-card-foreground">
                  {alert.label}
                </span>

                <Badge variant={isFault ? "destructive" : "neutral"}>
                  {alert.count}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </BentoCard>
  );
}

import { Cpu, Danger, Monitor, Wifi, WifiSquare } from "iconsax-reactjs";
import Link from "next/link";

import { BentoCard } from "@/components/dashboard/BentoCard";
import { ChartEmptyState } from "@/components/dashboard/charts/ChartEmptyState";
import { cn } from "@/lib/utils";
import { devices } from "@/lib/mock-data/admin-dashboard";

export function DeviceStatusCard() {
  return (
    <BentoCard
      title="Device Status"
      description="RFID readers reporting in"
      className="lg:col-span-2"
      contentClassName="flex flex-col"
      action={
        <Link
          href="/admin/device-monitoring"
          className="rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </Link>
      }
    >
      {devices.length === 0 ? (
        <ChartEmptyState message="No registered devices." icon={Monitor} />
      ) : (
        <ul className="flex flex-col gap-2">
          {devices.map((device) => {
            const isOnline = device.status === "online";
            const StatusIcon = isOnline ? Wifi : WifiSquare;

            return (
              <li
                key={device.id}
                className="flex min-w-0 items-center gap-2.5 rounded-lg border border-border px-3 py-2.5"
              >
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                >
                  <Cpu size={16} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-card-foreground">
                    {device.name}
                  </span>
                  {/*
                    Status is spelled out next to the icon, never carried by the
                    tint alone.
                  */}
                  <span
                    className={cn(
                      "mt-0.5 flex items-center gap-1 text-xs",
                      isOnline ? "text-muted-foreground" : "text-destructive",
                    )}
                  >
                    <StatusIcon size={12} aria-hidden="true" />
                    {isOnline ? "Online" : "Offline"}
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{device.lastSeen}</span>
                  </span>
                </span>

                <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[0.625rem] font-medium tracking-wide text-muted-foreground">
                  {device.mode}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {devices.some((device) => device.status === "offline") ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-destructive">
          <Danger size={14} aria-hidden="true" />
          One reader is not reporting.
        </p>
      ) : null}
    </BentoCard>
  );
}

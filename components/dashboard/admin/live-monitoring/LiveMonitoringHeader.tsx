"use client";

import { Pause, Play, SearchNormal1 } from "iconsax-reactjs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type LiveMonitoringHeaderProps = {
  query: string;
  onQueryChange: (query: string) => void;
  paused: boolean;
  onTogglePaused: () => void;
  /** `null` until the client clock has run, so the markup hydrates cleanly. */
  clock: string | null;
};

export function LiveMonitoringHeader({
  query,
  onQueryChange,
  paused,
  onTogglePaused,
  clock,
}: LiveMonitoringHeaderProps) {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-medium tracking-tight text-balance text-card-foreground">
          Live Monitoring
        </h1>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          Real Time RFID attendance activity
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-64">
          <SearchNormal1
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
          />
          <label htmlFor="live-monitoring-search" className="sr-only">
            Search students, RFID and sections
          </label>
          <Input
            id="live-monitoring-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search students, RFID, sections..."
            className="h-9 pl-8"
          />
        </div>

        <div className="flex items-center gap-3">
          {/*
            The dot is decorative; `aria-live` on the text means a screen reader
            hears the state change rather than the animation.
          */}
          <p
            aria-live="polite"
            className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className={cn(
                "relative flex size-2 shrink-0 rounded-full",
                paused ? "bg-muted-foreground" : "bg-series-out",
              )}
            >
              {paused ? null : (
                <span className="absolute inset-0 animate-ping rounded-full bg-series-out motion-reduce:animate-none" />
              )}
            </span>
            <span className="tracking-wide text-card-foreground">
              {paused ? "PAUSED" : "LIVE"}
            </span>
            {clock ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{clock}</span>
              </>
            ) : null}
          </p>

          <Button
            variant="outline"
            size="lg"
            onClick={onTogglePaused}
            aria-pressed={paused}
          >
            {paused ? (
              <Play data-icon="inline-start" aria-hidden="true" />
            ) : (
              <Pause data-icon="inline-start" aria-hidden="true" />
            )}
            {paused ? "Resume Feed" : "Pause Feed"}
          </Button>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DeviceStatusCard } from "@/components/dashboard/admin/DeviceStatusCard";
import {
  initialScanEvents,
  simulatedScanTemplates,
  type LiveScanEvent,
} from "@/lib/mock-data/live-monitoring";

import { CurrentScanCard } from "./CurrentScanCard";
import { filterScanEvents, type ActivityFilter } from "./filters";
import { LiveActivityCard } from "./LiveActivityCard";
import { LiveAlertsCard } from "./LiveAlertsCard";
import { LiveMetrics } from "./LiveMetrics";
import { LiveMonitoringHeader } from "./LiveMonitoringHeader";

/** Rows per page of the mock feed. Frontend-only pagination. */
const rowsPerPage = 5;

/** How often a simulated scan is appended while the feed is running. */
const arrivalIntervalMs = 6000;

/** How long a newly arrived row keeps its highlight. */
const highlightMs = 4000;

/** Newest events are capped so a long session cannot grow the list forever. */
const maxEvents = 60;

function formatClock(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Owns every piece of Live Monitoring state: the feed, the pause switch, the
 * filters, the pagination and the selection.
 *
 * TODO: Replace with Supabase Realtime data. Today the arrivals are a local
 * interval over a fixed template list — nothing is fetched, nothing is written,
 * and pausing only stops new rows from entering this view. The RFID readers,
 * attendance recording and SMS processing are untouched by it.
 */
export function LiveMonitoringBoard() {
  const [events, setEvents] = useState<LiveScanEvent[]>(initialScanEvents);
  const [paused, setPaused] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>(
    initialScanEvents[0]?.id ?? "",
  );
  const [newIds, setNewIds] = useState<ReadonlySet<string>>(new Set());
  // Null until the client clock ticks: the server has no meaningful "now", and
  // rendering one would mismatch on hydration.
  const [clock, setClock] = useState<string | null>(null);

  // Cursor into the template list, so successive arrivals differ.
  const arrivalIndex = useRef(0);

  // Header clock. Runs whether or not the feed is paused — pausing hides new
  // rows, it does not stop time. The first tick is scheduled rather than set in
  // the effect body, so mounting subscribes to the timer instead of kicking off
  // a second render pass.
  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));

    const firstTick = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);

    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, []);

  // Simulated arrivals.
  useEffect(() => {
    if (paused) {
      return;
    }

    const timer = window.setInterval(() => {
      const template =
        simulatedScanTemplates[
          arrivalIndex.current % simulatedScanTemplates.length
        ];
      arrivalIndex.current += 1;

      const id = `live-sim-${arrivalIndex.current}`;
      const event: LiveScanEvent = {
        ...template,
        id,
        time: formatClock(new Date()),
      };

      setEvents((previous) => [event, ...previous].slice(0, maxEvents));
      setNewIds((previous) => new Set(previous).add(id));

      window.setTimeout(() => {
        setNewIds((previous) => {
          if (!previous.has(id)) {
            return previous;
          }

          const next = new Set(previous);
          next.delete(id);
          return next;
        });
      }, highlightMs);
    }, arrivalIntervalMs);

    return () => window.clearInterval(timer);
  }, [paused]);

  const rows = useMemo(
    () => filterScanEvents(events, filter, query),
    [events, filter, query],
  );

  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));

  // A narrowing search or filter can strand the viewer past the last page.
  // Clamping during render avoids the extra pass an effect would schedule.
  const currentPage = Math.min(page, pageCount);
  if (currentPage !== page) {
    setPage(currentPage);
  }

  const start = (currentPage - 1) * rowsPerPage;
  const pageRows = rows.slice(start, start + rowsPerPage);

  /*
   * The panel follows the selection while it is still in view. When a filter or
   * search hides the selected row, the newest visible scan takes over so the
   * panel never describes something the operator cannot see; with nothing
   * matching at all it falls back to the empty state.
   */
  const selectedScan = useMemo(() => {
    const selected = rows.find((event) => event.id === selectedId);

    return selected ?? rows[0] ?? null;
  }, [rows, selectedId]);

  // Search and filter changes both restart pagination at page 1.
  const handleQueryChange = useCallback((next: string) => {
    setQuery(next);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((next: ActivityFilter) => {
    setFilter(next);
    setPage(1);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <LiveMonitoringHeader
        query={query}
        onQueryChange={handleQueryChange}
        paused={paused}
        onTogglePaused={() => setPaused((previous) => !previous)}
        clock={clock}
      />

      {/*
        Six equal columns on wide screens: the feed takes 4 and the side cards 2,
        so the bento reads as 2/3 + 1/3 rows rather than a uniform grid.
        Everything collapses to one column below `lg`, in the order the mobile
        priority calls for: metrics, activity, current scan, alerts, devices.
      */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        <div className="lg:col-span-6">
          <LiveMetrics />
        </div>

        <LiveActivityCard
          rows={pageRows}
          totalRows={rows.length}
          filter={filter}
          onFilterChange={handleFilterChange}
          page={currentPage}
          pageCount={pageCount}
          onPageChange={setPage}
          selectedId={selectedScan?.id ?? null}
          onSelect={setSelectedId}
          newIds={newIds}
          hasQuery={query.trim().length > 0}
        />
        <CurrentScanCard scan={selectedScan} />

        <LiveAlertsCard />
        {/*
          Reader health is hardware state, not feed state: this card is the same
          display-only component the home dashboard uses and `Pause Feed` never
          touches it.
        */}
        <DeviceStatusCard />
      </div>
    </div>
  );
}

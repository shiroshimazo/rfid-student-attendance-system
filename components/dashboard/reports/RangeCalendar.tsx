"use client";

import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";
import { useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { formatIsoDate } from "@/lib/mock-data/attendance-reports";
import { cn } from "@/lib/utils";

type RangeCalendarProps = {
  month: Date;
  start: string;
  end: string;
  activeEndpoint: "start" | "end";
  onMonthChange: (month: Date) => void;
  onDateSelect: (date: string) => void;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const dateLabelFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function shiftMonth(month: Date, amount: number) {
  return new Date(month.getFullYear(), month.getMonth() + amount, 1);
}

function dateInAdjacentMonth(date: Date, amount: number) {
  const first = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const lastDay = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate();

  return new Date(
    first.getFullYear(),
    first.getMonth(),
    Math.min(date.getDate(), lastDay),
  );
}

export function RangeCalendar({
  month,
  start,
  end,
  activeEndpoint,
  onMonthChange,
  onDateSelect,
}: RangeCalendarProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusedIso, setFocusedIso] = useState(
    activeEndpoint === "start" ? start : end,
  );
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth(),
    1 - firstDay.getDay(),
  );
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
    );
    const iso = formatIsoDate(date);

    return {
      date,
      iso,
      currentMonth: date.getMonth() === month.getMonth(),
      endpoint: iso === start || iso === end,
      inRange: iso >= start && iso <= end,
    };
  });
  const visibleFocusIso = days.some((day) => day.iso === focusedIso)
    ? focusedIso
    : activeEndpoint === "start" && days.some((day) => day.iso === start)
      ? start
      : activeEndpoint === "end" && days.some((day) => day.iso === end)
        ? end
        : days.find((day) => day.currentMonth)?.iso ?? days[0].iso;

  function focusDate(date: Date) {
    const iso = formatIsoDate(date);
    setFocusedIso(iso);

    if (
      date.getFullYear() !== month.getFullYear() ||
      date.getMonth() !== month.getMonth()
    ) {
      onMonthChange(new Date(date.getFullYear(), date.getMonth(), 1));
    }

    const focusButton = () => {
      gridRef.current
        ?.querySelector<HTMLButtonElement>(`[data-calendar-date="${iso}"]`)
        ?.focus();
    };

    focusButton();
    requestAnimationFrame(focusButton);
  }

  function navigateMonth(amount: number) {
    const nextMonth = shiftMonth(month, amount);
    setFocusedIso(formatIsoDate(nextMonth));
    onMonthChange(nextMonth);
  }

  function handleDateKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
    let nextDate: Date | null = null;

    switch (event.key) {
      case "ArrowLeft":
        nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
        break;
      case "ArrowRight":
        nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        break;
      case "ArrowUp":
        nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7);
        break;
      case "ArrowDown":
        nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
        break;
      case "Home":
        nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
        break;
      case "End":
        nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - date.getDay()));
        break;
      case "PageUp":
        nextDate = dateInAdjacentMonth(date, -1);
        break;
      case "PageDown":
        nextDate = dateInAdjacentMonth(date, 1);
        break;
      default:
        return;
    }

    event.preventDefault();
    focusDate(nextDate);
  }

  return (
    <section aria-label="Date range calendar" className="rounded-2xl bg-muted/25 p-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Previous month"
          onClick={() => navigateMonth(-1)}
          className="size-11 sm:size-9"
        >
          <ArrowLeft2 aria-hidden="true" />
        </Button>
        <p className="font-heading text-sm font-medium text-card-foreground" aria-live="polite">
          {monthFormatter.format(month)}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Next month"
          onClick={() => navigateMonth(1)}
          className="size-11 sm:size-9"
        >
          <ArrowRight2 aria-hidden="true" />
        </Button>
      </div>

      <div
        ref={gridRef}
        className="mt-2"
        role="grid"
        aria-label={monthFormatter.format(month)}
      >
        <div className="grid grid-cols-7" role="row">
          {weekdays.map((weekday) => (
            <div
              key={weekday}
              role="columnheader"
              className="py-2 text-center text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase"
            >
              {weekday}
            </div>
          ))}
        </div>

        {Array.from({ length: 6 }, (_, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-y-0.5" role="row">
            {days.slice(weekIndex * 7, weekIndex * 7 + 7).map((day) => (
              <div key={day.iso} role="gridcell" aria-selected={day.inRange}>
                <button
                  type="button"
                  data-calendar-date={day.iso}
                  tabIndex={day.iso === visibleFocusIso ? 0 : -1}
                  aria-label={`${activeEndpoint === "start" ? "Set start date to" : "Set end date to"} ${dateLabelFormatter.format(day.date)}`}
                  onFocus={() => setFocusedIso(day.iso)}
                  onKeyDown={(event) => handleDateKeyDown(event, day.date)}
                  onClick={() => {
                    setFocusedIso(day.iso);
                    onDateSelect(day.iso);
                  }}
                  className={cn(
                    "relative flex min-h-11 w-full items-center justify-center text-xs tabular-nums outline-none transition-[background-color,color,box-shadow] duration-150 sm:min-h-10",
                    "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                    !day.currentMonth && "text-muted-foreground/45",
                    day.currentMonth && !day.inRange && "text-card-foreground hover:bg-muted/70",
                    day.inRange && !day.endpoint && "bg-muted text-card-foreground",
                    day.endpoint && "z-[1] rounded-lg bg-primary font-medium text-primary-foreground",
                    day.iso === start && day.iso !== end && "rounded-l-lg",
                    day.iso === end && day.iso !== start && "rounded-r-lg",
                  )}
                >
                  {day.date.getDate()}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="mt-2 px-1 text-[0.6875rem] text-muted-foreground">
        Selecting {activeEndpoint === "start" ? "start" : "end"} date
      </p>
    </section>
  );
}

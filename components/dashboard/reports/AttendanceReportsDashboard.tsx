"use client";

import { Calendar } from "iconsax-reactjs";
import { useMemo, useState } from "react";

import {
  buildReportSnapshot,
  periodForPreset,
  type ReportPeriod,
  type ReportPreset,
} from "@/lib/mock-data/attendance-reports";

import { ActionableReportsCard } from "./ActionableReportsCard";
import { AttendanceInsightsCard } from "./AttendanceInsightsCard";
import { AttendancePerformanceCard } from "./AttendancePerformanceCard";
import { AttendanceStatusCard } from "./AttendanceStatusCard";
import { ReportExportMenu } from "./ReportExportMenu";
import { ReportPeriodDialog } from "./ReportPeriodDialog";
import { ReportsSummaryCards } from "./ReportsSummaryCards";
import { SectionRankingCard } from "./SectionRankingCard";

export function AttendanceReportsDashboard() {
  const [period, setPeriod] = useState<ReportPeriod>(() => periodForPreset("month"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPreset, setDialogPreset] = useState<ReportPreset | null>(null);
  const snapshot = useMemo(() => buildReportSnapshot(period), [period]);
  const selectedPreset = period.kind === "custom" ? null : period.kind;

  function openReportPeriod(preset: ReportPreset | null = null) {
    setDialogPreset(preset);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-medium tracking-tight text-balance text-card-foreground">
            Reports
          </h1>
          <p className="mt-1 text-sm text-pretty text-muted-foreground">
            Attendance reports and attendance analytics
          </p>
          <button
            type="button"
            onClick={() => openReportPeriod()}
            className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg text-xs tabular-nums text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:min-h-8"
          >
            <Calendar size={14} aria-hidden="true" />
            {period.label}
          </button>
        </div>

        <ReportExportMenu snapshot={snapshot} />
      </header>

      <ReportsSummaryCards snapshot={snapshot} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        <AttendancePerformanceCard
          snapshot={snapshot}
          selectedPreset={selectedPreset}
          onPresetChange={(preset) => setPeriod(periodForPreset(preset))}
        />
        <AttendanceStatusCard snapshot={snapshot} />
        <SectionRankingCard snapshot={snapshot} />
        <AttendanceInsightsCard snapshot={snapshot} />
        <ActionableReportsCard onSelect={openReportPeriod} />
      </div>

      <p className="sr-only" aria-live="polite">
        Report updated for {period.label}. {snapshot.recordCount.toLocaleString()} records shown.
      </p>

      <ReportPeriodDialog
        open={dialogOpen}
        period={period}
        seedPreset={dialogPreset}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setDialogPreset(null);
          }
        }}
        onRunReport={setPeriod}
      />
    </div>
  );
}

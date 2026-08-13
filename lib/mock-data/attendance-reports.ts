/**
 * Deterministic aggregate attendance data shared by Admin and Teacher reports.
 *
 * TODO: Replace the generators with Supabase aggregate queries. Keep dates as
 * local calendar values: parsing an ISO date with `new Date(value)` would turn
 * it into UTC and can move the displayed day in negative UTC offsets.
 */

export type ReportPreset = "today" | "week" | "month";

export type ReportPeriodKind = ReportPreset | "custom";

export type ReportPeriod = {
  kind: ReportPeriodKind;
  /** Inclusive ISO calendar date. */
  start: string;
  /** Inclusive ISO calendar date. */
  end: string;
  label: string;
};

export type ReportPoint = {
  /** Compact chart-axis label. */
  label: string;
  /** Full date or date/time for the tooltip. */
  detail: string;
  present: number;
  absent: number;
};

export type SectionReport = {
  name: string;
  present: number;
  absent: number;
  /** Late students are already included in `present`. */
  late: number;
  rate: number;
};

export type AttendanceReportSnapshot = {
  period: ReportPeriod;
  points: ReportPoint[];
  present: number;
  absent: number;
  /** Subset of `present`, never an additional attendance outcome. */
  late: number;
  attendanceRate: number;
  recordCount: number;
  sections: SectionReport[];
  previousRate: number;
};

type SectionProfile = {
  name: string;
  students: number;
  absenceBase: number;
  lateBase: number;
  phase: number;
};

type DailySectionReport = Omit<SectionReport, "rate">;

type DailyReport = {
  date: Date;
  present: number;
  absent: number;
  late: number;
  sections: DailySectionReport[];
};

const DEMO_TODAY = "2026-08-13";

const sectionProfiles: SectionProfile[] = [
  { name: "BSIT-1A", students: 42, absenceBase: 2, lateBase: 1, phase: 2 },
  { name: "BSIT-2A", students: 43, absenceBase: 2, lateBase: 2, phase: 5 },
  { name: "BSIT-3A", students: 44, absenceBase: 1, lateBase: 1, phase: 7 },
  { name: "BSIT-4A", students: 41, absenceBase: 2, lateBase: 2, phase: 11 },
  { name: "BSIT-4B", students: 45, absenceBase: 1, lateBase: 1, phase: 13 },
];

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

/** Parse YYYY-MM-DD at local midnight without an implicit UTC conversion. */
export function parseIsoDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new RangeError(`Invalid ISO date: ${value}`);
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = createLocalDate(year, monthIndex, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    throw new RangeError(`Invalid ISO date: ${value}`);
  }

  return date;
}

/** Format a Date from its local calendar fields. */
export function formatIsoDate(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Cannot format an invalid date");
  }

  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDateRange(start: string, end: string): string {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);

  if (endDate < startDate) {
    throw new RangeError("Report period end must be on or after its start");
  }

  if (start === end) {
    return fullDateFormatter.format(startDate);
  }

  return `${fullDateFormatter.format(startDate)} – ${fullDateFormatter.format(endDate)}`;
}

export function periodForPreset(preset: ReportPreset): ReportPeriod {
  switch (preset) {
    case "today":
      return {
        kind: "today",
        start: DEMO_TODAY,
        end: DEMO_TODAY,
        label: "Today",
      };
    case "week":
      return {
        kind: "week",
        start: "2026-08-10",
        end: "2026-08-16",
        label: "This Week",
      };
    case "month":
      return {
        kind: "month",
        start: "2026-08-01",
        end: "2026-08-31",
        label: "This Month",
      };
  }
}

export function customPeriod(start: string, end: string): ReportPeriod {
  const normalizedStart = formatIsoDate(parseIsoDate(start));
  const normalizedEnd = formatIsoDate(parseIsoDate(end));

  if (normalizedEnd < normalizedStart) {
    throw new RangeError("Report period end must be on or after its start");
  }

  return {
    kind: "custom",
    start: normalizedStart,
    end: normalizedEnd,
    label: formatDateRange(normalizedStart, normalizedEnd),
  };
}

export function buildReportSnapshot(
  period: ReportPeriod,
): AttendanceReportSnapshot {
  const start = parseIsoDate(period.start);
  const end = parseIsoDate(period.end);

  if (end < start) {
    throw new RangeError("Report period end must be on or after its start");
  }

  const dates = datesInRange(start, end);
  const reports = dates.map(buildDailyReport);
  const sections = summarizeSections(reports);
  const present = sections.reduce((sum, section) => sum + section.present, 0);
  const absent = sections.reduce((sum, section) => sum + section.absent, 0);
  const late = sections.reduce((sum, section) => sum + section.late, 0);
  const priorEnd = addLocalDays(start, -1);
  const priorStart = addLocalDays(priorEnd, 1 - dates.length);
  const priorReports = datesInRange(priorStart, priorEnd).map(buildDailyReport);
  const priorPresent = priorReports.reduce(
    (sum, report) => sum + report.present,
    0,
  );
  const priorAbsent = priorReports.reduce(
    (sum, report) => sum + report.absent,
    0,
  );

  return {
    period: { ...period },
    points: buildReportPoints(period.kind, reports),
    present,
    absent,
    late,
    attendanceRate: calculateRate(present, absent),
    recordCount: present + absent,
    sections,
    previousRate: calculateRate(priorPresent, priorAbsent),
  };
}

function buildDailyReport(date: Date): DailyReport {
  if (date > parseIsoDate(DEMO_TODAY) || date.getDay() === 0 || date.getDay() === 6) {
    return {
      date: copyLocalDate(date),
      present: 0,
      absent: 0,
      late: 0,
      sections: sectionProfiles.map(({ name }) => ({
        name,
        present: 0,
        absent: 0,
        late: 0,
      })),
    };
  }

  const daySeed =
    date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
  const sections = sectionProfiles.map((profile) => {
    const mondayPressure = date.getDay() === 1 && profile.phase % 2 === 1 ? 1 : 0;
    const fridayPressure = date.getDay() === 5 && profile.phase % 2 === 0 ? 1 : 0;
    const absent = Math.min(
      profile.students,
      profile.absenceBase +
        positiveModulo(daySeed + profile.phase * 7, 3) +
        mondayPressure +
        fridayPressure,
    );
    const present = profile.students - absent;
    const late = Math.min(
      present,
      profile.lateBase + positiveModulo(daySeed * 3 + profile.phase, 3),
    );

    return { name: profile.name, present, absent, late };
  });

  return {
    date: copyLocalDate(date),
    present: sections.reduce((sum, section) => sum + section.present, 0),
    absent: sections.reduce((sum, section) => sum + section.absent, 0),
    late: sections.reduce((sum, section) => sum + section.late, 0),
    sections,
  };
}

function summarizeSections(reports: DailyReport[]): SectionReport[] {
  return sectionProfiles
    .map(({ name }) => {
      const totals = reports.reduce(
        (result, report) => {
          const section = report.sections.find((item) => item.name === name);

          if (section) {
            result.present += section.present;
            result.absent += section.absent;
            result.late += section.late;
          }

          return result;
        },
        { present: 0, absent: 0, late: 0 },
      );

      return {
        name,
        ...totals,
        rate: calculateRate(totals.present, totals.absent),
      };
    })
    .sort((left, right) => right.rate - left.rate || left.name.localeCompare(right.name));
}

function buildReportPoints(
  kind: ReportPeriodKind,
  reports: DailyReport[],
): ReportPoint[] {
  if (kind === "today") {
    return buildTodayPoints(reports[0]);
  }

  const asOf = parseIsoDate(DEMO_TODAY);

  return reports
    .filter((report) => report.date <= asOf)
    .map((report) => ({
      label: pointLabel(kind, report.date),
      detail: fullDateFormatter.format(report.date),
      present: report.present,
      absent: report.absent,
    }));
}

function buildTodayPoints(report: DailyReport | undefined): ReportPoint[] {
  if (!report) {
    return [];
  }

  const checkpoints = [
    { label: "7 AM", presentShare: 0.09, absentShare: 0 },
    { label: "8 AM", presentShare: 0.64, absentShare: 0.18 },
    { label: "9 AM", presentShare: 0.94, absentShare: 1 },
    { label: "10 AM", presentShare: 0.98, absentShare: 1 },
    { label: "11 AM", presentShare: 0.99, absentShare: 1 },
    { label: "12 PM", presentShare: 1, absentShare: 1 },
    { label: "1 PM", presentShare: 1, absentShare: 1 },
  ];
  const dateLabel = fullDateFormatter.format(report.date);

  return checkpoints.map((checkpoint) => ({
    label: checkpoint.label,
    detail: `${dateLabel} · ${checkpoint.label}`,
    present: Math.round(report.present * checkpoint.presentShare),
    absent: Math.round(report.absent * checkpoint.absentShare),
  }));
}

function pointLabel(kind: ReportPeriodKind, date: Date): string {
  if (kind === "week") {
    return weekdayFormatter.format(date);
  }

  if (kind === "month") {
    return String(date.getDate());
  }

  return shortDateFormatter.format(date);
}

function datesInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];

  for (
    let date = copyLocalDate(start);
    date <= end;
    date = addLocalDays(date, 1)
  ) {
    dates.push(date);
  }

  return dates;
}

function copyLocalDate(date: Date): Date {
  return createLocalDate(date.getFullYear(), date.getMonth(), date.getDate());
}

function createLocalDate(year: number, monthIndex: number, day: number): Date {
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, monthIndex, day);
  return date;
}

function addLocalDays(date: Date, amount: number): Date {
  const result = copyLocalDate(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function calculateRate(present: number, absent: number): number {
  const total = present + absent;
  return total === 0 ? 0 : Math.round((present / total) * 1_000) / 10;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

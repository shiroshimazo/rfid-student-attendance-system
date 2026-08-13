"use client";

import { Popover } from "@base-ui/react/popover";
import {
  ArrowDown2,
  Document,
  DocumentDownload,
  DocumentText,
  ExportCurve,
  type Icon,
} from "iconsax-reactjs";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import type { AttendanceReportSnapshot } from "@/lib/mock-data/attendance-reports";
import { cn } from "@/lib/utils";

type ExportFormat = "pdf" | "word" | "excel";

type ExportOption = {
  value: ExportFormat;
  label: string;
  icon: Icon;
};

type ReportExportMenuProps = {
  snapshot: AttendanceReportSnapshot;
};

const exportOptions: ExportOption[] = [
  { value: "pdf", label: "PDF", icon: DocumentText },
  { value: "word", label: "Word", icon: Document },
  { value: "excel", label: "Excel", icon: DocumentDownload },
];

function downloadBlob(content: BlobPart, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function exportPdf(snapshot: AttendanceReportSnapshot, filename: string) {
  const { jsPDF } = await import("jspdf");
  const document = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  let y = 54;

  document.setFont("helvetica", "bold");
  document.setFontSize(18);
  document.text("Attendance Report", left, y);
  y += 22;
  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.text(snapshot.period.label, left, y);
  y += 28;

  const summary = [
    `Attendance Rate: ${snapshot.attendanceRate.toFixed(1)}%`,
    `Present: ${snapshot.present.toLocaleString()}`,
    `Absent: ${snapshot.absent.toLocaleString()}`,
    `Late: ${snapshot.late.toLocaleString()}`,
  ];
  summary.forEach((line) => {
    document.text(line, left, y);
    y += 16;
  });

  y += 14;
  document.setFont("helvetica", "bold");
  document.text("Attendance Performance", left, y);
  y += 18;
  document.setFont("helvetica", "normal");

  snapshot.points.forEach((point) => {
    if (y > 780) {
      document.addPage();
      y = 54;
    }
    document.text(
      `${point.detail}: ${point.present} present, ${point.absent} absent`,
      left,
      y,
    );
    y += 15;
  });

  document.save(filename);
}

async function exportWord(snapshot: AttendanceReportSnapshot, filename: string) {
  const {
    Document: WordDocument,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
  } = await import("docx");

  const headerRow = new TableRow({
    children: ["Date / Time", "Present", "Absent"].map(
      (value) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: value, bold: true })] })],
        }),
    ),
  });
  const dataRows = snapshot.points.map(
    (point) =>
      new TableRow({
        children: [point.detail, point.present, point.absent].map(
          (value) =>
            new TableCell({
              children: [new Paragraph(String(value))],
            }),
        ),
      }),
  );
  const document = new WordDocument({
    sections: [
      {
        children: [
          new Paragraph({ text: "Attendance Report", heading: HeadingLevel.TITLE }),
          new Paragraph(snapshot.period.label),
          new Paragraph(`Attendance Rate: ${snapshot.attendanceRate.toFixed(1)}%`),
          new Paragraph(`Present: ${snapshot.present.toLocaleString()}`),
          new Paragraph(`Absent: ${snapshot.absent.toLocaleString()}`),
          new Paragraph(`Late: ${snapshot.late.toLocaleString()}`),
          new Paragraph({ text: "Attendance Performance", heading: HeadingLevel.HEADING_1 }),
          new Table({ rows: [headerRow, ...dataRows] }),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(document);
  downloadBlob(
    blob,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    filename,
  );
}

async function exportExcel(snapshot: AttendanceReportSnapshot, filename: string) {
  const XLSX = await import("@e965/xlsx");
  const summaryRows = [
    ["Attendance Report", snapshot.period.label],
    ["Attendance Rate", snapshot.attendanceRate / 100],
    ["Present", snapshot.present],
    ["Absent", snapshot.absent],
    ["Late", snapshot.late],
    [],
    ["Date / Time", "Present", "Absent"],
    ...snapshot.points.map((point) => [point.detail, point.present, point.absent]),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(summaryRows);
  sheet["!cols"] = [{ wch: 30 }, { wch: 14 }, { wch: 14 }];
  if (sheet.B2) {
    sheet.B2.z = "0.0%";
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Attendance Report");
  const data = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  downloadBlob(
    data,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename,
  );
}

async function exportReport(
  format: ExportFormat,
  snapshot: AttendanceReportSnapshot,
) {
  const safePeriod = `${snapshot.period.start}_${snapshot.period.end}`;

  if (format === "pdf") {
    await exportPdf(snapshot, `attendance-report-${safePeriod}.pdf`);
  } else if (format === "word") {
    await exportWord(snapshot, `attendance-report-${safePeriod}.docx`);
  } else {
    await exportExcel(snapshot, `attendance-report-${safePeriod}.xlsx`);
  }
}

export function ReportExportMenu({ snapshot }: ReportExportMenuProps) {
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  async function handleExport(format: ExportFormat, label: string) {
    setExporting(format);
    setMessage(`Preparing ${label} export for ${snapshot.period.label}.`);

    try {
      await exportReport(format, snapshot);
      setMessage(`${label} report downloaded for ${snapshot.period.label}.`);
    } catch {
      setMessage(`${label} report could not be generated. Try again.`);
    } finally {
      setExporting(null);
    }
  }

  return (
    <>
      <Popover.Root>
        <Popover.Trigger
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "min-h-11 min-w-28 sm:min-h-9",
          )}
        >
          <ExportCurve data-icon="inline-start" aria-hidden="true" />
          Export
          <ArrowDown2 data-icon="inline-end" aria-hidden="true" />
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner sideOffset={6} align="end" className="z-40">
            <Popover.Popup className="w-64 origin-[var(--transform-origin)] rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-xl outline-none transition-[transform,opacity] duration-150 ease-out data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0">
              <div className="px-2 py-2">
                <Popover.Title className="font-heading text-sm font-medium tracking-tight text-card-foreground">
                  Export Report
                </Popover.Title>
                <Popover.Description className="mt-1 text-xs text-pretty text-muted-foreground">
                  {snapshot.period.label}
                </Popover.Description>
              </div>

              <div className="my-1 h-px bg-border" />

              <div className="flex flex-col gap-0.5">
                {exportOptions.map((option) => {
                  const OptionIcon = option.icon;
                  const active = exporting === option.value;

                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant="ghost"
                      size="lg"
                      disabled={exporting !== null}
                      onClick={() => void handleExport(option.value, option.label)}
                      className="min-h-11 justify-start sm:min-h-9"
                    >
                      <OptionIcon data-icon="inline-start" aria-hidden="true" />
                      {active ? `Preparing ${option.label}…` : option.label}
                    </Button>
                  );
                })}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <span className="sr-only" aria-live="polite">
        {message}
      </span>
    </>
  );
}

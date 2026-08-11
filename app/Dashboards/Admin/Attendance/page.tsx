import { AttendanceRecordsBoard } from "@/components/dashboard/admin/attendance-records/AttendanceRecordsBoard";
import { AttendanceSummaryCards } from "@/components/dashboard/admin/attendance-records/AttendanceSummaryCards";
import { ExportMenu } from "@/components/dashboard/admin/attendance-records/ExportMenu";

export default function AdminAttendancePage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-medium tracking-tight text-balance text-card-foreground">
            Attendance Records
          </h1>
          <p className="mt-1 text-sm text-pretty text-muted-foreground">
            View and review student attendance records
          </p>
        </div>

        <ExportMenu />
      </header>

      <AttendanceSummaryCards />

      <AttendanceRecordsBoard />
    </div>
  );
}

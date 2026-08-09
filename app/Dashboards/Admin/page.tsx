import { AttendanceStatusCard } from "@/components/dashboard/admin/AttendanceStatusCard";
import { AttentionRequiredCard } from "@/components/dashboard/admin/AttentionRequiredCard";
import { DashboardSearch } from "@/components/dashboard/admin/DashboardSearch";
import { DashboardSearchProvider } from "@/components/dashboard/admin/dashboard-search-context";
import { DeviceStatusCard } from "@/components/dashboard/admin/DeviceStatusCard";
import { LiveAttendanceCard } from "@/components/dashboard/admin/LiveAttendanceCard";
import { RecentActivityCard } from "@/components/dashboard/admin/RecentActivityCard";
import { SectionAttendanceCard } from "@/components/dashboard/admin/SectionAttendanceCard";
import { SummaryMetrics } from "@/components/dashboard/admin/SummaryMetrics";

export default function AdminDashboardPage() {
  return (
    <DashboardSearchProvider>
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-medium tracking-tight text-balance text-card-foreground">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-pretty text-muted-foreground">
              Overview of today&apos;s attendance activity
            </p>
          </div>

          <DashboardSearch />
        </header>

        {/*
          Six equal columns on wide screens: the large cards take 4 and the
          compact ones 2, so the bento reads as 2/3 + 1/3 rows rather than a
          uniform grid. Everything collapses to one column below `lg`.
        */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
          <div className="lg:col-span-6">
            <SummaryMetrics />
          </div>

          <LiveAttendanceCard />
          <AttendanceStatusCard />

          <RecentActivityCard />
          <AttentionRequiredCard />

          <SectionAttendanceCard />
          <DeviceStatusCard />
        </div>
      </div>
    </DashboardSearchProvider>
  );
}

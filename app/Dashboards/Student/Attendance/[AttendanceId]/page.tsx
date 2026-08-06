import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function StudentAttendanceDetailsPage({
  params,
}: PageProps<"/Dashboards/Student/Attendance/[AttendanceId]">) {
  const { AttendanceId: attendanceId } = await params;

  return (
    <RoutePlaceholder
      title="Attendance details"
      description={`Attendance ID: ${attendanceId}`}
    />
  );
}

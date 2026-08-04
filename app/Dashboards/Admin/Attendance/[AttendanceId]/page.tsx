import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function AdminAttendanceDetailsPage({
  params,
}: PageProps<"/Admin/Attendance/[AttendanceId]">) {
  const { AttendanceId: attendanceId } = await params;

  return (
    <RoutePlaceholder
      title="Attendance details"
      description={`Attendance ID: ${attendanceId}`}
    />
  );
}

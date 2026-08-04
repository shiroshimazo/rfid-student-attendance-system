import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function TeacherAttendanceDetailsPage({
  params,
}: PageProps<"/Teacher/Attendance/[AttendanceId]">) {
  const { AttendanceId: attendanceId } = await params;

  return (
    <RoutePlaceholder
      title="Attendance details"
      description={`Attendance ID: ${attendanceId}`}
    />
  );
}

import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function AdminStudentDetailsPage({
  params,
}: PageProps<"/Dashboards/Admin/Students/[StudentId]">) {
  const { StudentId: studentId } = await params;

  return (
    <RoutePlaceholder
      title="Student details"
      description={`Student ID: ${studentId}`}
    />
  );
}

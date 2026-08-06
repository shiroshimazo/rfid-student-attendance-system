import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function EditStudentPage({
  params,
}: PageProps<"/Dashboards/Admin/Students/[StudentId]/Edit">) {
  const { StudentId: studentId } = await params;

  return (
    <RoutePlaceholder
      title="Edit student"
      description={`Student ID: ${studentId}`}
    />
  );
}

import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function TeacherStudentDetailsPage({
  params,
}: PageProps<"/Teacher/MyStudents/[StudentId]">) {
  const { StudentId: studentId } = await params;

  return (
    <RoutePlaceholder
      title="Student details"
      description={`Student ID: ${studentId}`}
    />
  );
}

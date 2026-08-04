import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function EditUserPage({
  params,
}: PageProps<"/Admin/Users/[UserId]/Edit">) {
  const { UserId: userId } = await params;

  return (
    <RoutePlaceholder
      title="Edit user"
      description={`User ID: ${userId}`}
    />
  );
}

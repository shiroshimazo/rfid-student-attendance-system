import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function UserDetailsPage({
  params,
}: PageProps<"/Admin/Users/[UserId]">) {
  const { UserId: userId } = await params;

  return (
    <RoutePlaceholder
      title="User details"
      description={`User ID: ${userId}`}
    />
  );
}

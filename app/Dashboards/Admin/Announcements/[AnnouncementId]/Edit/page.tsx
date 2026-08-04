import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function EditAnnouncementPage({
  params,
}: PageProps<"/Admin/Announcements/[AnnouncementId]/Edit">) {
  const { AnnouncementId: announcementId } = await params;

  return (
    <RoutePlaceholder
      title="Edit announcement"
      description={`Announcement ID: ${announcementId}`}
    />
  );
}

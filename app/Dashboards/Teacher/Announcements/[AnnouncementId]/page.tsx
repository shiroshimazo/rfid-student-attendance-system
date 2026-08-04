import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function TeacherAnnouncementDetailsPage({
  params,
}: PageProps<"/Teacher/Announcements/[AnnouncementId]">) {
  const { AnnouncementId: announcementId } = await params;

  return (
    <RoutePlaceholder
      title="Announcement details"
      description={`Announcement ID: ${announcementId}`}
    />
  );
}

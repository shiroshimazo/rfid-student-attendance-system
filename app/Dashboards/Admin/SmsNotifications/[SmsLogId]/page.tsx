import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function SmsLogDetailsPage({
  params,
}: PageProps<"/Admin/SmsNotifications/[SmsLogId]">) {
  const { SmsLogId: smsLogId } = await params;

  return (
    <RoutePlaceholder
      title="SMS log details"
      description={`SMS log ID: ${smsLogId}`}
    />
  );
}

import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function DeviceDetailsPage({
  params,
}: PageProps<"/Admin/DeviceMonitoring/[DeviceId]">) {
  const { DeviceId: deviceId } = await params;

  return (
    <RoutePlaceholder
      title="Device details"
      description={`Device ID: ${deviceId}`}
    />
  );
}

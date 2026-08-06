import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function AdminCorrectionRequestDetailsPage({
  params,
}: PageProps<"/Dashboards/Admin/CorrectionRequests/[RequestId]">) {
  const { RequestId: requestId } = await params;

  return (
    <RoutePlaceholder
      title="Correction request details"
      description={`Request ID: ${requestId}`}
    />
  );
}

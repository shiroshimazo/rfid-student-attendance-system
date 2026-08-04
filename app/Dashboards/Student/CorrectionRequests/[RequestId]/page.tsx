import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function StudentCorrectionRequestDetailsPage({
  params,
}: PageProps<"/Student/CorrectionRequests/[RequestId]">) {
  const { RequestId: requestId } = await params;

  return (
    <RoutePlaceholder
      title="Correction request details"
      description={`Request ID: ${requestId}`}
    />
  );
}

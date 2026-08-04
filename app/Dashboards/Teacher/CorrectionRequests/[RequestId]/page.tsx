import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function TeacherCorrectionRequestDetailsPage({
  params,
}: PageProps<"/Teacher/CorrectionRequests/[RequestId]">) {
  const { RequestId: requestId } = await params;

  return (
    <RoutePlaceholder
      title="Correction request details"
      description={`Request ID: ${requestId}`}
    />
  );
}

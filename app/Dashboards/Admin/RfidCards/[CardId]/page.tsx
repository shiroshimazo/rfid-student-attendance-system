import { RoutePlaceholder } from "@/app/_Components/routePlaceholder";

export default async function RfidCardDetailsPage({
  params,
}: PageProps<"/Admin/RfidCards/[CardId]">) {
  const { CardId: cardId } = await params;

  return (
    <RoutePlaceholder
      title="RFID card details"
      description={`Card ID: ${cardId}`}
    />
  );
}

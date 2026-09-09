import { RelationshipDetail } from "@/components/relationships/relationship-detail";

export default async function RelationshipPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const { contactId } = await params;
  return <RelationshipDetail contactId={contactId} />;
}

import { ConferenceBriefView } from "@/components/reports/conference-brief-view";

export default async function ConferenceBriefPage({
  params,
}: {
  params: Promise<{ conferenceId: string }>;
}) {
  const { conferenceId } = await params;
  return <ConferenceBriefView conferenceId={conferenceId} />;
}

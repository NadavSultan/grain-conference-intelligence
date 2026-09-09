import { ConferenceDetail } from "@/components/conferences/conference-detail";
import { Suspense } from "react";

export default async function ConferencePage({
  params,
}: {
  params: Promise<{ conferenceId: string }>;
}) {
  const { conferenceId } = await params;
  return (
    <Suspense fallback={<p className="workspace-loading">Loading conference…</p>}>
      <ConferenceDetail conferenceId={conferenceId} />
    </Suspense>
  );
}

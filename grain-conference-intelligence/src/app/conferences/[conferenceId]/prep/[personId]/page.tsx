import { Suspense } from "react";

import { OutreachProfile } from "@/components/prep/outreach-profile";

export default async function PrepPersonPage({
  params,
}: {
  params: Promise<{ conferenceId: string; personId: string }>;
}) {
  const { conferenceId, personId } = await params;
  return (
    <Suspense fallback={<p className="workspace-loading">Loading outreach profile…</p>}>
      <OutreachProfile conferenceId={conferenceId} personId={personId} />
    </Suspense>
  );
}

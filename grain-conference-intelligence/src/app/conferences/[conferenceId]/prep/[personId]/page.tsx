import { Suspense } from "react";

import { RelationshipDetail } from "@/components/relationships/relationship-detail";

export default async function PrepPersonPage({
  params,
}: {
  params: Promise<{ conferenceId: string; personId: string }>;
}) {
  const { personId } = await params;
  return (
    <Suspense fallback={<p className="workspace-loading">Loading outreach profile…</p>}>
      <RelationshipDetail contactId={personId} />
    </Suspense>
  );
}

import { CaptureView } from "@/components/capture/capture-view";

export default async function MeetingUpdatePage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  return <CaptureView meetingId={meetingId} />;
}

"use client";

import { Mic, Square } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useVoiceCapture, type VoiceCaptureResult } from "@/hooks/use-voice-capture";

const BUSY_LABEL: Record<string, string> = {
  transcribing: "Transcribing…",
  extracting: "Filling fields…",
};

export function VoiceCapturePanel({ onResult }: { onResult: (result: VoiceCaptureResult) => void }) {
  const { status, transcript, error, start, stop } = useVoiceCapture(onResult);
  const busy = status === "transcribing" || status === "extracting";
  const recording = status === "recording";

  return (
    <section className="voice-capture" aria-labelledby="voice-capture-title">
      <div className="voice-capture-head">
        <h3 id="voice-capture-title">Speak the lead</h3>
        <p className="provenance">
          Say the name, company, role, what you discussed, and the next step. Fields fill in for you
          to check. Nothing is saved until you choose Save encounter.
        </p>
      </div>
      <Button
        variant={recording ? "danger" : "primary"}
        onClick={recording ? stop : start}
        disabled={busy}
        aria-pressed={recording}
      >
        {recording ? <Square size={16} aria-hidden /> : <Mic size={16} aria-hidden />}
        {recording ? "Stop and fill fields" : "Record"}
      </Button>
      <p className="voice-capture-status" role="status">
        {recording
          ? "Recording. Press stop when you are done."
          : busy
            ? BUSY_LABEL[status]
            : status === "ready"
              ? "Fields filled from your recording. Check them before saving."
              : "Not recording."}
      </p>
      {error ? <Alert tone="warning">{error}</Alert> : null}
      {transcript ? (
        <div className="voice-transcript">
          <p className="eyebrow">What was heard</p>
          <p>{transcript}</p>
        </div>
      ) : null}
    </section>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  CaptureExtraction,
  CaptureExtractionField,
} from "@/features/capture/voice-extraction";

export type VoiceCaptureStatus =
  | "idle"
  | "recording"
  | "transcribing"
  | "extracting"
  | "ready"
  | "error";

export type VoiceCaptureResult = {
  transcript: string;
  extraction: CaptureExtraction;
  filled: CaptureExtractionField[];
};

const MESSAGES: Record<string, string> = {
  forbidden: "The request was rejected. Reload the page and try again.",
  not_configured: "Connect an OpenAI key in Settings to use voice capture.",
  usage_exhausted: "Voice capture allowance for this browser is used up. Type the fields instead.",
  invalid_credentials: "That OpenAI key was rejected. Replace it in Settings.",
  empty_transcript: "Nothing audible was recorded. Try again closer to the microphone.",
  invalid_schema: "The transcript could not be turned into fields. The text is kept below.",
  audio_too_large: "That recording is too long. Keep it under a minute.",
  provider_error: "Voice capture is unavailable right now. The transcript is kept below.",
};

export function isVoiceCaptureSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

function messageFor(code: string | undefined): string {
  return (code && MESSAGES[code]) || MESSAGES.provider_error;
}

export function useVoiceCapture(onResult: (result: VoiceCaptureResult) => void) {
  const [status, setStatus] = useState<VoiceCaptureStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => releaseStream, [releaseStream]);

  const process = useCallback(async (audio: Blob) => {
    setStatus("transcribing");
    setError(null);

    let heard = "";
    try {
      const form = new FormData();
      form.append("audio", audio, "capture.webm");
      const response = await fetch("/api/capture/transcribe", { method: "POST", body: form });
      const payload = await response.json();
      if (!payload?.ok) {
        setStatus("error");
        setError(messageFor(payload?.code));
        return;
      }
      heard = String(payload.transcript ?? "");
      setTranscript(heard);
    } catch {
      setStatus("error");
      setError(messageFor("provider_error"));
      return;
    }

    setStatus("extracting");
    try {
      const response = await fetch("/api/capture/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript: heard }),
      });
      const payload = await response.json();
      if (!payload?.ok) {
        setStatus("error");
        setError(messageFor(payload?.code));
        return;
      }
      onResultRef.current({
        transcript: heard,
        extraction: payload.extraction as CaptureExtraction,
        filled: (payload.filled ?? []) as CaptureExtractionField[],
      });
      setStatus("ready");
    } catch {
      setStatus("error");
      setError(messageFor("provider_error"));
    }
  }, []);

  const start = useCallback(async () => {
    if (!isVoiceCaptureSupported()) {
      setStatus("error");
      setError("This browser cannot record audio. Type the fields instead.");
      return;
    }
    setError(null);
    setTranscript("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        releaseStream();
        if (audio.size === 0) {
          setStatus("error");
          setError(messageFor("empty_transcript"));
          return;
        }
        void process(audio);
      };
      recorder.start();
      setStatus("recording");
    } catch {
      releaseStream();
      setStatus("error");
      setError("Microphone access was denied. Type the fields instead.");
    }
  }, [process, releaseStream]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setTranscript("");
    setError(null);
  }, []);

  return { status, transcript, error, start, stop, reset };
}

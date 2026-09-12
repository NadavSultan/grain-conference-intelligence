import { z } from "zod";

export const CAPTURE_EXTRACTION_MODEL_DEFAULT = "gpt-5.6-luna";
export const CAPTURE_TRANSCRIBE_MODEL_DEFAULT = "gpt-transcribe";

/** Voice capture runs on its own model pair, independent of the Copilot's OPENAI_MODEL. */
export function captureExtractionModel(): string {
  return process.env.OPENAI_CAPTURE_MODEL?.trim() || CAPTURE_EXTRACTION_MODEL_DEFAULT;
}

export function captureTranscribeModel(): string {
  return process.env.OPENAI_TRANSCRIBE_MODEL?.trim() || CAPTURE_TRANSCRIBE_MODEL_DEFAULT;
}

/**
 * Fields the model may fill from speech. `conferenceId` and `occurredAt` are
 * deliberately absent: a guessed date corrupts the encounter timeline that
 * warming/stalled eligibility reads, so both stay owned by application context.
 */
export const CAPTURE_EXTRACTION_FIELDS = [
  "name",
  "company",
  "role",
  "note",
  "email",
  "linkedIn",
  "nextStep",
] as const;

export type CaptureExtractionField = (typeof CAPTURE_EXTRACTION_FIELDS)[number];
export type CaptureExtraction = Record<CaptureExtractionField, string>;

export const CAPTURE_SYSTEM_PROMPT = [
  "You convert a salesperson's spoken note from a conference floor into structured fields.",
  "Rules:",
  "1. Use only what the speaker actually said. Never invent, complete, or infer a value.",
  "2. Return an empty string for any field the speaker did not state.",
  "3. Do not guess dates, times, or which conference this was. Those fields are not yours.",
  "4. `note` is a compact factual summary of what was discussed, in the speaker's own terms.",
  "5. `nextStep` is a commitment the speaker stated, not a suggestion you think would help.",
  "6. Spoken email addresses often arrive as words ('marcus at northwind dot com').",
  "   Render the literal address you heard. Do not repair or complete a partial address.",
  "7. Names and companies keep the speaker's pronunciation-based spelling. Do not correct them.",
].join("\n");

export function captureExtractionJsonSchema(): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: [...CAPTURE_EXTRACTION_FIELDS],
    properties: {
      name: { type: "string", description: "Full name of the person met. Empty if not spoken." },
      company: { type: "string", description: "Their company. Empty if not spoken." },
      role: { type: "string", description: "Their job title. Empty if not spoken." },
      note: { type: "string", description: "What was discussed. Empty if not spoken." },
      email: { type: "string", description: "Email address as spoken. Empty if not spoken." },
      linkedIn: { type: "string", description: "LinkedIn URL or handle. Empty if not spoken." },
      nextStep: { type: "string", description: "Committed follow-up. Empty if not spoken." },
    },
  };
}

export function captureUserPrompt(transcript: string): string {
  return `Spoken note:\n"""\n${transcript.trim()}\n"""`;
}

const extractionSchema = z.object({
  name: z.string(),
  company: z.string(),
  role: z.string(),
  note: z.string(),
  email: z.string(),
  linkedIn: z.string(),
  nextStep: z.string(),
});

export const EMPTY_EXTRACTION: CaptureExtraction = {
  name: "",
  company: "",
  role: "",
  note: "",
  email: "",
  linkedIn: "",
  nextStep: "",
};

export function parseCaptureExtraction(
  raw: unknown,
): { ok: true; extraction: CaptureExtraction } | { ok: false } {
  const parsed = extractionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false };
  return { ok: true, extraction: sanitizeCaptureExtraction(parsed.data) };
}

const SPOKEN_EMAIL = /\s+at\s+|\s+dot\s+/i;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalizes a dictated address ("marcus at northwind dot com") into an
 * address shape. Returns "" when the result is still not a plausible address:
 * a half-heard email must not reach the form, where it would look verified.
 */
export function normalizeSpokenEmail(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  let candidate = trimmed.toLowerCase();
  if (SPOKEN_EMAIL.test(candidate)) {
    candidate = candidate
      .replace(/\s+at\s+/gi, "@")
      .replace(/\s+dot\s+/gi, ".")
      .replace(/\s+/g, "");
  }
  candidate = candidate.replace(/[.,;]+$/, "");
  return EMAIL_SHAPE.test(candidate) ? candidate : "";
}

function normalizeLinkedIn(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /linkedin\.com/i.test(trimmed) ? trimmed : "";
}

/** Trims every field and drops values that do not hold their declared shape. */
export function sanitizeCaptureExtraction(extraction: CaptureExtraction): CaptureExtraction {
  return {
    name: extraction.name.trim(),
    company: extraction.company.trim(),
    role: extraction.role.trim(),
    note: extraction.note.trim(),
    email: normalizeSpokenEmail(extraction.email),
    linkedIn: normalizeLinkedIn(extraction.linkedIn),
    nextStep: extraction.nextStep.trim(),
  };
}

/** Fields the model actually populated — drives which inputs get flagged in the form. */
export function filledFields(extraction: CaptureExtraction): CaptureExtractionField[] {
  return CAPTURE_EXTRACTION_FIELDS.filter((field) => extraction[field].length > 0);
}

/**
 * A spoken email is hearsay. It reaches the saved encounter only after the rep
 * confirms it, so identity resolution never sees a half-heard address as if it
 * were verified. Typed addresses are unaffected.
 */
export function emailForSave(
  email: string,
  fromVoice: boolean,
  confirmed: boolean,
): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return undefined;
  if (fromVoice && !confirmed) return undefined;
  return trimmed;
}

import { describe, expect, it } from "vitest";

import {
  CAPTURE_EXTRACTION_FIELDS,
  EMPTY_EXTRACTION,
  captureExtractionJsonSchema,
  captureExtractionModel,
  captureTranscribeModel,
  emailForSave,
  filledFields,
  normalizeSpokenEmail,
  parseCaptureExtraction,
  sanitizeCaptureExtraction,
} from "./voice-extraction";

describe("capture extraction models", () => {
  it("defaults to gpt-5.6-luna and gpt-transcribe", () => {
    expect(captureExtractionModel()).toBe("gpt-5.6-luna");
    expect(captureTranscribeModel()).toBe("gpt-transcribe");
  });
});

describe("captureExtractionJsonSchema", () => {
  it("is strict-mode compatible: every field required, no extra properties", () => {
    const schema = captureExtractionJsonSchema() as {
      required: string[];
      additionalProperties: boolean;
      properties: Record<string, unknown>;
    };
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toEqual([...CAPTURE_EXTRACTION_FIELDS]);
    expect(Object.keys(schema.properties)).toEqual([...CAPTURE_EXTRACTION_FIELDS]);
  });

  it("never asks the model for a conference or a date", () => {
    const schema = captureExtractionJsonSchema() as { properties: Record<string, unknown> };
    expect(schema.properties).not.toHaveProperty("conferenceId");
    expect(schema.properties).not.toHaveProperty("occurredAt");
  });
});

describe("normalizeSpokenEmail", () => {
  it("converts a dictated address", () => {
    expect(normalizeSpokenEmail("marcus at northwind dot com")).toBe("marcus@northwind.com");
  });

  it("accepts an already-formed address", () => {
    expect(normalizeSpokenEmail("  Marcus@Northwind.com ")).toBe("marcus@northwind.com");
  });

  it("drops a half-heard address rather than repairing it", () => {
    expect(normalizeSpokenEmail("marcus at northwind")).toBe("");
    expect(normalizeSpokenEmail("something he said")).toBe("");
    expect(normalizeSpokenEmail("")).toBe("");
  });
});

describe("sanitizeCaptureExtraction", () => {
  it("trims fields and keeps a LinkedIn URL", () => {
    const result = sanitizeCaptureExtraction({
      ...EMPTY_EXTRACTION,
      name: "  Marcus Oyelaran ",
      linkedIn: "https://linkedin.com/in/marcus",
    });
    expect(result.name).toBe("Marcus Oyelaran");
    expect(result.linkedIn).toBe("https://linkedin.com/in/marcus");
  });

  it("drops a LinkedIn value that is not a LinkedIn URL", () => {
    const result = sanitizeCaptureExtraction({ ...EMPTY_EXTRACTION, linkedIn: "ask him later" });
    expect(result.linkedIn).toBe("");
  });
});

describe("parseCaptureExtraction", () => {
  it("rejects output missing a required field", () => {
    expect(parseCaptureExtraction({ name: "Marcus" }).ok).toBe(false);
    expect(parseCaptureExtraction("not json").ok).toBe(false);
    expect(parseCaptureExtraction(null).ok).toBe(false);
  });

  it("parses and sanitizes valid output", () => {
    const result = parseCaptureExtraction({
      ...EMPTY_EXTRACTION,
      name: "Marcus Oyelaran",
      company: "Northwind Payments",
      role: "VP Treasury",
      note: "EUR/USD exposure on the Brazil corridor",
      email: "marcus at northwind dot com",
      nextStep: "Send demo times next week",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.extraction.email).toBe("marcus@northwind.com");
    expect(result.extraction.linkedIn).toBe("");
  });
});

describe("filledFields", () => {
  it("lists only fields the speaker actually populated", () => {
    expect(filledFields({ ...EMPTY_EXTRACTION, name: "Marcus", note: "FX" })).toEqual([
      "name",
      "note",
    ]);
    expect(filledFields(EMPTY_EXTRACTION)).toEqual([]);
  });
});

describe("emailForSave", () => {
  it("withholds a spoken email until it is confirmed", () => {
    expect(emailForSave("marcus@northwind.com", true, false)).toBeUndefined();
  });

  it("saves a spoken email once confirmed", () => {
    expect(emailForSave("marcus@northwind.com", true, true)).toBe("marcus@northwind.com");
  });

  it("saves a typed email without confirmation", () => {
    expect(emailForSave("marcus@northwind.com", false, false)).toBe("marcus@northwind.com");
  });

  it("treats an empty field as absent", () => {
    expect(emailForSave("   ", false, true)).toBeUndefined();
  });
});

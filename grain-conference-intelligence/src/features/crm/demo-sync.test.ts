import { describe, expect, it } from "vitest";

import { createDemoWorkspace } from "@/data/demo-workspace";
import { PROFILES } from "@/data/prep-snapshots";
import { buildCrmPreview } from "@/features/crm/preview";
import { runDemoSync } from "@/features/crm/demo-sync";

describe("CRM preview and demo sync", () => {
  it("allows exact verified-email creation when CRM is not present", () => {
    const seed = createDemoWorkspace();
    const preview = buildCrmPreview({
      contact: seed.contacts.find((item) => item.id === "sam")!,
      crmState: "not_present",
      sourceKind: "prep",
      sourceId: "money-sam",
      conferenceName: "Money20/20 Europe",
      identityKind: "review",
    });
    expect(preview.canSync).toBe(false);

    const exact = buildCrmPreview({
      contact: {
        ...seed.contacts.find((item) => item.id === "sam")!,
        email: { value: "sam.jones@acmepayments.com", confidence: "verified" },
      },
      crmState: "not_present",
      sourceKind: "prep",
      sourceId: "money-sam",
      conferenceName: "Money20/20 Europe",
      identityKind: "exact",
    });
    expect(exact.canSync).toBe(true);
    expect(exact.protectedFields).toEqual(["owner", "lifecycle", "deal"]);
    expect(exact.fieldsToWrite.email).toBe("sam.jones@acmepayments.com");
  });

  it("blocks unresolved identity review", () => {
    const seed = createDemoWorkspace();
    const preview = buildCrmPreview({
      contact: seed.contacts.find((item) => item.id === "sam")!,
      crmState: "not_present",
      sourceKind: "prep",
      sourceId: "money-sam",
      conferenceName: "Money20/20 Europe",
      identityKind: "review",
    });
    expect(preview.canSync).toBe(false);
    expect(preview.blockedReason).toMatch(/review/i);
  });

  it("blocks account-owner and open-deal writes", () => {
    const seed = createDemoWorkspace();
    const owner = buildCrmPreview({
      contact: seed.contacts.find((item) => item.id === "david")!,
      crmState: "owned_by_other",
      sourceKind: "prep",
      sourceId: "money-david",
      conferenceName: "Money20/20 Europe",
      identityKind: "exact",
    });
    const deal = buildCrmPreview({
      contact: seed.contacts.find((item) => item.id === "marcus")!,
      crmState: "open_deal",
      sourceKind: "prep",
      sourceId: "euro-open-deal",
      conferenceName: "EuroFinance",
      identityKind: "exact",
    });
    expect(owner.canSync).toBe(false);
    expect(deal.canSync).toBe(false);
  });

  it("omits protected owner, lifecycle, and deal fields from the write set", () => {
    const seed = createDemoWorkspace();
    const preview = buildCrmPreview({
      contact: seed.contacts.find((item) => item.id === "marcus")!,
      crmState: "owned_by_me",
      sourceKind: "encounter",
      sourceId: "enc-marcus-money20-prior",
      conferenceName: "Money20/20 Europe",
      identityKind: "exact",
    });
    expect(preview.protectedFields).toEqual(["owner", "lifecycle", "deal"]);
    expect(preview.fieldsToWrite.owner).toBeUndefined();
    expect(preview.fieldsToWrite.lifecycle).toBeUndefined();
    expect(preview.fieldsToWrite.deal).toBeUndefined();
  });

  it("blocks unknown CRM lookup", () => {
    const seed = createDemoWorkspace();
    const preview = buildCrmPreview({
      contact: seed.contacts.find((item) => item.id === "marcus")!,
      crmState: "unknown",
      sourceKind: "prep",
      sourceId: "edge-unknown-crm",
      conferenceName: "EuroFinance",
      identityKind: "exact",
    });
    expect(preview.canSync).toBe(false);
    expect(preview.blockedReason).toMatch(/unknown/i);
    expect(preview.crmLabel).not.toMatch(/Not in HubSpot/i);
  });

  it("returns the stored result for a repeated idempotent request", () => {
    const seed = createDemoWorkspace();
    const request = {
      contactId: "marcus",
      sourceKind: "encounter" as const,
      sourceId: "enc-marcus-money20-prior",
      crmState: "owned_by_me" as const,
      identityKind: "exact" as const,
    };
    const first = runDemoSync(seed, request);
    const second = runDemoSync(first.state, request);
    expect(first.result.idempotencyKey).toBe("marcus:encounter:enc-marcus-money20-prior");
    expect(second.result.contactStep.status).toBe("reused");
    expect(second.result.noteStep.status).toBe("reused");
    expect(second.result.contactStep.id).toBe(first.result.contactStep.id);
    expect(second.result.noteStep.id).toBe(first.result.noteStep.id);
  });

  it("recovers from contact-created/note-failed without recreating the contact", () => {
    const seed = createDemoWorkspace();
    const request = {
      contactId: "marcus",
      sourceKind: "encounter" as const,
      sourceId: "enc-marcus-money20-prior",
      crmState: "owned_by_me" as const,
      identityKind: "exact" as const,
    };
    const first = runDemoSync(seed, { ...request, simulateNoteFailure: true });
    expect(first.result.contactStep.status).toBe("created");
    expect(first.result.noteStep.status).toBe("failed");
    expect(first.result.contactStep.id).toBeTruthy();
    expect(first.result.noteStep.id).toBeNull();

    const second = runDemoSync(first.state, request);
    expect(second.result.contactStep.status).toBe("reused");
    expect(second.result.contactStep.id).toBe(first.result.contactStep.id);
    expect(second.result.noteStep.status).toBe("created");
    expect(second.result.noteStep.id).toBeTruthy();
    const notes = Object.values(second.state.crmSimulations).filter(
      (item) => item.contactStep.id === first.result.contactStep.id && item.noteStep.status === "created",
    );
    expect(notes).toHaveLength(1);
  });

  it("does not invent an email for Priya", () => {
    const seed = createDemoWorkspace();
    const preview = buildCrmPreview({
      contact: seed.contacts.find((item) => item.id === "priya")!,
      crmState: "not_present",
      sourceKind: "prep",
      sourceId: "money-priya",
      conferenceName: "Money20/20 Europe",
      identityKind: "new",
    });
    expect(preview.canSync).toBe(false);
    expect(preview.fieldsToWrite.email).toBeUndefined();
    expect(PROFILES.priya.contact.email).toBeNull();
  });
});

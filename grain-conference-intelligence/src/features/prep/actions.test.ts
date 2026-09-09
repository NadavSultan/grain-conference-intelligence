import { describe, expect, it } from "vitest";

import { PROFILES } from "@/data/prep-snapshots";
import { canProspect } from "@/features/prep/actions";

describe("outreach action gates", () => {
  it("blocks David prospect drafts until coordination is acknowledged", () => {
    const blocked = canProspect({
      profile: PROFILES.david,
      crmState: "owned_by_other",
      acknowledgedAt: null,
    });
    const unlocked = canProspect({
      profile: PROFILES.david,
      crmState: "owned_by_other",
      acknowledgedAt: "2026-05-21T09:00:00.000Z",
    });

    expect(blocked.canDraftEmail).toBe(false);
    expect(blocked.canDraftLinkedIn).toBe(false);
    expect(blocked.canOpenEmail).toBe(false);
    expect(blocked.blockedReason).toMatch(/coordination/i);
    expect(unlocked.canDraftEmail).toBe(true);
    expect(unlocked.canOpenEmail).toBe(true);
    expect(unlocked.blockedReason).toBeNull();
  });

  it("does not let Sam open email or create an exact CRM contact from an inferred email", () => {
    const gate = canProspect({
      profile: PROFILES.sam,
      crmState: "not_present",
      acknowledgedAt: null,
    });

    expect(gate.canOpenEmail).toBe(false);
    expect(gate.canCreateExactCrm).toBe(false);
    expect(gate.canDraftLinkedIn).toBe(true);
    expect(gate.emailRestriction).toBe("inferred");
  });

  it("gives Priya no email action", () => {
    const gate = canProspect({
      profile: PROFILES.priya,
      crmState: "not_present",
      acknowledgedAt: null,
    });

    expect(gate.canDraftEmail).toBe(false);
    expect(gate.canOpenEmail).toBe(false);
    expect(gate.hasEmail).toBe(false);
    expect(gate.canDraftLinkedIn).toBe(true);
  });

  it("never treats an unknown CRM lookup as a new contact", () => {
    const gate = canProspect({
      profile: PROFILES.marcus,
      crmState: "unknown",
      acknowledgedAt: null,
    });

    expect(gate.crmIsNew).toBe(false);
    expect(gate.canCreateExactCrm).toBe(false);
    expect(gate.crmLabel).toBe("Unknown");
  });
});

import type { CrmState } from "@/domain/types";
import type { FullProfileId, PROFILES } from "@/data/prep-snapshots";

type Profile = (typeof PROFILES)[FullProfileId];

export interface ProspectGate {
  canDraftEmail: boolean;
  canDraftLinkedIn: boolean;
  canOpenEmail: boolean;
  canCreateExactCrm: boolean;
  hasEmail: boolean;
  emailRestriction: "verified" | "inferred" | "missing";
  crmIsNew: boolean;
  crmLabel: string;
  blockedReason: string | null;
}

export const RESEARCH_PROGRESS = [
  "Scanning event sources…",
  "Checking company signals…",
  "Matching against ICP…",
] as const;

export function crmLabel(state: CrmState): string {
  if (state === "not_present") return "Not in HubSpot";
  if (state === "owned_by_me") return "Owned by me";
  if (state === "owned_by_other") return "Owned by another rep";
  if (state === "open_deal") return "Open deal";
  return "Unknown";
}

export function canProspect(input: {
  profile: Profile;
  crmState: CrmState;
  acknowledgedAt: string | null;
}): ProspectGate {
  const email = input.profile.contact.email;
  const emailRestriction = email ? email.confidence : "missing";
  const hasEmail = email !== null;
  const coordinationBlocked =
    input.profile.requiresCoordination && input.acknowledgedAt === null;
  const blockedReason = coordinationBlocked
    ? "Prospect draft actions are blocked until coordination is acknowledged."
    : null;

  return {
    hasEmail,
    emailRestriction,
    canDraftEmail: Boolean(input.profile.drafts.email) && !coordinationBlocked,
    canDraftLinkedIn: Boolean(input.profile.drafts.linkedIn) && !coordinationBlocked,
    canOpenEmail: input.profile.actions.openEmail && !coordinationBlocked,
    canCreateExactCrm:
      input.profile.actions.exactCrmIdentity &&
      input.crmState !== "unknown" &&
      !coordinationBlocked,
    crmIsNew: input.crmState === "not_present",
    crmLabel: crmLabel(input.crmState),
    blockedReason,
  };
}

export function mailtoHref(email: string): string {
  return `mailto:${email}`;
}

export function linkedInHref(value: string): string {
  return value.startsWith("http") ? value : `https://${value}`;
}

export function slackHref(): string {
  return "https://slack.com/";
}

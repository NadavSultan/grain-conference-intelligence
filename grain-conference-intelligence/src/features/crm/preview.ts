import type { ContactRecord, CrmState } from "@/domain/types";
import { crmLabel } from "@/features/prep/actions";

export interface CrmPreviewInput {
  contact: ContactRecord;
  crmState: CrmState;
  sourceKind: "prep" | "encounter";
  sourceId: string;
  conferenceName: string;
  identityKind: "exact" | "review" | "new";
}

export interface CrmPreview {
  identityKind: "exact" | "review" | "new";
  contactName: string;
  company: string;
  sourceNote: string;
  conferenceContext: string;
  fieldsToWrite: Record<string, string>;
  protectedFields: ["owner", "lifecycle", "deal"];
  canSync: boolean;
  blockedReason: string | null;
  crmLabel: string;
}

export function buildCrmPreview(input: CrmPreviewInput): CrmPreview {
  const email = input.contact.email;
  const fieldsToWrite: Record<string, string> = {
    name: input.contact.name,
    company: input.contact.company,
    role: input.contact.role,
  };
  if (email?.confidence === "verified") {
    fieldsToWrite.email = email.value;
  }

  let blockedReason: string | null = null;
  if (input.identityKind === "review") {
    blockedReason = "Unresolved identity review blocks CRM create.";
  } else if (email?.confidence !== "verified") {
    blockedReason = "Exact verified email is required to create a CRM contact.";
  } else if (input.crmState === "unknown") {
    blockedReason = "Unknown CRM lookup is never treated as Not in HubSpot.";
  } else if (input.crmState === "owned_by_other") {
    blockedReason = "Account ownership blocks demo create/update.";
  } else if (input.crmState === "open_deal") {
    blockedReason = "An open deal blocks demo create/update.";
  }

  return {
    identityKind: input.identityKind,
    contactName: input.contact.name,
    company: input.contact.company,
    sourceNote: `${input.sourceKind}:${input.sourceId}`,
    conferenceContext: input.conferenceName,
    fieldsToWrite,
    protectedFields: ["owner", "lifecycle", "deal"],
    canSync: blockedReason === null,
    blockedReason,
    crmLabel: crmLabel(input.crmState),
  };
}

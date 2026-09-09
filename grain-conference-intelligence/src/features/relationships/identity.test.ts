import { describe, expect, it } from "vitest";

import { resolveIdentity, type IdentityContact } from "@/features/relationships/identity";

const contacts: IdentityContact[] = [
  {
    id: "sam",
    name: "Sam Jones",
    company: "Acme Payments",
    domain: "acmepayments.com",
    email: { value: "sam.jones@acmepayments.com", confidence: "inferred" },
    linkedIn: { value: "linkedin.com/in/samjones-treasury", confidence: "verified" },
  },
  {
    id: "david",
    name: "David Cohen",
    company: "Northwind Travel Group",
    domain: "northwindtravel.com",
    email: { value: "d.cohen@northwindtravel.com", confidence: "verified" },
    linkedIn: { value: "linkedin.com/in/davidcohen-cfo", confidence: "verified" },
  },
  {
    id: "nova-payments",
    name: "Alex Nova",
    company: "Nova Payments",
    domain: "nova-payments.example",
    email: { value: "alex@nova-payments.example", confidence: "verified" },
    linkedIn: { value: "linkedin.com/in/alex-nova-payments", confidence: "verified" },
  },
  {
    id: "nova-health",
    name: "Alex Nova",
    company: "Nova Health",
    domain: "nova-health.example",
    email: { value: "alex@nova-health.example", confidence: "verified" },
    linkedIn: { value: "linkedin.com/in/alex-nova-health", confidence: "verified" },
  },
];

describe("identity resolution", () => {
  it("matches an exact normalized verified email", () => {
    expect(
      resolveIdentity(
        { name: "David Cohen", email: "  D.Cohen@NorthwindTravel.com " },
        contacts,
      ),
    ).toEqual({ kind: "exact", contactId: "david" });
  });

  it("matches an exact normalized verified LinkedIn URL", () => {
    expect(
      resolveIdentity(
        {
          name: "David Cohen",
          linkedIn: "https://www.LinkedIn.com/in/davidcohen-cfo/",
        },
        contacts,
      ),
    ).toEqual({ kind: "exact", contactId: "david" });
  });

  it("does not auto-match an inferred email", () => {
    expect(
      resolveIdentity(
        { name: "Sam Jones", email: "sam.jones@acmepayments.com" },
        contacts,
      ),
    ).toEqual({ kind: "review", candidateIds: ["sam"] });
  });

  it("sends fuzzy name plus domain similarity to review", () => {
    expect(
      resolveIdentity({ name: "Sam Jones", company: "Acme Payments Ltd", domain: "acmepayments.com" }, contacts),
    ).toEqual({ kind: "review", candidateIds: ["sam"] });
  });

  it("requires review when exact identifiers point at different contacts", () => {
    expect(
      resolveIdentity(
        {
          name: "Mixed",
          email: "d.cohen@northwindtravel.com",
          linkedIn: "linkedin.com/in/samjones-treasury",
        },
        contacts,
      ),
    ).toMatchObject({ kind: "review" });
  });

  it("requires review for namesake domains", () => {
    expect(
      resolveIdentity({ name: "Alex Nova", domain: "nova-payments.example" }, contacts),
    ).toMatchObject({ kind: "review" });
  });

  it("keeps an exact verified email match through a job change", () => {
    expect(
      resolveIdentity(
        {
          name: "David Cohen",
          email: "d.cohen@northwindtravel.com",
          company: "NewCo Payments",
        },
        contacts,
      ),
    ).toEqual({ kind: "exact", contactId: "david" });
  });

  it("creates a new contact when no identifiers or similar names exist", () => {
    expect(
      resolveIdentity({ name: "Unseen Person", company: "Unknown Co" }, contacts),
    ).toEqual({ kind: "new" });
  });
});

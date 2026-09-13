import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { createDemoWorkspace } from "@/data/demo-workspace";
import {
  loadWorkspace,
  resetWorkspaceStorage,
  WORKSPACE_STORAGE_KEY,
} from "@/workspace/state";
import { workspaceReducer } from "@/workspace/reducer";
import { useWorkspace, WorkspaceProvider } from "@/workspace/provider";

beforeEach(() => {
  localStorage.clear();
});

describe("workspace reducer", () => {
  it("adds a Prep person to the field list only once", () => {
    const seed = createDemoWorkspace();
    const once = workspaceReducer(seed, {
      type: "field/add",
      conferenceId: "money20-eu-demo",
      personId: "marcus",
    });
    const twice = workspaceReducer(once, {
      type: "field/add",
      conferenceId: "money20-eu-demo",
      personId: "marcus",
    });

    expect(twice.fieldList).toHaveLength(1);
  });

  it("records Didn't meet without creating an actual encounter", () => {
    const seed = createDemoWorkspace();
    const actualBefore = seed.timeline.filter(
      (entry) => entry.kind === "actual_encounter",
    );
    const next = workspaceReducer(seed, {
      type: "meeting/outcome",
      plannedMeetingId: "pm-marcus",
      outcome: "did_not_meet",
    });

    expect(next.plannedMeetings[0]?.outcome).toBe("did_not_meet");
    expect(
      next.timeline.filter((entry) => entry.kind === "actual_encounter"),
    ).toHaveLength(actualBefore.length);
  });

  it("creates exactly one actual encounter for a repeated plannedMeetingId save", () => {
    const seed = createDemoWorkspace();
    const payload = {
      type: "capture/save" as const,
      name: "Marcus Oyelaran",
      company: "Payloom",
      conferenceId: "money20-eu-demo",
      occurredAt: "2026-06-03T12:00:00.000Z",
      note: "Agreed a corridor walkthrough next Tuesday.",
      role: "Treasury Director",
      email: "marcus@payloom.io",
      nextStep: "Corridor walkthrough next Tuesday",
      reciprocal: true,
      plannedMeetingId: "pm-marcus",
    };
    const once = workspaceReducer(seed, payload);
    const twice = workspaceReducer(once, payload);
    expect(
      twice.timeline.filter(
        (entry) => entry.kind === "actual_encounter" && entry.plannedMeetingId === "pm-marcus",
      ),
    ).toHaveLength(1);
  });

  it("stores a job-change company on the new event without rewriting earlier events", () => {
    const seed = createDemoWorkspace();
    const next = workspaceReducer(seed, {
      type: "capture/save",
      name: "Marcus Oyelaran",
      company: "NewCo Payments",
      conferenceId: "money20-eu-demo",
      occurredAt: "2026-06-03T12:00:00.000Z",
      note: "Moved companies; still interested in corridors.",
      role: "Treasury Director",
      email: "marcus@payloom.io",
      plannedMeetingId: "pm-marcus",
    });

    const prior = next.timeline.find((entry) => entry.id === "enc-marcus-money20-prior");
    const captured = next.timeline.find((entry) => entry.plannedMeetingId === "pm-marcus");
    const contact = next.contacts.find((contact) => contact.id === "marcus");

    expect(prior?.company).toBe("Payloom");
    expect(captured?.company).toBe("NewCo Payments");
    expect(contact?.company).toBe("NewCo Payments");
  });

  it("queues ambiguous captures for explicit match review", () => {
    const seed = createDemoWorkspace();
    const next = workspaceReducer(seed, {
      type: "capture/save",
      name: "Sam Jones",
      company: "Acme Payments Ltd",
      conferenceId: "money20-eu-demo",
      occurredAt: "2026-06-03T13:00:00.000Z",
      note: "Met at the coffee line.",
      role: "Head of Treasury",
    });

    expect(next.matchReviews).toHaveLength(1);
    expect(next.matchReviews[0]?.status).toBe("pending");
    expect(next.matchReviews[0]?.candidateIds).toContain("sam");
    expect(next.contacts.some((contact) => contact.id.startsWith("captured-"))).toBe(true);
  });

  it("deletes a captured encounter and restores its planned meeting", () => {
    const seed = createDemoWorkspace();
    const captured = workspaceReducer(seed, {
      type: "capture/save",
      name: "Marcus Oyelaran",
      company: "Payloom",
      conferenceId: "money20-eu-demo",
      occurredAt: "2026-06-03T12:00:00.000Z",
      note: "Agreed a corridor walkthrough next Tuesday.",
      role: "Treasury Director",
      plannedMeetingId: "pm-marcus",
    });
    const encounter = captured.timeline.find((entry) => entry.plannedMeetingId === "pm-marcus");
    const next = workspaceReducer(captured, { type: "capture/delete", encounterId: encounter!.id });

    expect(next.timeline.some((entry) => entry.id === encounter?.id)).toBe(false);
    expect(next.plannedMeetings.find((meeting) => meeting.id === "pm-marcus")?.outcome).toBe("planned");
    expect(next.timeline.some((entry) => entry.id === "enc-marcus-money20-prior")).toBe(true);
  });

  it("deletes an unplanned capture and its generated contact", () => {
    const seed = createDemoWorkspace();
    const captured = workspaceReducer(seed, {
      type: "capture/save",
      name: "New Contact",
      company: "New Company",
      conferenceId: "money20-eu-demo",
      occurredAt: "2026-06-03T13:00:00.000Z",
      note: "Met at the coffee line.",
      role: "Head of Treasury",
    });
    const encounter = captured.timeline.find((entry) => entry.id.startsWith("enc-captured-"));
    const next = workspaceReducer(captured, { type: "capture/delete", encounterId: encounter!.id });

    expect(next.timeline.some((entry) => entry.id === encounter?.id)).toBe(false);
    expect(next.contacts.some((contact) => contact.id === encounter?.personId)).toBe(false);
  });

  it("updates a captured encounter in place", () => {
    const captured = workspaceReducer(createDemoWorkspace(), {
      type: "capture/save",
      name: "Alex Morgan",
      company: "Northwind",
      conferenceId: "money20-eu-demo",
      occurredAt: "2026-06-03T14:00:00.000Z",
      note: "Initial note",
      role: "Treasury Lead",
    });
    const encounter = captured.timeline.find((entry) => entry.id.startsWith("enc-captured-"));
    const next = workspaceReducer(captured, {
      type: "capture/update",
      encounterId: encounter!.id,
      name: "Alex Morgan",
      company: "Northwind Group",
      conferenceId: "eurofinance-2026",
      occurredAt: "2026-06-03T14:00:00.000Z",
      note: "Updated note",
      role: "VP Treasury",
      email: "alex@northwind.com",
      linkedIn: "https://linkedin.com/in/alex",
      nextStep: "Send times",
      reciprocal: true,
    });

    const updated = next.timeline.find((entry) => entry.id === encounter!.id);
    expect(updated).toMatchObject({
      company: "Northwind Group",
      conferenceId: "eurofinance-2026",
      summary: "Updated note",
      role: "VP Treasury",
      nextStep: "Send times",
      reciprocal: true,
    });
    expect(next.contacts.find((contact) => contact.id === updated?.personId)).toMatchObject({
      company: "Northwind Group",
      role: "VP Treasury",
      email: { value: "alex@northwind.com" },
    });
  });
});

describe("workspace persistence boundary", () => {
  it("resets only this application's stored state on a schema-version mismatch", () => {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify({ version: 99 }));
    localStorage.setItem("another-application", "keep-me");

    const loaded = loadWorkspace(localStorage, createDemoWorkspace);

    expect(loaded).toEqual(createDemoWorkspace());
    expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem("another-application")).toBe("keep-me");
  });

  it("preserves a previously stored valid workspace during hydration", () => {
    const stored = workspaceReducer(createDemoWorkspace(), {
      type: "field/add",
      conferenceId: "money20-eu-demo",
      personId: "sam",
    });
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(stored));

    expect(loadWorkspace(localStorage, createDemoWorkspace)).toEqual(stored);
  });

  it("hydrates the provider from valid storage before persistence starts", async () => {
    const stored = workspaceReducer(createDemoWorkspace(), {
      type: "field/add",
      conferenceId: "money20-eu-demo",
      personId: "sam",
    });
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(stored));

    function Probe() {
      const { state, hydrated } = useWorkspace();
      return createElement(
        "output",
        null,
        hydrated ? state.fieldList.map((item) => item.personId).join(",") : "loading",
      );
    }

    render(createElement(WorkspaceProvider, null, createElement(Probe)));

    await waitFor(() => expect(screen.getByText("sam")).toBeInTheDocument());
    expect(JSON.parse(localStorage.getItem(WORKSPACE_STORAGE_KEY) ?? "null")).toEqual(
      stored,
    );
  });

  it("falls back to a fresh demo workspace for invalid stored data", () => {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, "not valid JSON");

    expect(() => loadWorkspace(localStorage, createDemoWorkspace)).not.toThrow();
    expect(loadWorkspace(localStorage, createDemoWorkspace)).toEqual(
      createDemoWorkspace(),
    );
  });

  it("reset removes only the conference-intelligence key", () => {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, "workspace");
    localStorage.setItem("another-application", "keep-me");

    resetWorkspaceStorage(localStorage);

    expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem("another-application")).toBe("keep-me");
  });
});

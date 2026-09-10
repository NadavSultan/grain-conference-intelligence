"use client";

import { useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button, ButtonRow } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { CONFERENCES } from "@/data/conferences";
import { PROFILES, type FullProfileId } from "@/data/prep-snapshots";
import { useWorkspace } from "@/workspace/provider";
import type { CaptureDraft } from "@/domain/types";

const EMPTY_FORM: CaptureDraft = {
  name: "",
  company: "",
  conferenceId: "money20-eu-demo",
  occurredAt: "2026-06-03T12:00:00.000Z",
  note: "",
  role: "",
  email: "",
  linkedIn: "",
  nextStep: "",
};

export function CaptureView() {
  const { state, dispatch } = useWorkspace();
  const planned = state.plannedMeetings.filter((meeting) => meeting.outcome === "planned");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setField] = useState<CaptureDraft>(EMPTY_FORM);

  const conferenceName = useMemo(
    () =>
      CONFERENCES.find(
        (item) => item.id === form.conferenceId || item.demoScenarioId === form.conferenceId,
      )?.name,
    [form.conferenceId],
  );

  const capturedCount = state.plannedMeetings.filter((meeting) => meeting.outcome === "met").length;

  function formFromMeeting(plannedMeetingId: string): CaptureDraft {
    const saved = state.captureDrafts[plannedMeetingId];
    if (saved) return { ...saved, plannedMeetingId };
    const meeting = state.plannedMeetings.find((item) => item.id === plannedMeetingId);
    const profile =
      meeting && meeting.personId in PROFILES ? PROFILES[meeting.personId as FullProfileId] : null;
    return {
      name: profile?.name ?? "",
      company: profile?.company ?? "",
      conferenceId: meeting?.conferenceId ?? "money20-eu-demo",
      occurredAt: meeting?.scheduledFor ?? "2026-06-03T12:00:00.000Z",
      note: "",
      role: profile?.title ?? "",
      email: profile?.contact.email?.confidence === "verified" ? profile.contact.email.value : "",
      linkedIn: profile?.contact.linkedIn.value ?? "",
      nextStep: "",
      plannedMeetingId,
    };
  }

  function persistDraft(draft: CaptureDraft, id: string) {
    dispatch({
      type: "capture/draft",
      id,
      draft,
    });
  }

  function openMet(plannedMeetingId: string) {
    setActiveId(plannedMeetingId);
    setError(null);
    setField(formFromMeeting(plannedMeetingId));
    setFormVisible(true);
  }

  function openUnplanned() {
    const saved = state.captureDrafts.unplanned;
    setActiveId(null);
    setError(null);
    setField(saved ?? EMPTY_FORM);
    setFormVisible(true);
  }

  function save() {
    setError(null);
    const draftId = activeId ?? "unplanned";
    if (!form.name.trim() || !form.company.trim() || !form.note.trim() || !form.conferenceId || !form.occurredAt) {
      persistDraft({ ...form, plannedMeetingId: activeId ?? undefined }, draftId);
      setError("Name, company, conference/date, and a short note are required. The draft was kept.");
      return;
    }
    dispatch({
      type: "capture/save",
      name: form.name.trim(),
      company: form.company.trim(),
      conferenceId: form.conferenceId,
      occurredAt: form.occurredAt,
      note: form.note.trim(),
      role: form.role.trim(),
      email: form.email.trim() || undefined,
      linkedIn: form.linkedIn.trim() || undefined,
      nextStep: form.nextStep.trim() || undefined,
      reciprocal: Boolean(form.nextStep.trim()),
      plannedMeetingId: activeId ?? undefined,
    });
  }

  return (
    <section className="page-stack" aria-labelledby="capture-title">
      <PageHeader
        eyebrow="Field capture"
        title="You planned to meet"
        titleId="capture-title"
        description="Mark Met to capture one actual encounter. Didn’t meet records the plan outcome only."
      />
      <p className="capture-progress">
        {planned.length} planned {planned.length === 1 ? "meeting" : "meetings"} remaining · {capturedCount} captured
      </p>
      <ul className="conference-list">
        {planned.map((item) => {
          const person = item.personId in PROFILES ? PROFILES[item.personId as FullProfileId] : null;
          return (
            <li key={item.id}>
              <article className="conference-card">
                <div>
                  <h2>{person?.name ?? item.personId}</h2>
                  <p>{item.context}</p>
                  <ButtonRow>
                    <Button variant="primary" onClick={() => openMet(item.id)}>
                      Met
                    </Button>
                    <Button
                      onClick={() =>
                        dispatch({
                          type: "meeting/outcome",
                          plannedMeetingId: item.id,
                          outcome: "did_not_meet",
                        })
                      }
                    >
                      Didn’t meet
                    </Button>
                  </ButtonRow>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
      <Button onClick={openUnplanned}>Capture unplanned meeting</Button>
      {formVisible ? (
        <form
          className="ui-card capture-shell"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <h2>Save meeting</h2>
          {error ? <Alert tone="warning">{error}</Alert> : null}
          <label className="field-label">
            Name
            <input
              value={form.name}
              onChange={(event) => setField({ ...form, name: event.target.value })}
            />
          </label>
          <label className="field-label">
            Company
            <input
              value={form.company}
              onChange={(event) => setField({ ...form, company: event.target.value })}
            />
          </label>
          <p className="provenance">
            Conference {conferenceName ?? form.conferenceId} · {form.occurredAt}
          </p>
          <label className="field-label">
            Short note
            <textarea
              rows={4}
              value={form.note}
              onChange={(event) => setField({ ...form, note: event.target.value })}
            />
          </label>
          <label className="field-label">
            Role (optional)
            <input value={form.role} onChange={(event) => setField({ ...form, role: event.target.value })} />
          </label>
          <label className="field-label">
            Verified email (optional)
            <input value={form.email} onChange={(event) => setField({ ...form, email: event.target.value })} />
          </label>
          <label className="field-label">
            LinkedIn (optional)
            <input
              value={form.linkedIn}
              onChange={(event) => setField({ ...form, linkedIn: event.target.value })}
            />
          </label>
          <label className="field-label">
            Next step (optional)
            <input
              value={form.nextStep}
              onChange={(event) => setField({ ...form, nextStep: event.target.value })}
            />
          </label>
          <Button type="submit" variant="primary">
            Save encounter
          </Button>
        </form>
      ) : null}
    </section>
  );
}

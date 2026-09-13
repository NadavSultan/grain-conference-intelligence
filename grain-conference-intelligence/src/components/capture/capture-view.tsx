"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { VoiceCapturePanel } from "@/components/capture/voice-capture-panel";
import { Button, ButtonRow } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { CONFERENCES } from "@/data/conferences";
import { PROFILES, type FullProfileId } from "@/data/prep-snapshots";
import { useWorkspace } from "@/workspace/provider";
import type { VoiceCaptureResult } from "@/hooks/use-voice-capture";
import { emailForSave, type CaptureExtractionField } from "@/features/capture/voice-extraction";
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

export function CaptureView({ meetingId }: { meetingId?: string }) {
  const { state, dispatch } = useWorkspace();
  const router = useRouter();
  const planned = state.plannedMeetings.filter((meeting) => meeting.outcome === "planned");
  const capturedEncounters = state.timeline.filter(
    (entry) =>
      entry.kind === "actual_encounter" &&
      (Boolean(entry.plannedMeetingId) || entry.id.startsWith("enc-captured-")),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingEncounterId, setEditingEncounterId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setField] = useState<CaptureDraft>(EMPTY_FORM);
  const [query, setQuery] = useState("");
  const [conferenceFilter, setConferenceFilter] = useState("all");
  const [voiceFilled, setVoiceFilled] = useState<CaptureExtractionField[]>([]);
  const [emailFromVoice, setEmailFromVoice] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  const conferenceName = useMemo(
    () =>
      CONFERENCES.find(
        (item) => item.id === form.conferenceId || item.demoScenarioId === form.conferenceId,
      )?.name,
    [form.conferenceId],
  );

  const capturedCount = capturedEncounters.length;
  const conferenceIdFor = (value: string) =>
    CONFERENCES.find((conference) => conference.id === value || conference.demoScenarioId === value)?.id ?? value;
  const conferenceMatches = (value: string) =>
    conferenceFilter === "all" || conferenceIdFor(value) === conferenceFilter;
  const visibleMeetings = planned.filter((meeting) => {
    const person = meeting.personId in PROFILES ? PROFILES[meeting.personId as FullProfileId] : null;
    const haystack = `${person?.name ?? meeting.personId} ${person?.company ?? ""} ${meeting.context}`.toLowerCase();
    return conferenceMatches(meeting.conferenceId) && haystack.includes(query.toLowerCase());
  });
  const visibleCapturedEncounters = capturedEncounters.filter((encounter) => {
    const contact = state.contacts.find((item) => item.id === encounter.personId);
    const haystack = `${contact?.name ?? encounter.personId} ${encounter.company} ${encounter.summary}`.toLowerCase();
    return conferenceMatches(encounter.conferenceId) && haystack.includes(query.toLowerCase());
  });

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

  function resetVoice() {
    setVoiceFilled([]);
    setEmailFromVoice(false);
    setEmailConfirmed(false);
  }

  // A spoken email is hearsay: it is held out of the saved draft until the rep confirms it.
  const emailPending = emailFromVoice && !emailConfirmed;

  function applyVoice(result: VoiceCaptureResult) {
    setField((current) => {
      const next = { ...current };
      for (const field of result.filled) {
        next[field] = result.extraction[field];
      }
      return next;
    });
    setVoiceFilled(result.filled);
    const heardEmail = result.filled.includes("email");
    setEmailFromVoice(heardEmail);
    if (heardEmail) setEmailConfirmed(false);
  }

  function openMet(plannedMeetingId: string) {
    router.push(`/capture/${plannedMeetingId}`);
    setActiveId(plannedMeetingId);
    setEditingEncounterId(null);
    setError(null);
    resetVoice();
    setField(formFromMeeting(plannedMeetingId));
    setFormVisible(true);
  }

  function openUnplanned() {
    const saved = state.captureDrafts.unplanned;
    setActiveId(null);
    setEditingEncounterId(null);
    setError(null);
    resetVoice();
    setField(saved ?? EMPTY_FORM);
    setFormVisible(true);
  }

  function openEncounterEdit(encounterId: string) {
    const encounter = state.timeline.find((entry) => entry.id === encounterId && entry.kind === "actual_encounter");
    if (!encounter) return;
    const contact = state.contacts.find((item) => item.id === encounter.personId);
    setEditingEncounterId(encounterId);
    setActiveId(encounter.plannedMeetingId ?? null);
    setError(null);
    resetVoice();
    setField({
      name: contact?.name ?? encounter.personId,
      company: encounter.company,
      conferenceId: encounter.conferenceId,
      occurredAt: encounter.occurredAt,
      note: encounter.summary,
      role: encounter.role ?? contact?.role ?? "",
      email: contact?.email?.value ?? "",
      linkedIn: contact?.linkedIn?.value ?? "",
      nextStep: encounter.nextStep ?? "",
      plannedMeetingId: encounter.plannedMeetingId,
    });
    setFormVisible(true);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (meetingId) {
      // Hydrate the dedicated meeting route from the persisted meeting record.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveId(meetingId);
      resetVoice();
      setField(formFromMeeting(meetingId));
      setFormVisible(true);
    }
  }, [meetingId]);

  function save() {
    setError(null);
    const draftId = editingEncounterId ?? activeId ?? "unplanned";
    if (!form.name.trim() || !form.company.trim() || !form.note.trim() || !form.conferenceId || !form.occurredAt) {
      persistDraft({ ...form, plannedMeetingId: activeId ?? undefined }, draftId);
      setError("Name, company, conference/date, and a short note are required. The draft was kept.");
      return;
    }
    const common = {
      name: form.name.trim(),
      company: form.company.trim(),
      conferenceId: form.conferenceId,
      occurredAt: form.occurredAt,
      note: form.note.trim(),
      role: form.role.trim(),
      email: emailForSave(form.email, emailFromVoice, emailConfirmed),
      linkedIn: form.linkedIn.trim() || undefined,
      nextStep: form.nextStep.trim() || undefined,
      reciprocal: Boolean(form.nextStep.trim()),
    };
    dispatch(
      editingEncounterId
        ? { type: "capture/update", encounterId: editingEncounterId, ...common }
        : { type: "capture/save", ...common, plannedMeetingId: activeId ?? undefined },
    );
    setFormVisible(false);
    setActiveId(null);
    setEditingEncounterId(null);
    router.push("/capture");
  }

  return (
    <section className="page-stack" aria-labelledby="capture-title">
      <PageHeader
        eyebrow="Meeting workspace"
        title="Scheduled meetings"
        titleId="capture-title"
        description="Keep upcoming meetings organized and capture updates immediately after each conversation."
      />
      {!meetingId ? <p className="capture-progress">
        {planned.length} planned {planned.length === 1 ? "meeting" : "meetings"} remaining · {capturedCount} captured
      </p> : null}
      {!meetingId ? <div className="meeting-filters"><input aria-label="Search scheduled meetings" placeholder="Search contacts or companies" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter by conference" value={conferenceFilter} onChange={(event) => setConferenceFilter(event.target.value)}><option value="all">All conferences</option>{CONFERENCES.map((conference) => <option key={conference.id} value={conference.id}>{conference.name}</option>)}</select></div> : null}
      {!meetingId ? <ul className="conference-list">
        {visibleMeetings.map((item) => {
          const person = item.personId in PROFILES ? PROFILES[item.personId as FullProfileId] : null;
          return (
            <li key={item.id}>
              <article className="meeting-row">
                <div className="meeting-row-person"><h2>{person?.name ?? item.personId}</h2><span>{person?.title ?? "Contact"}</span><strong>{person?.company ?? "Company"}</strong></div>
                <div className="meeting-row-detail"><span>Conference</span><strong>{CONFERENCES.find((conference) => conference.id === item.conferenceId || conference.demoScenarioId === item.conferenceId)?.name ?? item.conferenceId}</strong></div>
                <div className="meeting-row-detail"><span>Scheduled</span><strong>{new Date(item.scheduledFor).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</strong></div>
                <div className="meeting-row-detail"><span>Context</span><strong>{item.context}</strong></div>
                <div className="meeting-row-actions"><ButtonRow>
                    <Button variant="primary" onClick={() => openMet(item.id)}>
                      Update
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
                  </ButtonRow></div>
              </article>
            </li>
          );
        })}
      </ul> : null}
      {!meetingId && visibleCapturedEncounters.length > 0 ? <section aria-label="Captured encounters">
        <ul className="conference-list">
          {visibleCapturedEncounters.map((encounter) => {
            const meeting = encounter.plannedMeetingId
              ? state.plannedMeetings.find((item) => item.id === encounter.plannedMeetingId)
              : null;
            const profile = meeting && meeting.personId in PROFILES ? PROFILES[meeting.personId as FullProfileId] : null;
            const contact = state.contacts.find((item) => item.id === encounter.personId);
            const conference = CONFERENCES.find((item) => item.id === encounter.conferenceId || item.demoScenarioId === encounter.conferenceId);
            return <li key={encounter.id}>
              <article className="meeting-row">
                <div className="meeting-row-person"><h2>{profile?.name ?? contact?.name ?? encounter.personId}</h2><span>{encounter.role ?? profile?.title ?? contact?.role ?? "Contact"}</span><strong>{encounter.company}</strong></div>
                <div className="meeting-row-detail"><span>Conference</span><strong>{conference?.name ?? encounter.conferenceId}</strong></div>
                <div className="meeting-row-detail"><span>Captured</span><strong>{new Date(encounter.occurredAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</strong></div>
                <div className="meeting-row-detail"><span>Notes</span><strong>{encounter.summary}</strong></div>
                <div className="meeting-row-actions">
                  <span className="ui-badge">Captured</span>
                  <Button
                    className="icon-button icon-button-edit"
                    aria-label={`Edit encounter with ${profile?.name ?? contact?.name ?? encounter.personId}`}
                    title="Edit encounter"
                    onClick={() => openEncounterEdit(encounter.id)}
                  >
                    <Pencil aria-hidden="true" size={16} />
                  </Button>
                  <Button
                    className="icon-button"
                    aria-label={`Delete encounter with ${profile?.name ?? contact?.name ?? encounter.personId}`}
                    title="Delete encounter"
                    onClick={() => {
                      const name = profile?.name ?? contact?.name ?? encounter.personId;
                      if (window.confirm(`Delete the captured encounter with ${name}?`)) {
                        dispatch({ type: "capture/delete", encounterId: encounter.id });
                      }
                    }}
                  >
                    <Trash2 aria-hidden="true" size={16} />
                  </Button>
                </div>
              </article>
            </li>;
          })}
        </ul>
      </section> : null}
      {!meetingId ? <Button onClick={openUnplanned}>Update an unplanned meeting</Button> : null}
      {formVisible ? (
        <form
          className="ui-card capture-shell"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <h2>{editingEncounterId ? "Edit encounter" : meetingId ? "Update meeting" : "Unplanned meeting"}</h2>
          {error ? <Alert tone="warning">{error}</Alert> : null}
          <VoiceCapturePanel onResult={applyVoice} />
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
          <label className="field-label">
            Conference
            <select
              value={form.conferenceId}
              onChange={(event) => setField({ ...form, conferenceId: event.target.value })}
            >
              {CONFERENCES.map((conference) => (
                <option key={conference.id} value={conference.demoScenarioId ?? conference.id}>
                  {conference.name}
                </option>
              ))}
            </select>
          </label>
          <p className="provenance">
            Conference {conferenceName ?? form.conferenceId} · {new Date(form.occurredAt).toLocaleDateString([], { dateStyle: "medium" })}
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
          <label className={voiceFilled.includes("email") ? "field-label field-heard" : "field-label"}>
            Verified email (optional)
            <input
              value={form.email}
              aria-describedby={emailPending ? "email-heard-disclaimer" : undefined}
              onChange={(event) => {
                setField({ ...form, email: event.target.value });
                setEmailFromVoice(false);
                setEmailConfirmed(false);
              }}
            />
          </label>
          {emailPending ? (
            <Alert tone="warning" className="email-disclaimer">
              <span id="email-heard-disclaimer">
                Heard “{form.email}” in your recording. A spoken address is not verified: confirm it
                is correct, or edit it. It is not saved with this encounter until you confirm.
              </span>
              <ButtonRow>
                <Button variant="warning" onClick={() => setEmailConfirmed(true)}>
                  Confirm this is the email
                </Button>
                <Button
                  onClick={() => {
                    setField({ ...form, email: "" });
                    setEmailFromVoice(false);
                  }}
                >
                  Discard it
                </Button>
              </ButtonRow>
            </Alert>
          ) : null}
          {emailFromVoice && emailConfirmed ? (
            <p className="provenance">Spoken email confirmed by you. It will be saved.</p>
          ) : null}
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

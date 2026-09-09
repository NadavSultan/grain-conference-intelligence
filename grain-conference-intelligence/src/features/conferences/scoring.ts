import type {
  ConferenceRecord,
  ConferenceScoreResult,
  ConferenceTier,
  PlanDecision,
  PrepSnapshot,
  PrepSnapshotRecord,
  ScoreComponent,
  ScoreComponentResult,
} from "@/domain/types";

export const SCORE_WEIGHTS = {
  vertical_fit: 35,
  buyer_role_density: 25,
  buyer_role_sourced: 15,
  researched_room: 10,
  fx_relevance: 20,
  meeting_accessibility: 10,
  trip_efficiency: 10,
} as const;

const QUALIFIED_ROLES = new Set(["decision_maker", "influencer"]);

export function calculateQualifiedRoomCount(
  records: PrepSnapshotRecord[],
): number {
  const qualified = new Set<string>();
  for (const record of records) {
    if (!isQualifiedRoomPerson(record)) continue;
    qualified.add(record.personId as string);
  }
  return qualified.size;
}

export function roomEvidencePoints(records: PrepSnapshotRecord[]): number {
  return Math.min(SCORE_WEIGHTS.researched_room, calculateQualifiedRoomCount(records));
}

export function deriveTier(total: number): ConferenceTier {
  if (total >= 80) return "A";
  if (total >= 65) return "B";
  return "C";
}

export function recommendDecision(tier: ConferenceTier): Exclude<PlanDecision, "undecided"> {
  if (tier === "A") return "attend";
  if (tier === "B") return "watch";
  return "skip";
}

export function snapshotForConference(
  conference: ConferenceRecord,
  snapshots: PrepSnapshot[],
  activeSnapshotIds: Record<string, string>,
): PrepSnapshot | undefined {
  const researchKey = conference.demoScenarioId ?? conference.id;
  const activeId = activeSnapshotIds[researchKey] ?? activeSnapshotIds[conference.id];
  if (activeId) {
    return snapshots.find((snapshot) => snapshot.id === activeId);
  }
  return snapshots.find((snapshot) => snapshot.conferenceId === researchKey);
}

export function calculateConferenceScore(
  conference: ConferenceRecord,
  snapshot?: PrepSnapshot,
): ConferenceScoreResult {
  const evidenceByComponent = new Map(
    conference.scoreEvidence.map((item) => [item.component, item]),
  );

  const vertical = sourcedPoints(evidenceByComponent.get("vertical_fit"), SCORE_WEIGHTS.vertical_fit);
  const fx = sourcedPoints(evidenceByComponent.get("fx_relevance"), SCORE_WEIGHTS.fx_relevance);
  const meeting = sourcedPoints(
    evidenceByComponent.get("meeting_accessibility"),
    SCORE_WEIGHTS.meeting_accessibility,
  );
  const trip = sourcedPoints(evidenceByComponent.get("trip_efficiency"), SCORE_WEIGHTS.trip_efficiency);
  const sourcedBuyer = sourcedPoints(
    evidenceByComponent.get("buyer_role_density"),
    SCORE_WEIGHTS.buyer_role_sourced,
  );

  const researched = snapshot
    ? {
        q: calculateQualifiedRoomCount(snapshot.records),
        researchedRoomPoints: roomEvidencePoints(snapshot.records),
        researchedRoomStatus: "researched" as const,
        coverageWarning:
          "Cached named-person coverage can undercount the actual room. Audience size is context only and does not change the score.",
        researchedAt: snapshot.researchedAt,
        snapshotId: snapshot.id,
      }
    : {
        q: null,
        researchedRoomPoints: 0,
        researchedRoomStatus: "unknown" as const,
        coverageWarning:
          "No cached research snapshot. Room contribution is Unknown, not a claim that nobody relevant attends.",
        researchedAt: null,
        snapshotId: null,
      };

  const buyerPoints = sourcedBuyer.points + researched.researchedRoomPoints;
  const buyerEvidence = evidenceByComponent.get("buyer_role_density");
  const buyer: ScoreComponentResult = {
    component: "buyer_role_density",
    points: buyerPoints,
    max: SCORE_WEIGHTS.buyer_role_density,
    status: sourcedBuyer.status,
    rationale: buyerRationale(sourcedBuyer, researched.researchedRoomPoints, researched.q),
    sourceUrl: buyerEvidence?.sourceUrl ?? conference.sourceUrl,
    verifiedAt: buyerEvidence?.verifiedAt ?? conference.verifiedAt,
  };

  const components: ScoreComponentResult[] = [
    componentResult("vertical_fit", vertical, evidenceByComponent, conference),
    buyer,
    componentResult("fx_relevance", fx, evidenceByComponent, conference),
    componentResult("meeting_accessibility", meeting, evidenceByComponent, conference),
    componentResult("trip_efficiency", trip, evidenceByComponent, conference),
  ];

  const total = components.reduce((sum, item) => sum + item.points, 0);

  return {
    conferenceId: conference.id,
    snapshotId: researched.snapshotId,
    scoredAt: snapshot?.researchedAt ?? conference.verifiedAt,
    researchedAt: researched.researchedAt,
    q: researched.q,
    researchedRoomPoints: researched.researchedRoomPoints,
    researchedRoomStatus: researched.researchedRoomStatus,
    coverageWarning: researched.coverageWarning,
    components,
    total,
    tier: deriveTier(total),
  };
}

export function appendScoreSnapshot(
  stored: ConferenceScoreResult[],
  incoming: ConferenceScoreResult,
): ConferenceScoreResult[] {
  const alreadyRecorded = stored.some(
    (item) =>
      item.conferenceId === incoming.conferenceId &&
      item.snapshotId === incoming.snapshotId,
  );
  if (alreadyRecorded) return stored;
  return [...stored, incoming];
}

export function originalScoreFor(
  stored: ConferenceScoreResult[],
  conferenceId: string,
): ConferenceScoreResult | undefined {
  return stored.find((item) => item.conferenceId === conferenceId);
}

function isQualifiedRoomPerson(record: PrepSnapshotRecord): boolean {
  return (
    record.personId !== null &&
    record.currentEdition &&
    !record.cancelled &&
    record.attendanceConfidence === "confirmed" &&
    record.companyTier === "A" &&
    QUALIFIED_ROLES.has(record.roleFit)
  );
}

function sourcedPoints(
  evidence: ConferenceRecord["scoreEvidence"][number] | undefined,
  max: number,
): { points: number; status: ScoreComponentResult["status"] } {
  if (!evidence || evidence.tag === "unknown") {
    return { points: 0, status: "unknown" };
  }
  return { points: max, status: "sourced" };
}

function componentResult(
  component: Exclude<ScoreComponent, "buyer_role_density">,
  sourced: { points: number; status: ScoreComponentResult["status"] },
  evidenceByComponent: Map<ScoreComponent, ConferenceRecord["scoreEvidence"][number]>,
  conference: ConferenceRecord,
): ScoreComponentResult {
  const evidence = evidenceByComponent.get(component);
  return {
    component,
    points: sourced.points,
    max: SCORE_WEIGHTS[component],
    status: sourced.status,
    rationale:
      sourced.status === "unknown"
        ? evidence?.claim ?? "No sourced evidence for this factor. Points are provisional Unknown, not a verified zero."
        : evidence?.claim ?? "Sourced organizer evidence.",
    sourceUrl: evidence?.sourceUrl ?? conference.sourceUrl,
    verifiedAt: evidence?.verifiedAt ?? conference.verifiedAt,
  };
}

function buyerRationale(
  sourced: { points: number; status: ScoreComponentResult["status"] },
  roomPoints: number,
  q: number | null,
): string {
  const audience =
    sourced.status === "unknown"
      ? "Audience-role evidence is Unknown, so the 15 sourced points are provisional."
      : "15 points come from sourced audience-role evidence.";
  const room =
    q === null
      ? "Researched-room points are Unknown until a cached snapshot exists."
      : `${roomPoints} of 10 researched-room points come from Q=${q} unique named Confirmed Tier A decision-makers or influencers.`;
  return `${audience} ${room}`;
}

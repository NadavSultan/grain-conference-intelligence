import type {
  AttendanceConfidence,
  CompanyTier,
  CrmState,
  PrepSnapshotRecord,
  PrepStatus,
  RoleFit,
} from "@/domain/types";

export type PrepSummaryFilter = "verified" | "relevant" | "ready" | "coordination";

export interface PrepViewRecord {
  id: string;
  personId: string | null;
  companyId: string;
  name: string;
  attendanceConfidence: AttendanceConfidence;
  companyTier: CompanyTier;
  roleFit: RoleFit;
  crmState: CrmState;
  prepStatus: PrepStatus;
  currentEdition: boolean;
  cancelled: boolean;
  hasUsableChannel: boolean;
  identityResolved: boolean;
  requiresCoordination: boolean;
  isNew: boolean;
}

export interface PrepSummary {
  attendeesVerified: number;
  relevant: number;
  readyToContact: number;
  needCoordination: number;
}

export interface SnapshotDiff {
  added: string[];
  changed: string[];
  removedOrCancelled: string[];
}

const TIER_RANK: Record<CompanyTier, number> = {
  A: 0,
  B: 1,
  C: 2,
  excluded: 3,
  unknown: 4,
};

const CONFIDENCE_RANK: Record<AttendanceConfidence, number> = {
  confirmed: 0,
  likely: 1,
  probable_returner: 2,
  inferred: 3,
  unknown: 4,
};

const ACTIONABLE_ROLES = new Set<RoleFit>(["decision_maker", "influencer"]);
const RELEVANT_TIERS = new Set<CompanyTier>(["A", "B"]);

export function isAttendeeVerified(record: PrepViewRecord): boolean {
  return (
    record.personId !== null &&
    record.currentEdition &&
    !record.cancelled &&
    (record.attendanceConfidence === "confirmed" || record.attendanceConfidence === "likely")
  );
}

export function isRelevant(record: PrepViewRecord): boolean {
  return (
    isAttendeeVerified(record) &&
    RELEVANT_TIERS.has(record.companyTier) &&
    ACTIONABLE_ROLES.has(record.roleFit)
  );
}

export function isReadyToContact(record: PrepViewRecord): boolean {
  return (
    isRelevant(record) &&
    record.prepStatus === "to_contact" &&
    record.hasUsableChannel &&
    record.identityResolved &&
    (record.crmState === "not_present" || record.crmState === "owned_by_me")
  );
}

export function needsCoordination(record: PrepViewRecord): boolean {
  return (
    isRelevant(record) &&
    (record.crmState === "owned_by_other" ||
      record.crmState === "open_deal" ||
      record.requiresCoordination)
  );
}

export function calculatePrepSummary(records: PrepViewRecord[]): PrepSummary {
  return {
    attendeesVerified: records.filter(isAttendeeVerified).length,
    relevant: records.filter(isRelevant).length,
    readyToContact: records.filter(isReadyToContact).length,
    needCoordination: records.filter(needsCoordination).length,
  };
}

export function filterPrepRecords(
  records: PrepViewRecord[],
  filter: PrepSummaryFilter | "all",
): PrepViewRecord[] {
  if (filter === "all") return records;
  if (filter === "verified") return records.filter(isAttendeeVerified);
  if (filter === "relevant") return records.filter(isRelevant);
  if (filter === "ready") return records.filter(isReadyToContact);
  return records.filter(needsCoordination);
}

export function sortPrepRecords(records: PrepViewRecord[]): PrepViewRecord[] {
  return [...records].sort((left, right) => {
    const groupDelta = sortGroup(left) - sortGroup(right);
    if (groupDelta !== 0) return groupDelta;
    const tierDelta = TIER_RANK[left.companyTier] - TIER_RANK[right.companyTier];
    if (tierDelta !== 0) return tierDelta;
    const confidenceDelta =
      CONFIDENCE_RANK[left.attendanceConfidence] - CONFIDENCE_RANK[right.attendanceConfidence];
    if (confidenceDelta !== 0) return confidenceDelta;
    return left.id.localeCompare(right.id);
  });
}

export function diffSnapshots(
  previous: PrepSnapshotRecord[],
  current: PrepSnapshotRecord[],
): SnapshotDiff {
  const previousById = new Map(previous.map((record) => [record.id, record]));
  const currentById = new Map(current.map((record) => [record.id, record]));
  const added: string[] = [];
  const changed: string[] = [];
  const removedOrCancelled: string[] = [];

  for (const record of current) {
    const prior = previousById.get(record.id);
    if (!prior) {
      added.push(record.id);
      continue;
    }
    if (record.cancelled && !prior.cancelled) {
      removedOrCancelled.push(record.id);
      continue;
    }
    if (JSON.stringify(relevantDiffFields(prior)) !== JSON.stringify(relevantDiffFields(record))) {
      changed.push(record.id);
    }
  }

  for (const record of previous) {
    if (!currentById.has(record.id)) removedOrCancelled.push(record.id);
  }

  return {
    added: added.sort(),
    changed: changed.sort(),
    removedOrCancelled: removedOrCancelled.sort(),
  };
}

export function nextCachedSnapshot(
  currentId: string,
  snapshots: { id: string; conferenceId: string; researchedAt: string }[],
) {
  const current = snapshots.find((snapshot) => snapshot.id === currentId);
  if (!current) return undefined;
  return snapshots
    .filter(
      (snapshot) =>
        snapshot.conferenceId === current.conferenceId &&
        snapshot.researchedAt > current.researchedAt,
    )
    .sort((left, right) => left.researchedAt.localeCompare(right.researchedAt))[0];
}

export function buildPrepViewRecords(input: {
  records: PrepSnapshotRecord[];
  previousRecords?: PrepSnapshotRecord[];
  researchKey: string;
  prepStatuses: Record<string, PrepStatus>;
  profiles: Record<string, { name: string; requiresCoordination: boolean; contact: { linkedIn: { confidence: string }; email: { confidence: string } | null } }>;
}): PrepViewRecord[] {
  const diff = input.previousRecords
    ? diffSnapshots(input.previousRecords, input.records)
    : { added: [], changed: [], removedOrCancelled: [] };
  const newIds = new Set([...diff.added, ...diff.changed]);

  return input.records.map((record) => {
    const profile = record.personId ? input.profiles[record.personId] : undefined;
    const statusKey = record.personId ? `${input.researchKey}:${record.personId}` : record.id;
    const verifiedEmail = record.personId
      ? profile?.contact.email?.confidence === "verified"
      : false;
    const verifiedLinkedIn = profile?.contact.linkedIn.confidence === "verified";
    return {
      id: record.id,
      personId: record.personId,
      companyId: record.companyId,
      name: profile?.name ?? record.personId ?? record.companyId,
      attendanceConfidence: record.attendanceConfidence,
      companyTier: record.companyTier,
      roleFit: record.roleFit,
      crmState: record.crmState,
      prepStatus: record.personId
        ? (input.prepStatuses[statusKey] ?? record.prepStatus)
        : record.prepStatus,
      currentEdition: record.currentEdition,
      cancelled: record.cancelled,
      hasUsableChannel: Boolean(verifiedLinkedIn || verifiedEmail),
      identityResolved: Boolean(record.personId && profile),
      requiresCoordination:
        Boolean(profile?.requiresCoordination) ||
        record.crmState === "owned_by_other" ||
        record.crmState === "open_deal",
      isNew: newIds.has(record.id),
    };
  });
}

export function isResearchStale(researchedAt: string, asOf: string): boolean {
  const researched = Date.parse(researchedAt);
  const now = Date.parse(asOf);
  if (Number.isNaN(researched) || Number.isNaN(now) || now < researched) return false;
  return now - researched > 14 * 86_400_000;
}

function sortGroup(record: PrepViewRecord): number {
  if (record.companyTier === "A" && record.attendanceConfidence === "confirmed") return 0;
  if (record.companyTier === "A" && record.attendanceConfidence === "likely") return 1;
  if (record.companyTier === "B" && record.attendanceConfidence === "confirmed") return 2;
  return 3;
}

function relevantDiffFields(record: PrepSnapshotRecord) {
  return {
    attendanceConfidence: record.attendanceConfidence,
    companyTier: record.companyTier,
    roleFit: record.roleFit,
    crmState: record.crmState,
    cancelled: record.cancelled,
    currentEdition: record.currentEdition,
    evidenceIds: record.evidenceIds,
  };
}

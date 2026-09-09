import type { ConferenceRecord, ConferencePlan, PlanDecision } from "@/domain/types";

export interface PlannedCoverage {
  conferenceId: string;
  owner: string | null;
  startDate: string;
  endDate: string;
  decision?: PlanDecision;
}

export interface CoverageConflict {
  owner: string;
  conferenceIds: string[];
}

export interface TripCluster {
  city: string;
  conferenceIds: string[];
}

export interface FocusItem {
  kind: "undecided_conference" | "prep_link";
  conferenceId: string;
  href: string;
}

const COUNTRIES = new Set([
  "USA",
  "United Kingdom",
  "Netherlands",
  "Saudi Arabia",
  "Thailand",
  "Spain",
  "United Arab Emirates",
  "Germany",
  "Singapore",
]);

const STATES = new Set(["Nevada", "Florida"]);

export function conferenceCity(location: string): string {
  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return location;
  let index = parts.length - 1;
  if (COUNTRIES.has(parts[index] ?? "")) index -= 1;
  if (index >= 0 && STATES.has(parts[index] ?? "")) index -= 1;
  return parts[index] ?? location;
}

export function deriveConflicts(plans: PlannedCoverage[]): CoverageConflict[] {
  const conflicts: CoverageConflict[] = [];
  for (let i = 0; i < plans.length; i += 1) {
    for (let j = i + 1; j < plans.length; j += 1) {
      const left = plans[i];
      const right = plans[j];
      if (!left.owner || left.owner !== right.owner) continue;
      if (!datesOverlap(left.startDate, left.endDate, right.startDate, right.endDate)) {
        continue;
      }
      conflicts.push({
        owner: left.owner,
        conferenceIds: [left.conferenceId, right.conferenceId].sort(),
      });
    }
  }
  return conflicts;
}

export function deriveTripClusters(conferences: ConferenceRecord[]): TripCluster[] {
  const clusters: TripCluster[] = [];
  const used = new Set<string>();

  for (let i = 0; i < conferences.length; i += 1) {
    const seed = conferences[i];
    if (used.has(seed.id)) continue;
    const city = conferenceCity(seed.location);
    const members = [seed];

    for (let j = i + 1; j < conferences.length; j += 1) {
      const candidate = conferences[j];
      if (used.has(candidate.id)) continue;
      if (conferenceCity(candidate.location) !== city) continue;
      if (rangeGapDays(seed.startDate, seed.endDate, candidate.startDate, candidate.endDate) > 7) {
        continue;
      }
      members.push(candidate);
    }

    if (members.length < 2) continue;
    for (const member of members) used.add(member.id);
    clusters.push({
      city,
      conferenceIds: members.map((member) => member.id).sort(),
    });
  }

  return clusters;
}

export function deriveUncoveredQuarters(
  plans: Array<{ conferenceId: string; decision: PlanDecision; startDate: string }>,
  years: string[],
): string[] {
  const attended = new Set(
    plans
      .filter((plan) => plan.decision === "attend")
      .map((plan) => quarterKey(plan.startDate)),
  );

  return years.flatMap((year) =>
    [1, 2, 3, 4]
      .map((quarter) => `${year}-Q${quarter}`)
      .filter((key) => !attended.has(key)),
  );
}

export function selectFocusItems(input: {
  asOf: string;
  conferences: ConferenceRecord[];
  plans: Record<string, ConferencePlan>;
  prepConferenceIds: string[];
}): FocusItem[] {
  const undecided = input.conferences
    .filter((conference) => conference.startDate >= input.asOf)
    .filter((conference) => (input.plans[conference.id]?.decision ?? "undecided") === "undecided")
    .sort((left, right) => left.startDate.localeCompare(right.startDate))
    .map((conference) => ({
      kind: "undecided_conference" as const,
      conferenceId: conference.id,
      href: `/conferences/${conference.id}`,
    }));

  const prepLinks = input.conferences
    .filter((conference) =>
      input.prepConferenceIds.includes(conference.demoScenarioId ?? conference.id) ||
      input.prepConferenceIds.includes(conference.id),
    )
    .sort((left, right) => left.startDate.localeCompare(right.startDate))
    .map((conference) => ({
      kind: "prep_link" as const,
      conferenceId: conference.id,
      href: `/conferences/${conference.id}?tab=prep`,
    }));

  return [...undecided, ...prepLinks];
}

export function getConferencePlan(
  plans: Record<string, ConferencePlan>,
  conferenceId: string,
): ConferencePlan {
  return plans[conferenceId] ?? { decision: "undecided", owner: null };
}

export function planningYears(conferences: ConferenceRecord[]): string[] {
  return [...new Set(conferences.map((conference) => conference.startDate.slice(0, 4)))].sort();
}

function datesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA <= endB && startB <= endA;
}

function rangeGapDays(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): number {
  if (datesOverlap(startA, endA, startB, endB)) return 0;
  const leftEnd = utcDate(endA);
  const rightStart = utcDate(startB);
  const rightEnd = utcDate(endB);
  const leftStart = utcDate(startA);
  if (leftEnd <= rightStart) {
    return Math.round((rightStart - leftEnd) / 86_400_000);
  }
  return Math.round((leftStart - rightEnd) / 86_400_000);
}

function utcDate(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function quarterKey(isoDate: string): string {
  const year = isoDate.slice(0, 4);
  const month = Number(isoDate.slice(5, 7));
  const quarter = Math.ceil(month / 3);
  return `${year}-Q${quarter}`;
}

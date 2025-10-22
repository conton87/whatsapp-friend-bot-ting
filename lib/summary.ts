import { rankSlots, rankVenues, type SlotTally, type VenueTally } from './ranking';

export interface PlanWithResponses {
  id: string;
  title: string;
  group_label: string | null;
  host_name: string;
  cut_off_utc: string;
  options_slots: string[];
  options_venues: string[];
  currency: string | null;
  status: 'open' | 'confirmed';
  decision?: {
    slot: string;
    venue: string;
    per_person_estimate: string | null;
    map_url: string | null;
  } | null;
  responses: Array<{
    id: string;
    display_name: string;
    choice_slots: string[];
    choice_venue: string | null;
    attendance: 'in' | 'maybe' | 'out';
    pledge_amount: string | null;
    notes: string | null;
    created_at: string | null;
  }>;
}

export interface SummaryResult {
  plan: PlanWithResponses;
  slotTallies: SlotTally[];
  venueTallies: VenueTally[];
  rankedSlots: SlotTally[];
  rankedVenues: VenueTally[];
  headcount: {
    in: number;
    maybe: number;
    out: number;
  };
  bestSlotDelta: string | null;
  bestVenueDelta: string | null;
  notes: Array<{ name: string; note: string }>;
}

export function computeSummary(plan: PlanWithResponses): SummaryResult {
  const slotTallies: SlotTally[] = plan.options_slots.map((slot) => ({
    slot,
    in: 0,
    maybe: 0,
    out: 0
  }));
  const venueTallies: VenueTally[] = plan.options_venues.map((venue) => ({
    venue,
    votes: 0
  }));

  const slotIndex = new Map(slotTallies.map((entry, index) => [entry.slot, index]));
  const venueIndex = new Map(venueTallies.map((entry, index) => [entry.venue, index]));

  const notes: Array<{ name: string; note: string }> = [];
  const headcount = { in: 0, maybe: 0, out: 0 };

  for (const response of plan.responses) {
    headcount[response.attendance] += 1;
    for (const slot of response.choice_slots) {
      const idx = slotIndex.get(slot);
      if (idx === undefined) continue;
      if (response.attendance === 'in') slotTallies[idx].in += 1;
      if (response.attendance === 'maybe') slotTallies[idx].maybe += 1;
      if (response.attendance === 'out') slotTallies[idx].out += 1;
    }
    if (response.choice_venue) {
      const idx = venueIndex.get(response.choice_venue);
      if (idx !== undefined) {
        venueTallies[idx].votes += response.attendance === 'out' ? 0 : 1;
      }
    }
    if (response.notes) {
      notes.push({ name: response.display_name, note: response.notes });
    }
  }

  const rankedSlots = rankSlots(slotTallies);
  const rankedVenues = rankVenues(venueTallies);

  const bestSlotDelta = rankedSlots.length > 1 ? computeSlotDelta(rankedSlots) : null;
  const bestVenueDelta = rankedVenues.length > 1 ? computeVenueDelta(rankedVenues) : null;

  return {
    plan,
    slotTallies,
    venueTallies,
    rankedSlots,
    rankedVenues,
    headcount,
    bestSlotDelta,
    bestVenueDelta,
    notes
  };
}

function computeSlotDelta(sorted: SlotTally[]) {
  const [top, next] = sorted;
  if (!top || !next) return null;
  const inDelta = top.in - next.in;
  if (inDelta > 0) {
    return `+${inDelta} over next`;
  }
  const maybeDelta = top.maybe - next.maybe;
  if (maybeDelta > 0) {
    return `+${maybeDelta} maybe edge`;
  }
  return null;
}

function computeVenueDelta(sorted: VenueTally[]) {
  const [top, next] = sorted;
  if (!top || !next) return null;
  const diff = top.votes - next.votes;
  if (diff <= 0) return null;
  return `+${diff} over next`;
}

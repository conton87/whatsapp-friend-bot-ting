import { compareAsc, parseISO } from 'date-fns';

export interface SlotTally {
  slot: string;
  in: number;
  maybe: number;
  out: number;
}

export interface VenueTally {
  venue: string;
  votes: number;
}

export function rankSlots(slots: SlotTally[]): SlotTally[] {
  return [...slots].sort((a, b) => {
    if (b.in !== a.in) return b.in - a.in;
    if (b.maybe !== a.maybe) return b.maybe - a.maybe;
    return compareAsc(parseISO(a.slot), parseISO(b.slot));
  });
}

export function rankVenues(venues: VenueTally[]): VenueTally[] {
  return [...venues].sort((a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    return a.venue.localeCompare(b.venue);
  });
}

export function formatLeaderboard<T extends { votes?: number }>(items: T[]) {
  if (items.length <= 1) return null;
  const [top, next] = items;
  if (!top || !next) return null;
  const topVotes = 'votes' in top ? (top.votes ?? 0) : 0;
  const nextVotes = 'votes' in next ? (next.votes ?? 0) : 0;
  const delta = topVotes - nextVotes;
  if (delta <= 0) return null;
  return `+${delta} over next`;
}

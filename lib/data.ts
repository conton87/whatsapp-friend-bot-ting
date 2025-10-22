import { differenceInSeconds, isAfter } from 'date-fns';
import { nanoid } from 'nanoid';
import { createHash } from 'node:crypto';
import { supabaseAdmin } from './supabase/server';
import { computeSummary, type PlanWithResponses, type SummaryResult } from './summary';
import type { DecisionInput, PlanInput, ResponseInput } from './validation';

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

function makeHostLink(planId: string, token: string) {
  return `${SITE_URL.replace(/\/$/, '')}/p/${planId}/summary?host=${token}`;
}

function makeShareLink(planId: string) {
  return `${SITE_URL.replace(/\/$/, '')}/p/${planId}`;
}

function makeConfirmedLink(planId: string) {
  return `${SITE_URL.replace(/\/$/, '')}/p/${planId}/confirmed`;
}

export async function createPlan(input: PlanInput) {
  const { data, error } = await supabaseAdmin
    .from('plans')
    .insert({
      title: input.title,
      group_label: input.groupLabel ?? null,
      host_name: input.hostName,
      cut_off_utc: input.cutOffUtc,
      options_slots: input.optionsSlots,
      options_venues: input.optionsVenues,
      currency: input.currency ?? 'GBP'
    })
    .select('id, cut_off_utc')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create plan');
  }

  const token = nanoid(32);
  const { error: tokenError } = await supabaseAdmin
    .from('host_tokens')
    .insert({ token, plan_id: data.id });

  if (tokenError) {
    throw new Error(tokenError.message);
  }

  return {
    planId: data.id,
    hostLink: makeHostLink(data.id, token),
    shareLink: makeShareLink(data.id),
    cutOffUtc: data.cut_off_utc
  };
}

export async function fetchPlanWithResponses(planId: string): Promise<PlanWithResponses | null> {
  const { data, error } = await supabaseAdmin
    .from('plans')
    .select(
      `id, title, group_label, host_name, cut_off_utc, options_slots, options_venues, currency, status,
      decisions(plan_id, slot, venue, per_person_estimate, map_url),
      responses(id, display_name, choice_slots, choice_venue, attendance, pledge_amount, notes, created_at)
    `
    )
    .eq('id', planId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    group_label: data.group_label,
    host_name: data.host_name,
    cut_off_utc: data.cut_off_utc,
    options_slots: data.options_slots,
    options_venues: data.options_venues,
    currency: data.currency,
    status: data.status,
    decision: Array.isArray(data.decisions) ? data.decisions[0] ?? null : data.decisions,
    responses: data.responses ?? []
  };
}

export async function getPlanSummary(planId: string): Promise<SummaryResult | null> {
  const plan = await fetchPlanWithResponses(planId);
  if (!plan) return null;
  return computeSummary(plan);
}

export async function upsertResponse(input: ResponseInput, ip: string | null) {
  const plan = await fetchPlanWithResponses(input.planId);
  if (!plan) throw new Error('Plan not found');
  if (plan.status === 'confirmed' || isAfter(new Date(), new Date(plan.cut_off_utc))) {
    throw new Error('Plan is closed');
  }

  const hashed = hashIdentity(ip, input.displayName);
  const now = new Date();

  const { data: existing } = await supabaseAdmin
    .from('responses')
    .select('id, created_at')
    .eq('plan_id', input.planId)
    .eq('display_name', input.displayName)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.created_at && differenceInSeconds(now, new Date(existing.created_at)) <= 30) {
    const { error } = await supabaseAdmin
      .from('responses')
      .update({
        choice_slots: input.choiceSlots,
        choice_venue: input.choiceVenue ?? null,
        attendance: input.attendance,
        pledge_amount: input.pledgeAmount != null ? Number(input.pledgeAmount) : null,
        notes: input.notes ?? null,
        ip_hash: hashed
      })
      .eq('id', existing.id);

    if (error) {
      throw new Error(error.message);
    }
    return existing.id;
  }

  const { data, error } = await supabaseAdmin
    .from('responses')
    .insert({
      plan_id: input.planId,
      display_name: input.displayName,
      choice_slots: input.choiceSlots,
      choice_venue: input.choiceVenue ?? null,
      attendance: input.attendance,
      pledge_amount: input.pledgeAmount != null ? Number(input.pledgeAmount) : null,
      notes: input.notes ?? null,
      ip_hash: hashed
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to save response');
  }

  return data.id;
}

export async function confirmPlan(input: DecisionInput) {
  const { hostToken, perPersonEstimate, mapUrl, ...decision } = input;

  const { data: token, error: tokenError } = await supabaseAdmin
    .from('host_tokens')
    .select('plan_id')
    .eq('token', hostToken)
    .single();

  if (tokenError || !token) {
    throw new Error('Invalid host token');
  }

  if (token.plan_id !== decision.planId) {
    throw new Error('Token does not match plan');
  }

  const plan = await fetchPlanWithResponses(decision.planId);
  if (!plan) throw new Error('Plan not found');

  const payload = {
    plan_id: decision.planId,
    slot: decision.slot,
    venue: decision.venue,
    per_person_estimate: perPersonEstimate != null ? Number(perPersonEstimate) : null,
    map_url: mapUrl ?? null
  };

  const { error: decisionError } = await supabaseAdmin
    .from('decisions')
    .upsert(payload, { onConflict: 'plan_id' });

  if (decisionError) {
    throw new Error(decisionError.message);
  }

  const { error: statusError } = await supabaseAdmin
    .from('plans')
    .update({ status: 'confirmed' })
    .eq('id', decision.planId);

  if (statusError) {
    throw new Error(statusError.message);
  }

  return {
    planId: decision.planId,
    confirmedLink: makeConfirmedLink(decision.planId)
  };
}

export async function makeCopySnippets(planId: string) {
  const summary = await getPlanSummary(planId);
  if (!summary) throw new Error('Plan not found');

  const cutOffDate = new Date(summary.plan.cut_off_utc);
  const cutOffLocal = cutOffDate.toLocaleString();
  const shareLink = makeShareLink(planId);
  const hostToken = await supabaseAdmin
    .from('host_tokens')
    .select('token')
    .eq('plan_id', planId)
    .maybeSingle();

  const hostLink = hostToken.data ? makeHostLink(planId, hostToken.data.token) : null;

  const decision = summary.plan.decision;
  const count = summary.headcount.in;
  const maybes = summary.headcount.maybe;
  const perPerson = decision?.per_person_estimate
    ? `${summary.plan.currency ?? 'GBP'} ${Number(decision.per_person_estimate).toFixed(2)}`
    : 'TBC';
  const notesSummary = summary.notes.length
    ? summary.notes
        .map((entry) => `${entry.name}: ${entry.note}`)
        .slice(0, 3)
        .join('; ')
    : 'None';

  const date = decision ? new Date(decision.slot) : null;
  const weekday = date?.toLocaleDateString(undefined, { weekday: 'short' }) ?? '';
  const day = date?.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) ?? '';
  const time = date?.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) ?? '';

  const reminder = Date.now() < cutOffDate.getTime() - 6 * 60 * 60 * 1000
    ? `⏰ Last call to vote: ${shareLink} (closes ${cutOffLocal})`
    : null;

  return {
    kickOff: `👉 Tap to vote your times & venue (20–30s): ${shareLink}\nCut-off: ${cutOffLocal}. I’ll lock it after that.`,
    reminder,
    confirmation: decision
      ? `✅ Locked: ${weekday} ${day} @ ${time}\n📍 ${decision.venue} — map: ${decision.map_url ?? 'TBC'}\n👥 ${count} coming (${maybes} maybe)\n💸 est. ${perPerson}/person\nNotes: ${notesSummary}\nSave this: ${makeConfirmedLink(planId)}`
      : null,
    hostLink
  };
}

function hashIdentity(ip: string | null, displayName: string) {
  return createHash('sha256').update(`${ip ?? 'unknown'}:${displayName}`).digest('hex');
}

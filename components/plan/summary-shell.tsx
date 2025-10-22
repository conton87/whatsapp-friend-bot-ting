'use client';

import { format } from 'date-fns';
import { useEffect, useMemo, useState, useTransition } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSupabase } from '@/lib/supabase/client';
import type { SummaryResult } from '@/lib/summary';

interface SummaryShellProps {
  initialSummary: SummaryResult;
  hostToken?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SummaryShell({ initialSummary, hostToken }: SummaryShellProps) {
  const supabase = useSupabase();
  const [summary, setSummary] = useState<SummaryResult>(initialSummary);
  const [isPending, startTransition] = useTransition();
  const [mapUrl, setMapUrl] = useState('');
  const [perPerson, setPerPerson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { mutate } = useSWR<SummaryResult>(
    `/api/summary/${summary.plan.id}`,
    fetcher,
    {
      fallbackData: initialSummary,
      onSuccess: (data) => {
        if (data && !('error' in (data as any))) {
          setSummary(data);
        }
      }
    }
  );

  useEffect(() => {
    const channel = supabase
      .channel(`plan-${summary.plan.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'responses', filter: `plan_id=eq.${summary.plan.id}` },
        () => {
          mutate();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [mutate, supabase, summary.plan.id]);

  const topSlot = summary.rankedSlots[0];
  const topVenue = summary.rankedVenues[0];
  const voterCount = summary.headcount.in + summary.headcount.maybe + summary.headcount.out;
  const canConfirm = Boolean(hostToken) && summary.plan.status === 'open' && voterCount >= 2;

  useEffect(() => {
    if (perPerson === '' && summary.plan.decision?.per_person_estimate) {
      setPerPerson(summary.plan.decision.per_person_estimate);
    }
    if (mapUrl === '' && summary.plan.decision?.map_url) {
      setMapUrl(summary.plan.decision.map_url);
    }
  }, [mapUrl, perPerson, summary.plan.decision?.map_url, summary.plan.decision?.per_person_estimate]);

  function handleConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hostToken || !topSlot || !topVenue) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const response = await fetch('/api/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: summary.plan.id,
            slot: topSlot.slot,
            venue: topVenue.venue,
            perPersonEstimate: perPerson ? Number(perPerson) : undefined,
            mapUrl: mapUrl || undefined,
            hostToken
          })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? 'Failed to confirm plan');
        }
        setSuccess('Plan confirmed and links updated');
        mutate();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  const notes = useMemo(() => summary.notes, [summary.notes]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{summary.plan.title}</CardTitle>
          <CardDescription>
            {summary.plan.group_label ? `${summary.plan.group_label} • ` : ''}
            Cut-off {new Date(summary.plan.cut_off_utc).toLocaleString()} — {voterCount} voters so far.
          </CardDescription>
        </CardHeader>
        <div className="grid gap-4 p-6 pt-0 lg:grid-cols-3">
          <LeaderboardCard
            title="Best slot"
            subtitle={summary.bestSlotDelta ?? 'Ranked by In → Maybe → earliest'}
            value={topSlot ? format(new Date(topSlot.slot), 'EEE d MMM, h:mm a') : 'No votes yet'}
            highlight={`${topSlot?.in ?? 0} in / ${topSlot?.maybe ?? 0} maybe`}
          />
          <LeaderboardCard
            title="Best venue"
            subtitle={summary.bestVenueDelta ?? 'Alphabetical tie-break'}
            value={topVenue ? topVenue.venue : 'Vote to decide'}
            highlight={`${topVenue?.votes ?? 0} votes`}
          />
          <LeaderboardCard
            title="Headcount"
            subtitle="Live attendance"
            value={`${summary.headcount.in} in`}
            highlight={`${summary.headcount.maybe} maybe • ${summary.headcount.out} out`}
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Who’s in</CardTitle>
          <CardDescription>Tap names to nudge in WhatsApp.</CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2 p-6 pt-0">
          {voterCount < 2 ? (
            <p className="text-sm text-slate-500">Need at least 2 voters to unlock confirmation.</p>
          ) : (
            summary.plan.responses.map((response) => (
              <span
                key={response.id}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${response.attendance === 'in' ? 'bg-green-100 text-green-800' : response.attendance === 'maybe' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}
              >
                {response.display_name}
              </span>
            ))
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes & dietary</CardTitle>
          <CardDescription>Keep an eye on extra context.</CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2 p-6 pt-0 text-xs">
          {notes.length === 0 ? (
            <span className="text-slate-500">No notes yet.</span>
          ) : (
            notes.map((item, index) => (
              <span key={index} className="rounded-full bg-slate-200 px-3 py-1">
                <strong>{item.name}:</strong> {item.note}
              </span>
            ))
          )}
        </div>
      </Card>

      {hostToken ? (
        <Card className={canConfirm ? '' : 'opacity-60'}>
          <CardHeader>
            <CardTitle>Host controls</CardTitle>
            <CardDescription>
              {canConfirm
                ? 'Lock the plan and share the confirmation message.'
                : 'Need at least 2 voters before confirming.'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleConfirm} className="space-y-4 p-6 pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium">Slot</span>
                <Input value={topSlot ? format(new Date(topSlot.slot), "EEE d MMM, h:mm a") : ''} readOnly />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">Venue</span>
                <Input value={topVenue?.venue ?? ''} readOnly />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium">Per-person estimate ({summary.plan.currency ?? 'GBP'})</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={perPerson}
                  onChange={(event) => setPerPerson(event.target.value)}
                  disabled={!canConfirm}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">Map link</span>
                <Input
                  placeholder="https://maps.app.goo.gl/..."
                  value={mapUrl}
                  onChange={(event) => setMapUrl(event.target.value)}
                  disabled={!canConfirm}
                />
              </label>
            </div>
            <Textarea
              placeholder="Notes for confirmation message"
              rows={3}
              value={summary.notes.map((item) => `${item.name}: ${item.note}`).join('\n')}
              readOnly
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-green-600">{success}</p> : null}
            <Button type="submit" disabled={!canConfirm || isPending}>
              {isPending ? 'Confirming…' : 'Confirm plan'}
            </Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}

function LeaderboardCard({
  title,
  subtitle,
  value,
  highlight
}: {
  title: string;
  subtitle: string;
  value: string;
  highlight: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      <p className="text-sm text-slate-500">{highlight}</p>
      <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

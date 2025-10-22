'use client';

import { addHours, formatISO } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface CreatedResult {
  planId: string;
  hostLink: string;
  shareLink: string;
  cutOffUtc: string;
}

export function CreatePlanForm() {
  const [title, setTitle] = useState('Dinner vibes');
  const [groupLabel, setGroupLabel] = useState('Housemates');
  const [hostName, setHostName] = useState('Alex');
  const [cutOff, setCutOff] = useState(() => formatISO(addHours(new Date(), 24)));
  const [slots, setSlots] = useState<string[]>(() => {
    const now = new Date();
    return [addHours(now, 48), addHours(now, 72), addHours(now, 96)].map((date) =>
      formatISO(date)
    );
  });
  const [venues, setVenues] = useState<string[]>(['Neighbourhood Bistro', 'Skyline Bar']);
  const [currency, setCurrency] = useState('GBP');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CreatedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title,
        groupLabel,
        hostName,
        cutOffUtc: cutOff,
        optionsSlots: slots.filter(Boolean),
        optionsVenues: venues.filter(Boolean),
        currency
      };
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Failed to create plan');
      }
      const data = (await response.json()) as CreatedResult;
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateSlot(index: number, value: string) {
    setSlots((current) => current.map((slot, idx) => (idx === index ? value : slot)));
  }

  function updateVenue(index: number, value: string) {
    setVenues((current) => current.map((venue, idx) => (idx === index ? value : venue)));
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Kick off a new plan</CardTitle>
        <CardDescription>Share the host link privately and drop the poll in WhatsApp.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Plan title</span>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Group label</span>
            <Input
              placeholder="Optional"
              value={groupLabel ?? ''}
              onChange={(event) => setGroupLabel(event.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Host name</span>
            <Input value={hostName} onChange={(event) => setHostName(event.target.value)} required />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Cut-off (UTC)</span>
            <Input
              type="datetime-local"
              value={cutOff.slice(0, 16)}
              onChange={(event) => setCutOff(new Date(event.target.value).toISOString())}
              required
            />
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Slots</span>
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={() => setSlots((current) => [...current, formatISO(addHours(new Date(), 120))])}
            >
              + Add slot
            </Button>
          </div>
          <div className="grid gap-3">
            {slots.map((slot, index) => (
              <Input
                key={index}
                type="datetime-local"
                value={slot.slice(0, 16)}
                onChange={(event) => updateSlot(index, new Date(event.target.value).toISOString())}
                required
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Venues</span>
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={() => setVenues((current) => [...current, 'New spot'])}
            >
              + Add venue
            </Button>
          </div>
          <div className="grid gap-3">
            {venues.map((venue, index) => (
              <Input
                key={index}
                value={venue}
                onChange={(event) => updateVenue(index, event.target.value)}
                required
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Currency</span>
            <Input value={currency} onChange={(event) => setCurrency(event.target.value)} />
          </label>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create plan'}
        </Button>
      </form>

      {result ? (
        <div className="mt-6 space-y-4 rounded-lg bg-slate-100 p-4 text-sm">
          <p className="font-semibold">Links ready to share</p>
          <CopyRow label="Host summary" value={result.hostLink} />
          <CopyRow label="Poll link" value={result.shareLink} />
          <CopyRow
            label="Kick-off text"
            value={formatKickoff(result.shareLink, result.cutOffUtc)}
          />
        </div>
      ) : null}
    </Card>
  );
}

function formatKickoff(shareLink: string, cutOffUtc: string) {
  const cutOffLocal = new Date(cutOffUtc).toLocaleString();
  return `👉 Tap to vote your times & venue (20–30s): ${shareLink}\nCut-off: ${cutOffLocal}. I’ll lock it after that.`;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-slate-600 break-all">{value}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

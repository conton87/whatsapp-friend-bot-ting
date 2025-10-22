'use client';

import { format } from 'date-fns';
import { useMemo, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { PlanPageData } from '@/types/plan';

interface QuickPollProps {
  plan: PlanPageData;
  disabled: boolean;
}

const attendanceOptions = [
  { value: 'in', label: 'In' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'out', label: 'Out' }
] as const;

export function QuickPoll({ plan, disabled }: QuickPollProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [attendance, setAttendance] = useState<'in' | 'maybe' | 'out'>('in');
  const [pledge, setPledge] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const slotOptions = useMemo(() => plan.options_slots.map((slot) => new Date(slot)), [plan.options_slots]);

  function toggleSlot(slot: string) {
    setSelectedSlots((current) =>
      current.includes(slot) ? current.filter((item) => item !== slot) : [...current, slot]
    );
  }

  function handleSubmit() {
    if (disabled) return;
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch('/api/response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
            displayName: name,
            choiceSlots: selectedSlots,
            choiceVenue: selectedVenue,
            attendance,
            pledgeAmount: pledge ? Number(pledge) : undefined,
            notes
          })
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? 'Failed to submit response');
        }
        setSuccess(true);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle>Thanks! You’re in.</CardTitle>
          <CardDescription>We’ll nudge the host with your vote.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const steps = [
    {
      title: 'Your name',
      content: (
        <div className="space-y-4">
          <Input
            placeholder="How should we show you?"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={disabled}
            required
          />
        </div>
      )
    },
    {
      title: 'Pick the slots that work',
      content: (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {slotOptions.map((slot) => (
            <button
              key={slot.toISOString()}
              type="button"
              onClick={() => toggleSlot(slot.toISOString())}
              className={`rounded-xl border px-3 py-2 text-left text-sm shadow-sm transition focus-visible:outline focus-visible:ring-2 ${selectedSlots.includes(slot.toISOString()) ? 'border-brand bg-brand/10 text-brand-dark' : 'border-slate-200 bg-white'}`}
              disabled={disabled}
            >
              <p className="font-semibold">{format(slot, 'EEE d MMM')}</p>
              <p className="text-xs text-slate-500">{format(slot, 'h:mm a')}</p>
            </button>
          ))}
        </div>
      )
    },
    {
      title: 'Choose a venue',
      content: (
        <div className="grid gap-3">
          {plan.options_venues.map((venue) => (
            <button
              key={venue}
              type="button"
              onClick={() => setSelectedVenue(venue)}
              className={`rounded-xl border px-3 py-2 text-left text-sm shadow-sm transition focus-visible:outline focus-visible:ring-2 ${selectedVenue === venue ? 'border-brand bg-brand/10 text-brand-dark' : 'border-slate-200 bg-white'}`}
              disabled={disabled}
            >
              <p className="font-semibold">{venue}</p>
            </button>
          ))}
        </div>
      )
    },
    {
      title: 'Attendance & extras',
      content: (
        <div className="space-y-4 text-sm">
          <div className="flex gap-2">
            {attendanceOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={attendance === option.value ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setAttendance(option.value)}
                disabled={disabled}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder={`Pledge in ${plan.currency ?? 'GBP'} (optional)`}
            value={pledge}
            onChange={(event) => setPledge(event.target.value)}
            disabled={disabled}
          />
          <Textarea
            placeholder="Notes, dietary bits, or questions"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={disabled}
            rows={3}
          />
        </div>
      )
    }
  ];

  const current = steps[step];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick poll</CardTitle>
        <CardDescription>Tap through in ~30 seconds.</CardDescription>
      </CardHeader>
      <div className="space-y-4 p-6 pt-0">
        <p className="text-sm font-medium">Step {step + 1} of {steps.length}: {current.title}</p>
        {current.content}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0 || disabled}
          >
            Back
          </Button>
          {step === steps.length - 1 ? (
            <Button type="button" onClick={handleSubmit} disabled={disabled || isPending || !name}>
              {isPending ? 'Sending…' : 'Send response'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}
              disabled={disabled || (step === 0 && !name) || (step === 1 && selectedSlots.length === 0) || (step === 2 && !selectedVenue)}
            >
              Next
            </Button>
          )}
        </div>
        {disabled ? <p className="text-xs text-slate-500">Poll closed. Cut-off passed or plan confirmed.</p> : null}
      </div>
    </Card>
  );
}

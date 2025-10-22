'use client';

import { format } from 'date-fns';
import { useMemo, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { PlanPageData } from '@/types/plan';

interface WizardProps {
  plan: PlanPageData;
  disabled: boolean;
}

export function ThirtySecondWizard({ plan, disabled }: WizardProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [venue, setVenue] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const slotOptions = useMemo(() => plan.options_slots.map((slot) => new Date(slot)), [plan.options_slots]);

  function toggleSlot(slot: string) {
    setSelectedSlots((current) =>
      current.includes(slot) ? current.filter((item) => item !== slot) : [...current, slot]
    );
  }

  function submit() {
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
            choiceVenue: venue,
            attendance: 'in',
            pledgeAmount: cost ? Number(cost) : undefined,
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
      <Card className="border-brand bg-brand/5">
        <CardHeader>
          <CardTitle>All set!</CardTitle>
          <CardDescription>We’ll ping the host with your wizard choices.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const steps = [
    {
      title: 'How should we show your name?',
      content: (
        <Input
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={disabled}
        />
      )
    },
    {
      title: 'Tap the slots that fit',
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
      title: 'Where would you like to go?',
      content: (
        <div className="grid gap-3">
          {plan.options_venues.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setVenue(option)}
              className={`rounded-xl border px-3 py-2 text-left text-sm shadow-sm transition focus-visible:outline focus-visible:ring-2 ${venue === option ? 'border-brand bg-brand/10 text-brand-dark' : 'border-slate-200 bg-white'}`}
              disabled={disabled}
            >
              <p className="font-semibold">{option}</p>
            </button>
          ))}
        </div>
      )
    },
    {
      title: 'Costs & notes',
      content: (
        <div className="space-y-4">
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder={`Rough spend in ${plan.currency ?? 'GBP'}`}
            value={cost}
            onChange={(event) => setCost(event.target.value)}
            disabled={disabled}
          />
          <Textarea
            placeholder="Anything else the host should know"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={disabled}
          />
        </div>
      )
    }
  ];

  const current = steps[step];

  return (
    <Card>
      <CardHeader>
        <CardTitle>30-sec wizard</CardTitle>
        <CardDescription>We’ll pre-fill your vote and pledge.</CardDescription>
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
            <Button type="button" onClick={submit} disabled={disabled || isPending || !name || !venue || selectedSlots.length === 0}>
              {isPending ? 'Sending…' : 'Send wizard vote'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}
              disabled={disabled || (step === 0 && !name) || (step === 1 && selectedSlots.length === 0) || (step === 2 && !venue)}
            >
              Next
            </Button>
          )}
        </div>
        {disabled ? <p className="text-xs text-slate-500">Wizard disabled — plan is closed.</p> : null}
      </div>
    </Card>
  );
}

import { format } from 'date-fns';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPlanSummary, makeCopySnippets } from '@/lib/data';

interface PageProps {
  params: { id: string };
}

export default async function ConfirmedPage({ params }: PageProps) {
  const summary = await getPlanSummary(params.id);
  if (!summary) {
    notFound();
  }

  if (!summary.plan.decision) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not confirmed yet</CardTitle>
          <CardDescription>Host hasn’t locked in this plan.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const decision = summary.plan.decision;
  const slot = new Date(decision.slot);
  const snippets = await makeCopySnippets(params.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{summary.plan.title}</CardTitle>
          <CardDescription>
            {format(slot, 'EEE d MMM, h:mm a')} • {decision.venue}
          </CardDescription>
        </CardHeader>
        <div className="grid gap-4 p-6 pt-0 sm:grid-cols-2">
          <Info title="Map" value={decision.map_url ? <a href={decision.map_url} className="text-brand underline">Open map</a> : 'TBC'} />
          <Info title="Headcount" value={`${summary.headcount.in} coming (${summary.headcount.maybe} maybe)`} />
          <Info
            title="Estimate"
            value={
              decision.per_person_estimate
                ? `${summary.plan.currency ?? 'GBP'} ${Number(decision.per_person_estimate).toFixed(2)} per person`
                : 'TBC'
            }
          />
          <Info
            title="Notes"
            value={summary.notes.length ? summary.notes.map((note) => `${note.name}: ${note.note}`).join(', ') : 'None'}
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Share the locked plan</CardTitle>
          <CardDescription>Copy the snippets below straight into WhatsApp or iMessage.</CardDescription>
        </CardHeader>
        <div className="space-y-4 p-6 pt-0">
          <CopyButton label="WhatsApp" value={snippets.confirmation ?? ''} />
          <CopyButton label="Poll link" value={snippets.kickOff} />
          {snippets.reminder ? <CopyButton label="Reminder" value={snippets.reminder} /> : null}
        </div>
      </Card>
    </div>
  );
}

function Info({ title, value }: { title: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-100 p-4 text-sm">
      <p className="text-xs uppercase text-slate-500">{title}</p>
      <p className="mt-1 text-slate-900">{value}</p>
    </div>
  );
}

function CopyButton({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{value}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          if (value) {
            await navigator.clipboard.writeText(value);
          }
        }}
      >
        Copy
      </Button>
    </div>
  );
}

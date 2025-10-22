import { format, formatDistanceToNow } from 'date-fns';
import { notFound } from 'next/navigation';
import { QuickPoll } from '@/components/plan/quick-poll';
import { ThirtySecondWizard } from '@/components/plan/wizard';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPlanSummary } from '@/lib/data';

interface PageProps {
  params: { id: string };
}

export default async function PlanLandingPage({ params }: PageProps) {
  const summary = await getPlanSummary(params.id);
  if (!summary) {
    notFound();
  }

  const plan = summary.plan;
  const cutOff = new Date(plan.cut_off_utc);
  const isClosed = plan.status === 'confirmed' || Date.now() > cutOff.getTime();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
          <CardDescription>
            Hosted by {plan.host_name}. Vote before{' '}
            <span className="font-semibold text-slate-900">{format(cutOff, 'EEE d MMM, h:mm a')}</span>{' '}
            ({formatDistanceToNow(cutOff, { addSuffix: true })}).
          </CardDescription>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-200 px-3 py-1">Cut-off {cutOff.toLocaleString()}</span>
            <span className="rounded-full bg-slate-200 px-3 py-1">{summary.slotTallies.length} slots</span>
            <span className="rounded-full bg-slate-200 px-3 py-1">{summary.venueTallies.length} venues</span>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <QuickPoll plan={plan} disabled={isClosed} />
        <ThirtySecondWizard plan={plan} disabled={isClosed} />
      </div>
    </div>
  );
}

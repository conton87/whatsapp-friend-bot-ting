import { notFound } from 'next/navigation';
import { SummaryShell } from '@/components/plan/summary-shell';
import { getPlanSummary } from '@/lib/data';

interface PageProps {
  params: { id: string };
  searchParams: { host?: string };
}

export default async function SummaryPage({ params, searchParams }: PageProps) {
  const summary = await getPlanSummary(params.id);
  if (!summary) {
    notFound();
  }

  return <SummaryShell initialSummary={summary} hostToken={searchParams.host} />;
}

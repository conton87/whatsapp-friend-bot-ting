import { NextResponse } from 'next/server';
import { fetchPlanWithResponses, getPlanSummary } from '@/lib/data';

interface Params {
  params: { id: string };
}

export async function GET(_: Request, { params }: Params) {
  const plan = await fetchPlanWithResponses(params.id);
  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  const summary = await getPlanSummary(params.id);

  return NextResponse.json({ plan, summary });
}

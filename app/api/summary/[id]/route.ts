import { NextResponse } from 'next/server';
import { getPlanSummary } from '@/lib/data';

interface Params {
  params: { id: string };
}

export async function GET(_: Request, { params }: Params) {
  const summary = await getPlanSummary(params.id);
  if (!summary) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }
  return NextResponse.json(summary);
}

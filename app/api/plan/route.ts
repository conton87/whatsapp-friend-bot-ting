import { NextResponse } from 'next/server';
import { createPlan } from '@/lib/data';
import { planSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = planSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await createPlan(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

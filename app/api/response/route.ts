import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { upsertResponse } from '@/lib/data';
import { responseSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = responseSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const hdrs = headers();
    const ip = hdrs.get('x-forwarded-for') ?? hdrs.get('x-real-ip') ?? null;
    const id = await upsertResponse(parsed.data, ip);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

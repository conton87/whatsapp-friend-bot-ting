import Link from 'next/link';
import { CreatePlanForm } from '@/components/plan/create-plan-form';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-wide text-brand-dark">Vibe Code v1.0</p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Web-first meet-up organiser tailored for WhatsApp groups
        </h1>
        <p className="max-w-2xl text-lg text-slate-600">
          Spin up a plan, drop the quick poll in your chat, watch votes roll in live, and lock in the
          final vibe with a single tap.
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-white px-3 py-1 shadow">No logins</span>
          <span className="rounded-full bg-white px-3 py-1 shadow">Realtime tallies</span>
          <span className="rounded-full bg-white px-3 py-1 shadow">Host magic link</span>
        </div>
      </header>
      <CreatePlanForm />
      <footer className="text-sm text-slate-500">
        Built for WhatsApp sharing. Read the{' '}
        <Link href="/docs" className="font-semibold text-brand underline">
          delivery checklist
        </Link>
        .
      </footer>
    </div>
  );
}

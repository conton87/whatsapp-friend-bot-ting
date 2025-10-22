# Vibe Code v1.0

A web-first meet-up organiser built with Next.js 15, Supabase, and Tailwind. Create a plan, collect votes in WhatsApp, watch live tallies, and lock the final vibe with a host magic link.

## Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS for styling
- Supabase Postgres + Realtime (no auth; host magic link)
- SWR for live summary revalidation

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables**

   Create a `.env.local` file with:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE=<service-role-key>
   SITE_URL=http://localhost:3000
   ```

   `NEXT_PUBLIC_SUPABASE_ANON_KEY` is required for realtime subscriptions in the browser. Keep the service role secret on the server only (Next.js route handlers).

3. **Database**

   Apply the migration to Supabase:
   ```bash
   supabase db push
   ```

   The migration creates the `plans`, `responses`, `decisions`, and `host_tokens` tables, enables row-level security, adds guard triggers, and schedules a nightly purge for stale plans.

4. **Run the dev server**
   ```bash
   npm run dev
   ```

   The app is available at [http://localhost:3000](http://localhost:3000).

## Core flows

- **Create plan** – landing page lets hosts define slots, venues, and cut-off. Returns poll + host links with WhatsApp-ready copy.
- **Vote** – `/p/[id]` provides a quick poll and a guided 30-second wizard.
- **Summary** – `/p/[id]/summary` streams live tallies via Supabase Realtime. Hosts with the magic token can confirm the plan.
- **Confirmed** – `/p/[id]/confirmed` shows final details and shareable confirmation snippets.

## Delivery checklist

1. Create a plan via `/` and capture the host/poll links.
2. Submit at least three responses using the quick poll or wizard.
3. Open the summary page with the host token and watch realtime updates.
4. Confirm the plan and copy the WhatsApp confirmation message.

## Testing notes

- Route handlers use the Supabase service role; ensure secrets are configured in Vercel/production.
- Host confirmation requires at least two voters and the host token in `/p/[id]/summary?host=...`.
- After confirmation or cut-off the voting forms become read-only.

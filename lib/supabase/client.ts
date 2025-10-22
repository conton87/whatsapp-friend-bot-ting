'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';
import type { Database } from './types';

let client: SupabaseClient<Database> | null = null;

export function getBrowserClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!url || !key) {
    throw new Error('Supabase client requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  client = createClient<Database>(url, key, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 2 } }
  });

  return client;
}

export function useSupabase() {
  return useMemo(() => getBrowserClient(), []);
}

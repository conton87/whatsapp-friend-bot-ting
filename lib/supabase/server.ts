import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!url) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!serviceRole) {
  throw new Error('SUPABASE_SERVICE_ROLE is not set');
}

export const supabaseAdmin = createClient<Database>(url, serviceRole, {
  auth: { persistSession: false },
  global: { headers: { 'X-Client-Info': 'vibe-code-service' } }
});

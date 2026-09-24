import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Sadece sunucuda: RLS'i atlar. Asla istemci bileşenlerinde kullanmayın.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

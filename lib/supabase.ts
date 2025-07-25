import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for use in CLIENT COMPONENTS.
 * This client uses the public anonymous key.
 */
export const createClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

/**
 * Creates a Supabase client for use in SERVER-SIDE code (API Routes, Server Components).
 * This client uses the service role key for elevated privileges.
 */
export const createAdminClient = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase server-side environment variables');
  }
  return createSupabaseClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};
import { createClient } from '@supabase/supabase-js';

// Singleton Supabase client to avoid multiple instances
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

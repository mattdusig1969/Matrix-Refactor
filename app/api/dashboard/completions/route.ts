import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// --- DEBUGGING LOG ---
// This will show us what Vercel sees during the build.
console.log('Server-side SUPABASE_URL:', process.env.SUPABASE_URL);
// --- END DEBUGGING ---

// Use server-only variables for security and reliability in API routes.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase.from('responses').select('id, created_at').limit(1);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
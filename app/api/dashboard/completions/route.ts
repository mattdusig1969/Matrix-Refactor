import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// We will initialize the client inside the handler to ensure
// environment variables are available at request time, not build time.

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // This check provides a clear error if the variables are still missing.
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase environment variables are not set at runtime!');
    return NextResponse.json({ error: 'Server configuration error. Check Vercel environment variables.' }, { status: 500 });
  }

  // Initialize client inside the function
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabase.from('responses').select('id, created_at').limit(1);
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
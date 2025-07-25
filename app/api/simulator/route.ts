import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This API route likely handles saving audience configurations.
// We will defer client initialization to avoid Vercel build errors.

export async function POST(req: Request) {
  const { surveyId, audienceName, selectedOptions } = await req.json();

  // --- Runtime Environment Variable Check & Client Initialization ---
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing server environment variables in simulator API route');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  // --- End Initialization ---

  try {
    const { data, error } = await supabase
      .from('audiences')
      .insert([{ survey_id: surveyId, name: audienceName, targeting_criteria: selectedOptions }])
      .select();

    if (error) {
      console.error('Error saving audience:', error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

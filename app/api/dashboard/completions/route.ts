import { createAdminClient } from '@/lib/supabase'; // <-- Import the admin helper
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient(); // <-- Use the new admin helper function

    const { data, error } = await supabase
      .from('survey_responses')
      .select('created_at');

    if (error) {
      console.error('Error fetching completions:', error);
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API_COMPLETIONS_ERROR]', errorMessage);
    return NextResponse.json({ error: 'Failed to fetch completion data', details: errorMessage }, { status: 500 });
  }
}
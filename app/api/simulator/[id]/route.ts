import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const surveyId = params.id;

  if (!surveyId) {
    return NextResponse.json({ error: 'Survey ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('surveys')
      .select('survey_mode')
      .eq('id', surveyId)
      .single();

    if (error) {
      console.error('Error fetching survey mode:', error);
      return NextResponse.json({ error: 'Failed to fetch survey data' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

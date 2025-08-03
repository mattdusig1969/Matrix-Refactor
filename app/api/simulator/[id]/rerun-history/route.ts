import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const surveyId = params.id;
    const { data, error } = await supabase
      .from('simulation_runs')
      .select('*')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    // Patch: persona_count is the number of unique personas rerun, not persona_count * number_runs
    // Just return as is, UI will show persona_count only
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch rerun history' }, { status: 500 });
  }
}

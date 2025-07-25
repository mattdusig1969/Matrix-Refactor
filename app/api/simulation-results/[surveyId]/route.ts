import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request, { params }: { params: { surveyId: string } }) {
  const { surveyId } = params;
  const { data, error } = await supabase
    .from('simulation_results')
    .select('*')
    .eq('survey_id', surveyId)
    .order('respondent_number');
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify(data), { status: 200 });
}
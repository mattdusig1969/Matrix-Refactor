import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { count: surveyCount } = await supabase
    .from('Surveys')
    .select('*', { count: 'exact', head: true });

  const { count: moduleCount } = await supabase
    .from('Modules')
    .select('*', { count: 'exact', head: true });

  const { count: responseCount } = await supabase
    .from('ModuleResponses')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    surveys: surveyCount || 0,
    modules: moduleCount || 0,
    responses: responseCount || 0,
  });
}

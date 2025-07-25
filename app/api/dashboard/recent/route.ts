import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('ModuleResponses')
    .select(`
      id,
      created_at,
      age,
      gender,
      Modules (
        title,
        Surveys ( title )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) return NextResponse.json([], { status: 500 });

  const formatted = data.map((entry) => ({
    id: entry.id,
    created_at: entry.created_at,
    age: entry.age,
    gender: entry.gender,
    module_title: entry.Modules?.[0]?.title || 'Untitled Module',
    survey_title: entry.Modules?.[0]?.Surveys?.[0]?.title || 'Untitled Survey',
  }));

  return NextResponse.json(formatted);
}

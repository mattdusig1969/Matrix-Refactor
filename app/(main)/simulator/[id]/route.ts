import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { data, error } = await supabase
      .from('surveys')
      .select('survey_mode')
      .eq('id', id)
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch survey mode' }, { status: 500 });
  }
}

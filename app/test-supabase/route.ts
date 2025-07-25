// app/test-supabase/route.ts
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.from('Surveys').select('*').limit(1);

  return Response.json({
    status: error ? 'error' : 'success',
    message: error ? error.message : 'Connection successful!',
    data: data || [],
  });
}

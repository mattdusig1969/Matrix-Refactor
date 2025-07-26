import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false
    }
  }
);


export async function GET() {
  const { data, error } = await supabase
    .from('usersessions')
    .select('created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching data:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  // ... rest of the function remains the same
  const counts: Record<string, number> = {};
  data.forEach((item) => {
    const date = new Date(item.created_at).toISOString().split('T')[0];
    counts[date] = (counts[date] || 0) + 1;
  });

  const result = Object.entries(counts).map(([date, count]) => ({ date, count }));

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
}
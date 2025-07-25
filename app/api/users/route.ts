import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Fetch all users from Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format users for the frontend
    const formattedUsers = (data.users || []).map(user => ({
      id: user.id,
      first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Unknown',
      last_name: user.user_metadata?.last_name || '',
      email: user.email,
      created_at: user.created_at
    }));

    return NextResponse.json({ users: formattedUsers });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

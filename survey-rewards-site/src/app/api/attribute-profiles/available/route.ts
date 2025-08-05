import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/attribute-profiles/available?panelist_id=xxx&country_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const panelistId = searchParams.get('panelist_id');
    const countryId = searchParams.get('country_id');

    if (!panelistId || !countryId) {
      return NextResponse.json(
        { error: 'Missing panelist_id or country_id' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc(
      'get_available_attribute_profiles_for_panelist',
      {
        panelist_uuid: panelistId,
        user_country_id: countryId
      }
    );

    if (error) {
      console.error('Error fetching available profiles:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profiles: data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

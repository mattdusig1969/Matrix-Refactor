import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/attribute-profiles/questions?profile_type=basic&country_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileType = searchParams.get('profile_type');
    const countryId = searchParams.get('country_id');

    if (!profileType || !countryId) {
      return NextResponse.json(
        { error: 'Missing profile_type or country_id' },
        { status: 400 }
      );
    }

    if (!['basic', 'location', 'personal'].includes(profileType)) {
      return NextResponse.json(
        { error: 'Invalid profile_type. Must be: basic, location, or personal' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc(
      'get_attribute_questions_for_profile',
      {
        profile_type_param: profileType,
        user_country_id: countryId
      }
    );

    if (error) {
      console.error('Error fetching profile questions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      profileType,
      questions: data || []
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/attribute-profiles/submit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { panelist_id, profile_type, responses, completion_time_seconds } = body;

    if (!panelist_id || !profile_type || !responses) {
      return NextResponse.json(
        { error: 'Missing required fields: panelist_id, profile_type, responses' },
        { status: 400 }
      );
    }

    // Get the profile ID for this profile type
    const { data: profileData, error: profileError } = await supabase
      .from('attribute_profiles')
      .select('id, reward_amount')
      .eq('profile_type', profile_type)
      .eq('is_active', true)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'Profile type not found' },
        { status: 404 }
      );
    }

    // Insert the response
    const { data: responseData, error: responseError } = await supabase
      .from('panelist_attribute_responses')
      .insert({
        panelist_id,
        attribute_profile_id: profileData.id,
        responses: responses,
        completion_time_seconds: completion_time_seconds || null
      })
      .select()
      .single();

    if (responseError) {
      if (responseError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Profile already completed' },
          { status: 409 }
        );
      }
      console.error('Error saving response:', responseError);
      return NextResponse.json({ error: responseError.message }, { status: 500 });
    }

    // Create reward entry
    const { error: rewardError } = await supabase
      .from('panelist_earnings')
      .insert({
        panelist_id,
        transaction_type: 'earning',
        amount: profileData.reward_amount,
        description: `Completed ${profile_type} profile`,
        source: 'profile_completion',
        status: 'completed'
      });

    if (rewardError) {
      console.error('Error creating reward:', rewardError);
      // Don't fail the whole request if reward creation fails
    }

    return NextResponse.json({
      success: true,
      response_id: responseData.id,
      reward_amount: profileData.reward_amount,
      message: `${profile_type} profile completed successfully!`
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

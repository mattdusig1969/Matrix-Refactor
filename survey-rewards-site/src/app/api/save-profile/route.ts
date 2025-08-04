import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a Supabase client with service role key for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { panelistId, profileData } = body

    console.log('API: Received request for panelistId:', panelistId)
    console.log('API: ProfileData:', profileData)

    if (!panelistId || !profileData) {
      console.log('API: Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: panelistId, profileData' },
        { status: 400 }
      )
    }

    // Check if service role key is configured
    if (!supabaseServiceKey || supabaseServiceKey === 'your_service_role_key_here') {
      console.error('API: Service role key not configured - using anon key as fallback')
      // Return success but indicate that direct database insert should be used
      return NextResponse.json(
        { error: 'Server configuration error: Service role key not set' },
        { status: 500 }
      )
    }

    // Validate that the panelist exists with better error handling
    console.log('API: Looking up panelist with ID:', panelistId)
    const { data: panelistExists, error: panelistError } = await supabaseAdmin
      .from('panelists')
      .select('id, email, first_name, last_name')
      .eq('id', panelistId)
      .single()

    console.log('API: Panelist lookup result:', { data: panelistExists, error: panelistError })

    if (panelistError) {
      console.error('API: Panelist lookup error:', panelistError)
      return NextResponse.json(
        { error: `Panelist lookup failed: ${panelistError.message}` },
        { status: 403 }
      )
    }

    if (!panelistExists) {
      console.error('API: Panelist not found')
      return NextResponse.json(
        { error: 'Panelist not found in database' },
        { status: 403 }
      )
    }

    console.log('API: Panelist found, proceeding with profile insert')

    // Insert the profile data using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('panelist_profiles')
      .insert({
        panelist_id: panelistId,
        profiling_survey_id: profileData.profiling_survey_id,
        data: profileData.data,
        completed_at: profileData.completed_at,
        survey_type: profileData.survey_type || 'attribute_profile'
      })
      .select()

    if (error) {
      console.error('Error inserting profile data:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('API: Profile saved successfully:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

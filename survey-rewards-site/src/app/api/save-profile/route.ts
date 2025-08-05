import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

    // First validate that the panelist exists
    console.log('API: Validating panelist exists...')
    const { data: panelistExists, error: panelistError } = await supabase
      .from('panelists')
      .select('id, email, first_name, last_name')
      .eq('id', panelistId)
      .single()

    console.log('API: Panelist lookup result:', { data: panelistExists, error: panelistError })

    if (panelistError || !panelistExists) {
      console.error('API: Panelist not found or error:', panelistError)
      return NextResponse.json(
        { error: 'Panelist validation failed' },
        { status: 403 }
      )
    }

    console.log('API: Panelist validated, attempting profile save...')

    // Check if profile already exists for this panelist and survey
    const { data: existingProfile, error: checkError } = await supabase
      .from('panelist_profiles')
      .select('id')
      .eq('panelist_id', panelistId)
      .eq('profiling_survey_id', profileData.profiling_survey_id)
      .maybeSingle()

    if (checkError) {
      console.error('API: Error checking existing profile:', checkError)
    }

    let result;
    if (existingProfile) {
      // Update existing profile
      console.log('API: Updating existing profile...')
      result = await supabase
        .from('panelist_profiles')
        .update({
          data: profileData.data,
          completed_at: profileData.completed_at,
          survey_type: profileData.survey_type || 'attribute_profile'
        })
        .eq('id', existingProfile.id)
        .select()
    } else {
      // Insert new profile
      console.log('API: Inserting new profile...')
      result = await supabase
        .from('panelist_profiles')
        .insert({
          panelist_id: panelistId,
          profiling_survey_id: profileData.profiling_survey_id,
          data: profileData.data,
          completed_at: profileData.completed_at,
          survey_type: profileData.survey_type || 'attribute_profile'
        })
        .select()
    }

    const { data, error } = result

    if (error) {
      console.error('API: Database operation failed:', error)
      // Return specific error information to help debug
      return NextResponse.json(
        { 
          error: `Database error: ${error.message}`, 
          code: error.code,
          details: error.details,
          hint: error.hint 
        },
        { status: 500 }
      )
    }

    console.log('API: Profile saved successfully:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}

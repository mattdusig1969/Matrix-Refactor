import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const body = await request.json();
    
    console.log('Received body:', body); // Debug log
    console.log('Creator ID in body:', body.creator_id); // Debug log

    // Validate required fields
    if (!body.title || !body.questions || !body.client_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const insertData = {
      title: body.title,
      description: body.description,
      questions: body.questions,
      target_n: body.target_n,
      client_id: body.client_id,
      survey_mode: body.survey_mode,
      status: body.status || 'live',
      creator_id: body.creator_id,
      created_at: new Date().toISOString()
    };

    console.log('Inserting data:', insertData); // Debug log

    const { data, error } = await supabase
      .from('surveys')
      .insert([insertData])
      .select('id')
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ survey_id: data.id });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
  }
}

export const runtime = 'edge';

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// NOTE: We are moving client initialization inside the POST handler
// to avoid build-time errors with environment variables on Vercel.

export async function POST(req: Request, { params }: { params: { surveyId: string } }) {
  const { prompt, numberOfRespondents, persona } = await req.json();
  const { surveyId } = params;

  // --- Runtime Environment Variable Check & Client Initialization ---
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
    console.error('Missing server environment variables in simulation route');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const openai = new OpenAI({ apiKey: openaiApiKey });
  // --- End Initialization ---

  try {
    // 1. Create a new simulation entry
    const { data: simulationData, error: simulationError } = await supabase
      .from('simulations')
      .insert({
        survey_id: surveyId,
        prompt_text: prompt,
        persona_info: persona,
        respondent_count: numberOfRespondents,
      })
      .select()
      .single();

    if (simulationError) throw simulationError;

    // 2. Call OpenAI to get the simulated responses
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a helpful assistant designed to output JSON.' },
        { role: 'user', content: prompt },
      ],
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    // 3. Save the results back to Supabase
    if (result.responses && Array.isArray(result.responses)) {
      const responsesToInsert = result.responses.map((res: any) => ({
        simulation_id: simulationData.id,
        response_data: res,
      }));

      const { error: insertError } = await supabase.from('simulation_responses').insert(responsesToInsert);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ simulationId: simulationData.id, results: result });
  } catch (error) {
    console.error('Simulation API Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
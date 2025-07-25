import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for insert
);

export async function POST(req: Request) {
  const body = await req.json();
  const { survey_id, n_completes = 10, archetype = "Generic" } = body;

  if (!survey_id) {
    return NextResponse.json({ error: 'Missing survey_id' }, { status: 400 });
  }

  // Step 1: Fetch all questions for this survey
  const { data: questions, error: questionError } = await supabase
    .from('questions')
    .select('id, answer_option')
    .eq('survey_id', survey_id);

  if (questionError || !questions) {
    return NextResponse.json({ error: 'Failed to load questions', details: questionError }, { status: 500 });
  }

  const results = [];

  for (let i = 0; i < n_completes; i++) {
    const session_id = uuidv4();
    const respondent_id = uuidv4();

    const demoProfile = {
      age_range: getRandomFrom(['18-24', '25-34', '35-44']),
      gender: getRandomFrom(['Male', 'Female', 'Other']),
    };

    const answers = questions.map((q) => ({
      question_id: q.id,
      answer: getRandomAnswer(q.answer_option)
    }));

    // Save simulated result
    const { error: insertError } = await supabase
      .from('simulation_results')
      .insert({
        id: respondent_id,
        session_id,
        survey_id,
        answers,
        demographicProfile: demoProfile,
        archetype,
        created_at: new Date().toISOString()
      });

    // Track complete
    const { error: completeError } = await supabase
      .from('SurveyCompletions')
      .insert({
        id: uuidv4(),
        user_session_id: session_id,
        survey_id,
        demo_attributes: demoProfile,
        inserted_at: new Date().toISOString()
      });

    if (!insertError && !completeError) {
      results.push({ session_id, demoProfile });
    }
  }

  return NextResponse.json({ success: true, completes: results.length, results });
}

function getRandomFrom(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomAnswer(answer_option: any) {
  if (!Array.isArray(answer_option)) return 'N/A';
  return getRandomFrom(answer_option);
}

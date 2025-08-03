import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateAIResponse({ persona, question, questionType }: any) {
  // Use OpenAI to generate answer and justification
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: `You are a persona with the following profile: ${JSON.stringify(persona)}. Answer the following survey question as this persona.` },
      { role: 'user', content: question },
    ],
  });
  const answerText = completion.choices?.[0]?.message?.content || '';
  // Optionally, you can parse answer/justification if your prompt returns them separately
  return {
    answer: answerText,
    justification: '', // You may want to update your prompt to return justification
  };
}

async function runPersonaSimulation({ persona, personaId, survey, runNumber, simulationRunId, respondentNumber }: any) {
  const answersArr = [];
  let confidenceSum = 0;
  for (const question of survey.questions) {
    // Call OpenAI for real answer and justification
    const response = await generateAIResponse({
      persona,
      question: question.question_text,
      questionType: question.question_type
    });
    answersArr.push({
      question_number: question.question_number ?? question.id,
      question_text: question.question_text,
      question_type: question.question_type,
      answer: response.answer,
      justification: response.justification
    });
    // Optionally, you can add confidence if your OpenAI response includes it
    // confidenceSum += response.confidence ?? 0;
  }
  const avgConfidence = answersArr.length > 0 ? confidenceSum / answersArr.length : null;

  const { data: storedResponse, error: insertError } = await supabase
    .from('simulation_results')
    .insert({
      survey_id: survey.id,
      persona_id: personaId,
      persona_data: persona,
      answers: answersArr,
      run_number: runNumber,
      simulation_run_id: simulationRunId,
      demographicprofile: persona.demographicprofile ?? null,
      archetype: persona.archetype ?? null,
      respondent_number: respondentNumber ?? personaId,
      confidence: avgConfidence // Store overall confidence at top level
    })
    .select()
    .single();

  if (insertError) {
    console.error('Supabase insert error:', insertError);
    throw insertError;
  } else {
    console.log('Inserted simulation_result row:', storedResponse?.id);
  }
  return storedResponse;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const surveyId = params.id;
    const { searchParams } = new URL(req.url);
    const run_id = searchParams.get('run_id');
    if (!run_id) {
      return NextResponse.json({ error: 'Missing run_id' }, { status: 400 });
    }

    // Get simulation run record
    const { data: runRecord, error: runError } = await supabase
      .from('simulation_runs')
      .select('id, persona_count')
      .eq('id', run_id)
      .single();
    if (runError || !runRecord) {
      return NextResponse.json({ error: 'Simulation run not found' }, { status: 404 });
    }

    // Count completed personas for this run
    const { count: personas_completed, error: countError } = await supabase
      .from('simulation_results')
      .select('persona_id', { count: 'exact', head: true })
      .eq('simulation_run_id', run_id);
    if (countError) {
      return NextResponse.json({ error: 'Failed to count completed personas' }, { status: 500 });
    }

    return NextResponse.json({
      personas_completed: personas_completed || 0,
      persona_count: runRecord.persona_count
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to get rerun progress' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const surveyId = params.id;
    const { rerunCount, purpose = 'confidence_testing' } = await req.json();

    const { data: originalPersonas, error: personaError } = await supabase
      .from('simulation_results')
      .select('persona_data, persona_id, respondent_number')
      .eq('survey_id', surveyId)
      .eq('run_number', 1);

    if (personaError) throw personaError;
    if (!originalPersonas || originalPersonas.length === 0) {
      return NextResponse.json({ error: 'No original personas found for this survey' }, { status: 404 });
    }

    const { data: surveyData, error: surveyError } = await supabase
      .from('surveys')
      .select('*, questions(*)')
      .eq('id', surveyId)
      .single();

    if (surveyError) throw surveyError;
    if (!surveyData || !surveyData.questions || surveyData.questions.length === 0) {
      return NextResponse.json({ error: 'Survey or questions not found' }, { status: 404 });
    }

    // Find the latest run_number for this survey
    const { data: latestRun, error: latestRunError } = await supabase
      .from('simulation_runs')
      .select('run_number')
      .eq('survey_id', surveyId)
      .order('run_number', { ascending: false })
      .limit(1)
      .single();
    // Always start reruns at run_number 2 (first simulation is 1)
    const startingRunNumber = latestRun && typeof latestRun.run_number === 'number' && latestRun.run_number >= 1
      ? latestRun.run_number + 1
      : 2;

    let lastRunRecord = null;
    const results = [];

    for (let i = 0; i < rerunCount; i++) {
      const runNumber = startingRunNumber + i;
      const { data: runRecord, error: runError } = await supabase
        .from('simulation_runs')
        .insert({
          survey_id: surveyId,
          run_number: runNumber,
          purpose,
          persona_count: originalPersonas.length,
          number_runs: rerunCount // Store the number of reruns for this run
        })
        .select()
        .single();
      if (runError || !runRecord) {
        console.error('Failed to create simulation run:', runError);
        return NextResponse.json({ error: 'Failed to create simulation run' }, { status: 500 });
      }
      lastRunRecord = runRecord;

      for (const originalPersona of originalPersonas) {
        const simulationResult = await runPersonaSimulation({
          persona: originalPersona.persona_data,
          personaId: originalPersona.persona_id,
          survey: surveyData,
          runNumber,
          simulationRunId: runRecord.id,
          respondentNumber: originalPersona.respondent_number
        });
        results.push(simulationResult);
      }
    }

    // Temporarily disable confidence calculation until it's fixed
    // await calculateConfidenceWithReruns(surveyId);

    return NextResponse.json({
      run_id: lastRunRecord?.id,
      persona_count: originalPersonas.length,
      success: true,
      message: `Completed ${rerunCount} additional runs for ${originalPersonas.length} personas`,
      totalNewResponses: results.length
    });

  } catch (error: any) {
    console.error('Rerun simulation error:', error);
    return NextResponse.json({ error: error?.message || 'An unknown error occurred' }, { status: 500 });
  }
}
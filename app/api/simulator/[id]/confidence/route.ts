
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getConfidenceLabel(pct: number) {
  if (pct >= 0.9) return { label: 'High', color: 'green' };
  if (pct >= 0.7) return { label: 'Medium', color: 'yellow' };
  return { label: 'Low', color: 'red' };
}


export async function GET(request: Request, { params }: { params: { id: string } }) {
  const surveyId = params.id;
  if (!surveyId) {
    return NextResponse.json({ error: 'Survey ID is required' }, { status: 400 });
  }

  // Fetch all simulation results for this survey
  const { data, error } = await supabase
    .from('simulation_results')
    .select('*')
    .eq('survey_id', surveyId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'No data found' }, { status: 404 });
  }

  // Fetch questions for this survey to identify user input questions
  const { data: surveyData, error: surveyError } = await supabase
    .from('surveys')
    .select('questions')
    .eq('id', surveyId)
    .single();
  if (surveyError) {
    return NextResponse.json({ error: surveyError.message }, { status: 500 });
  }
  let questionsArr: any[] = [];
  if (typeof surveyData?.questions === 'string') {
    try {
      const parsed = JSON.parse(surveyData.questions);
      if (Array.isArray(parsed)) {
        questionsArr = parsed;
      }
    } catch (e) {
      // fallback: not valid JSON
    }
  } else if (Array.isArray(surveyData?.questions)) {
    questionsArr = surveyData.questions;
  }
  // Get set of user input question_numbers
  const userInputQuestionNumbers = new Set(
    questionsArr
      .filter((q: any) => q.question_type === 'user_input')
      .map((q: any) => String(q.question_number))
  );

  // Flatten all answers into individual rows with persona_id, run_number, question_number, answer
  type FlatAnswer = { persona_id: string; run_number: number; question_number: number; answer: string };
  const flatAnswers: FlatAnswer[] = [];
  for (const row of data) {
    let answersArr: any[] = [];
    try {
      answersArr = typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers;
    } catch (e) {
      answersArr = [];
    }
    for (const ans of answersArr) {
      flatAnswers.push({
        persona_id: row.persona_id,
        run_number: row.run_number,
        question_number: ans.question_number,
        answer: ans.answer
      });
    }
  }

  // Group by persona and run_number
  const personaRuns = {};
  for (const ans of flatAnswers) {
    const persona = ans.persona_id;
    const run = ans.run_number;
    if (!personaRuns[persona]) personaRuns[persona] = {};
    if (!personaRuns[persona][run]) personaRuns[persona][run] = [];
    (personaRuns[persona][run] as FlatAnswer[]).push(ans);
  }

  // For each question, calculate agreement rate across runs for each persona
  const questionStats = {};
  let totalQuestions = 0;
  let totalStable = 0;
  for (const persona in personaRuns) {
    const runs = Object.values(personaRuns[persona]) as FlatAnswer[][];
    if (runs.length === 0) continue;
    // Get all unique question_numbers for this persona
    const questions = Array.from(new Set(runs.flat().map((q: FlatAnswer) => q.question_number)));
    for (const qNum of questions) {
      // Collect all answers for this question across runs
      const answers = runs.map((runArr: FlatAnswer[]) => {
        const q = runArr.find((x: FlatAnswer) => x.question_number === qNum);
        return q ? q.answer : null;
      }).filter(x => x !== null);
      // Calculate agreement rate
      const counts: Record<string, number> = {};
      for (const a of answers) counts[a as string] = (counts[a as string] || 0) + 1;
      const maxCount = Math.max(...Object.values(counts).map(Number));
      const pct = answers.length > 0 ? maxCount / answers.length : 0;
      if (!questionStats[qNum]) questionStats[qNum] = { total: 0, stable: 0 };
      (questionStats[qNum] as { total: number; stable: number }).total += 1;
      if (pct >= 0.9) (questionStats[qNum] as { total: number; stable: number }).stable += 1;
    }
  }

  // Build per-question confidence
  const perQuestion = Object.entries(questionStats).map(([qNum, stat]) => {
    const s = stat as { total: number; stable: number };
    const pct = s.total > 0 ? s.stable / s.total : 0;
    const { label, color } = getConfidenceLabel(pct);
    return { question_number: qNum, stability: pct, label, color };
  });

  // Exclude user input questions from overall calculation
  const filteredPerQuestion = perQuestion.filter(q => !userInputQuestionNumbers.has(String(q.question_number)));
  const filteredTotalQuestions = filteredPerQuestion.length;
  const filteredTotalStable = filteredPerQuestion.reduce((acc, q) => acc + (q.stability >= 0.9 ? 1 : 0), 0);
  const overallPct = filteredTotalQuestions > 0 ? filteredTotalStable / filteredTotalQuestions : 0;
  const { label, color } = getConfidenceLabel(overallPct);

  // For debugging
  console.log('DEBUG: totalQuestions', filteredTotalQuestions, 'totalStable', filteredTotalStable, 'overallPct', overallPct);
  // Add total_responses and flagged_count for frontend compatibility
  return NextResponse.json({
    overall: {
      stability: overallPct,
      label,
      color,
      total_responses: filteredTotalQuestions,
      flagged_count: 0 // Placeholder, update if you have flagging logic
    },
    perQuestion
  });
}

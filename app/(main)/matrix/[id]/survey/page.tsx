import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import SurveyClient from './survey-client';

// MATRIX: Async Server Component for Survey
export default async function MatrixSurveyPage({ params }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Fetch all data server-side
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .select('survey_mode, questions')
    .eq('id', params.id)
    .single();

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, question_text, question_type, answer_option, question_order, question_options, question_number')
    .eq('survey_id', params.id)
    .order('question_order', { ascending: true });

  // Handle potential errors during data fetching
  if (surveyError || questionsError) {
    console.error("Data fetching error:", surveyError || questionsError);
    return <div className="p-8 text-center text-red-500">Failed to load matrix survey data.</div>;
  }

  // Transform questions and update in database if needed
  if (questions?.length) {
    const transformedQuestions = questions.map((question, index) => {
      let answer_option = question.answer_option;
      // Always set answer_option for rating_scale based on scale in question_text
      if (question.question_type === 'rating_scale') {
        let scaleMatch = question.question_text.match(/([0-9]+)\s*[-–—]\s*([0-9]+)/);
        let scaleArr = ["1","2","3","4","5"];
        if (scaleMatch) {
          const min = parseInt(scaleMatch[1], 10);
          const max = parseInt(scaleMatch[2], 10);
          if (!isNaN(min) && !isNaN(max) && min < max) {
            scaleArr = Array.from({length: max - min + 1}, (_, i) => String(min + i));
          }
        }
        answer_option = JSON.stringify(scaleArr);
      }
      return {
        ...question,
        question_number: String(index + 1),
        question_order: index + 1,
        answer_option
      };
    });

    for (const question of transformedQuestions) {
      try {
        const { error } = await supabase
          .from('questions')
          .update({ 
            question_number: question.question_number,
            question_order: question.question_order,
            answer_option: question.answer_option
          })
          .eq('id', question.id);
        if (error) {
          console.error(`Failed to update question id ${question.id}:`, error);
        }
      } catch (err) {
        console.error(`Exception updating question id ${question.id}:`, err);
      }
    }

    return <SurveyClient initialSurvey={survey} initialQuestions={transformedQuestions} params={params} />;
  }

  // If no questions, return empty state
  return <SurveyClient initialSurvey={survey} initialQuestions={[]} params={params} />;
}

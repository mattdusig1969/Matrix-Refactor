import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import SurveyClient from './survey-client';

// This is an async Server Component. It runs only on the server.
export default async function SurveyPage({ params }) {
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
    return <div className="p-8 text-center text-red-500">Failed to load survey data.</div>;
  }

  // Transform questions and update in database if needed
  if (questions?.length) {
    const transformedQuestions = questions.map((question, index) => ({
      ...question,
      question_number: String(index + 1),
      question_order: index + 1
    }));

    // Update each question with its new number
    const updatePromises = transformedQuestions.map(question =>
      supabase
        .from('questions')
        .update({ 
          question_number: question.question_number,
          question_order: question.question_order 
        })
        .eq('id', question.id)
    );

    await Promise.all(updatePromises);

    // Return transformed questions to the client
    return <SurveyClient initialSurvey={survey} initialQuestions={transformedQuestions} params={params} />;
  }

  // If no questions, return empty state
  return <SurveyClient initialSurvey={survey} initialQuestions={[]} params={params} />;
}
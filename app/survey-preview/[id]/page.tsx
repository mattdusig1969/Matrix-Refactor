import PreviewClientSurvey from './preview-client';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export default async function PreviewPage({ params, searchParams }) {
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

  // Get survey and design IDs
  const survey_id = params.id;
  const design_id = searchParams?.design_id;
  const headline = searchParams?.headline ? decodeURIComponent(searchParams.headline) : 'Default Headline';

  // Create a unique preview session ID to avoid conflicts
  const user_session_id = 'preview_' + uuidv4();

  // Fetch survey targeting and questions
  const { data: surveyData } = await supabase
    .from('surveys')
    .select('targeting, country_id, questions')
    .eq('id', survey_id)
    .single();
  const targeting = surveyData?.targeting?.[surveyData.country_id] || {};
  const country_id = surveyData?.country_id;

  // For preview, just get the first module's questions
  let questionsData = [];
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('survey_id', survey_id)
    .limit(1);

  if (modules && modules.length > 0) {
    const { data: moduleQuestions } = await supabase
      .from('questions')
      .select('id, question_text, question_type, question_order, answer_option')
      .eq('module_id', modules[0].id)
      .order('question_order', { ascending: true });

    if (moduleQuestions) {
      questionsData = moduleQuestions.map(q => {
        let answers = [];
        if (q.answer_option && typeof q.answer_option === 'string') {
          try {
            answers = JSON.parse(q.answer_option);
          } catch (e) {
            console.error(`Could not parse answer_option for question ${q.id}:`, q.answer_option);
          }
        }
        return {
          ...q,
          answers: Array.isArray(answers) ? answers : [],
        };
      });
    }
  }

  // Fetch all possible options for targeting questions and attribute questions
  const allPossibleOptions = {};
  let attributeQuestions = [];
  if (country_id) {
    const [demo, geo, psycho] = await Promise.all([
      supabase.from('demoattributes').select('field_name, value, questiontext').eq('country_id', country_id),
      supabase.from('geoattributes').select('field_name, value, questiontext').eq('country_id', country_id),
      supabase.from('psychoattributes').select('field_name, value, questiontext').eq('country_id', country_id)
    ]);

    const allAttributes = [...(demo.data || []), ...(geo.data || []), ...(psycho.data || [])];
    attributeQuestions = allAttributes;

    for (const attr of allAttributes) {
      if (!allPossibleOptions[attr.field_name]) {
        allPossibleOptions[attr.field_name] = new Set();
      }
      allPossibleOptions[attr.field_name].add(attr.value);
    }

    for (const key in allPossibleOptions) {
      allPossibleOptions[key] = Array.from(allPossibleOptions[key]);
    }
  }

  // For preview, show all targeting questions
  const targetingQuestions = [];
  for (const key in targeting) {
    if (Object.prototype.hasOwnProperty.call(targeting, key)) {
      targetingQuestions.push({ type: 'Demographics', key });
    }
  }

  // Fetch design CSS
  const { data: designData } = await supabase
    .from('surveydesigns')
    .select('css')
    .eq('id', design_id)
    .single();
  const designCSS = designData?.css || '';

  return (
    <PreviewClientSurvey
      survey_id={survey_id}
      design_id={design_id}
      user_session_id={user_session_id}
      targeting={targeting}
      allPossibleOptions={allPossibleOptions}
      questionsData={questionsData || []}
      designCSS={designCSS}
      sessionData={null}
      targetingQuestions={targetingQuestions}
      attributeQuestions={attributeQuestions}
      headline={headline}
    />
  );
}

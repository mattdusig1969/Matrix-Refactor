import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { surveyId: string; modelId: string } }
) {
  try {
    const { surveyId, modelId } = params;

    if (!surveyId || !modelId) {
      return NextResponse.json(
        { error: 'Missing surveyId or modelId' },
        { status: 400 }
      );
    }

    // Count completed responses for this model and survey
    const { data: completedResults, error: completedError } = await supabase
      .from('simulation_results')
      .select('id')
      .eq('survey_id', surveyId)
      .eq('model', modelId);

    if (completedError) {
      console.error('Error fetching completed results:', completedError);
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    // Get the total number of OpenAI results to determine expected total
    const { data: openAIResults, error: openAIError } = await supabase
      .from('simulation_results')
      .select('id')
      .eq('survey_id', surveyId)
      .eq('model', 'OpenAI');

    if (openAIError) {
      console.error('Error fetching OpenAI results:', openAIError);
      return NextResponse.json(
        { error: 'Failed to fetch baseline data' },
        { status: 500 }
      );
    }

    const completed = completedResults?.length || 0;
    const total = openAIResults?.length || 3; // Default to 3 if no OpenAI results found

    return NextResponse.json({
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      isComplete: completed >= total
    });

  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

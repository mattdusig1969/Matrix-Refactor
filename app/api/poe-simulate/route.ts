import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import aiService from '@/lib/poe-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    console.log('=== POE SIMULATE API CALLED ===');
    const body = await req.json();
    console.log('API Request Body:', JSON.stringify(body, null, 2));
    
    const { 
      surveyId, 
      models, 
      existingPersonas, 
      questions, 
      audienceDescription,
      surveyTitle 
    } = body;

    console.log('Destructured values:', {
      surveyId,
      models,
      questionsLength: questions?.length,
      audienceDescription,
      surveyTitle
    });

    console.log('CLAUDE_API_KEY exists:', !!process.env.CLAUDE_API_KEY);
    console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);

    if (!surveyId || !models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: surveyId, models' },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: questions' },
        { status: 400 }
      );
    }
    const results = [];

    // Get existing simulation results to reuse personas
    const { data: existingResults, error: fetchError } = await supabase
      .from('simulation_results')
      .select('*')
      .eq('survey_id', surveyId)
      .eq('model', 'OpenAI');

    if (fetchError) {
      console.error('Error fetching existing results:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch existing simulation data' },
        { status: 500 }
      );
    }

    if (!existingResults || existingResults.length === 0) {
      return NextResponse.json(
        { error: 'No existing OpenAI simulations found to replicate' },
        { status: 400 }
      );
    }

    // For each selected model
    for (const model of models) {
      if (model === 'OpenAI') continue; // Skip OpenAI as it's already done

      console.log(`Running simulations for model: ${model}`);
      
      // Debug: Check questions validity
      console.log('Questions check:', {
        questionsExists: !!questions,
        questionsIsArray: Array.isArray(questions),
        questionsLength: questions?.length,
        questionsFirstItem: questions?.[0]
      });
      
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        console.error('Questions validation failed for model:', model);
        continue;
      }
      
      // Process each existing persona with the new model
      for (let i = 0; i < existingResults.length; i++) {
        const existingResult = existingResults[i];
        
        // Create the same detailed prompt structure as OpenAI
        const detailedQuestionList = questions.map((q, idx) => {
          let line = `${q.question_number}. ${q.question_text}`;
          
          if ([
            'single_select_radio',
            'single_select_dropdown',
            'multi_select_checkbox',
            'multiple_select',
            'rating_scale'
          ].includes(q.question_type)) {
            if (q.question_type === 'multi_select_checkbox' || q.question_type === 'multiple_select') {
              line += `\nType: Multiple Select. Options: ${q.options.join(', ')}`;
              line += `\nAnswer format: Provide one or more options, separated by semicolons, using EXACTLY the provided option text.`;
            } else if (q.question_type === 'rating_scale') {
              line += `\nType: Rating Scale. Options: ${q.options.join(', ')}`;
              line += `\nAnswer format: Use EXACTLY one of the provided numbers.`;
            } else {
              line += `\nType: Single Select. Options: ${q.options.join(', ')}`;
              line += `\nAnswer format: Use EXACTLY one of the provided options.`;
            }
          } else {
            line += `\nType: Open-ended. Answer format: Write a short, realistic response.`;
          }
          return line;
        }).join('\n\n');

        const existingArchetypes = existingResults.map(r => r.archetype).join(', ');
        
        const prompt = `
          Based on the following target audience:
          ---
          ${audienceDescription}
          ---
          Please generate a SINGLE, unique, and realistic simulated survey response for the survey titled "${surveyTitle}".
          
          Use this specific persona as inspiration: "${existingResult.archetype}"
          And this demographic profile: ${JSON.stringify(existingResult.demographicprofile)}
          
          CRITICAL INSTRUCTIONS:
          - You MUST answer ALL ${questions.length} questions below
          - Each question MUST have a non-empty, realistic answer
          - For multiple choice questions: Use EXACTLY the provided option text (copy it precisely)
          - For rating scale questions: Use EXACTLY one of the provided numbers
          - For open-ended questions: Provide specific, realistic answers (never "N/A", "None", or generic responses)
          - If you're unsure about a multiple choice answer, ALWAYS select the FIRST option from the provided list
          
          For each question:
          - If it is multiple choice or rating scale, you MUST select from the provided options and use the option text or number exactly as shown. Do NOT invent, rephrase, or abbreviate options.
          - For multiple choice questions, copy the EXACT text from the "Options:" list. Example: if options are "Once a year, 2-3 times a year", you must answer "2-3 times a year" (not "2-3 times per year" or similar variations).
          - If it is open-ended, you MUST provide a short, realistic answer. Do NOT leave any answer blank or empty.
          - If you are unsure or do not know the answer for a multiple choice or rating scale, ALWAYS select the FIRST option from the provided list for that question. Never leave any answer blank.

          Here are the survey questions. You must provide an answer for EACH question using the exact question_number:
          ---
          ${detailedQuestionList}
          ---

          Your response MUST be a valid JSON object with this exact structure:
          {
            "simulated_responses": [{
              "respondent_number": ${existingResult.respondent_number},
              "archetype": "${existingResult.archetype}",
              "demographicProfile": ${JSON.stringify(existingResult.demographicprofile)},
              "answers": [
                { "question_number": 1, "answer": "Your answer here" },
                { "question_number": 2, "answer": "Your answer here" }
              ]
            }]
          }

          IMPORTANT VALIDATION CHECKLIST:
          - Your JSON must contain exactly ${questions.length} answers (one for each question)
          - Each question_number must match exactly with the input questions (1, 2, 3, ... ${questions.length})
          - Provide a NON-EMPTY answer for EVERY question (no blanks, no "N/A", no generic responses)
          - For multiple choice: Use EXACT text from Options list (copy and paste precisely)
          - For rating scales: Use exact numbers from Options (1, 2, 3, 4, 5)
          - If unsure, ALWAYS use the FIRST option from the provided list for multiple choice or rating scale
          - Keep answers concise and realistic
          - Return ONLY the JSON object, no explanations or markdown formatting
        `;

        try {
          console.log(`Calling POE service for ${model} with prompt length:`, prompt.length);
          const poeResponse = await aiService.generateResponse(model, prompt);
          console.log(`POE Response for ${model}:`, JSON.stringify(poeResponse, null, 2));
          
          if (poeResponse.error) {
            console.error(`Error from ${model}:`, poeResponse.message);
            continue;
          }

          const result = poeResponse.simulated_responses?.[0] || poeResponse;
          if (!result) {
            console.error(`No simulated response from ${model}`);
            continue;
          }

          console.log(`Processing result for ${model}:`, result);

          // Safety check for questions before mapping
          if (!questions || !Array.isArray(questions)) {
            console.error(`Questions not available for cleanedAnswers mapping in ${model}`);
            continue;
          }

          // Clean and validate answers
          const cleanedAnswers = questions.map((question) => {
            const aiAnswerObject = Array.isArray(result.answers) 
              ? result.answers.find(a => {
                  const aiQuestionNum = parseInt(String(a.question_number), 10);
                  const questionNum = parseInt(String(question.question_number), 10);
                  return aiQuestionNum === questionNum;
                }) 
              : null;
            
            return {
              question_number: question.question_number,
              answer: aiAnswerObject?.answer || ''
            };
          });

          // Save to database with the specific model
          const formattedResult = {
            survey_id: surveyId,
            respondent_number: existingResult.respondent_number,
            archetype: result.archetype || existingResult.archetype,
            answers: cleanedAnswers,
            demographicprofile: result.demographicProfile || existingResult.demographicprofile,
            persona_id: existingResult.persona_id, // Copy from original OpenAI result
            persona_data: existingResult.persona_data, // Copy from original OpenAI result
            model: model, // This is the key difference
            run_number: 1,
          };

          console.log(`Attempting to insert ${model} result:`, JSON.stringify(formattedResult, null, 2));
          console.log(`Preserving persona_id: ${existingResult.persona_id} and persona_data for respondent ${existingResult.respondent_number}`);

          const { error: insertError } = await supabase
            .from('simulation_results')
            .insert(formattedResult);

          if (insertError) {
            console.error(`Error saving ${model} result:`, insertError);
            continue;
          }

          console.log(`Successfully saved ${model} result for respondent ${existingResult.respondent_number}`);

          results.push({
            model,
            respondent_number: existingResult.respondent_number,
            success: true
          });

        } catch (error) {
          console.error(`Error processing ${model} for respondent ${existingResult.respondent_number}:`, error);
          results.push({
            model,
            respondent_number: existingResult.respondent_number,
            success: false,
            error: error.message
          });
        }

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Completed model testing for ${models.join(', ')}`
    });

  } catch (error) {
    console.error('POE API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

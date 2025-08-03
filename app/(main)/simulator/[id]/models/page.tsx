'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../../../lib/supabase-client';
import SimulatorTabs from '../../SimulatorTabs';
import { Loader2, Play, CheckCircle, AlertCircle, BarChart3, Download } from 'lucide-react';

const AVAILABLE_MODELS = [
  { id: 'OpenAI', name: 'OpenAI', description: 'OpenAI\'s GPT model for baseline simulation' },
  { id: 'Claude', name: 'Claude', description: 'Anthropic\'s Claude AI model' },
  { id: 'Gemini', name: 'Gemini', description: 'Google\'s Gemini AI model' },
];

export default function ModelsPage() {
  const params = useParams();
  const surveyId = params?.id as string;
  
  const [survey, setSurvey] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [simulationResults, setSimulationResults] = useState<any[]>([]);
  const [runningSimulations, setRunningSimulations] = useState<Record<string, boolean>>({});
  const [simulationProgress, setSimulationProgress] = useState<Record<string, { current: number, total: number, status: string }>>({});
  const [loading, setLoading] = useState(true);
  const [openAISimulationCount, setOpenAISimulationCount] = useState(3);
  const [viewMode, setViewMode] = useState<'compare' | 'aggregate'>('compare');

  // Audio notification function
  const playSimulationDoneSound = () => {
    try {
      const audio = new Audio(`/simulator/${surveyId}/simulation/simulation-done.mp3`);
      audio.volume = 0.5; // Set volume to 50%
      audio.play().catch(error => {
        console.log('Could not play audio notification:', error);
        // Silently fail if audio can't be played (user hasn't interacted with page yet, etc.)
      });
    } catch (error) {
      console.log('Audio notification not available:', error);
    }
  };

  // Statistical Analysis Helper Functions
  const calculateOverallSimilarity = (modelResult: any, openAIResult: any): number => {
    if (!modelResult?.results || !openAIResult?.results) return 0;
    
    let totalMatches = 0;
    let totalComparisons = 0;
    
    const minLength = Math.min(modelResult.results.length, openAIResult.results.length);
    
    for (let i = 0; i < minLength; i++) {
      const modelAnswers = modelResult.results[i]?.answers || [];
      const openAIAnswers = openAIResult.results[i]?.answers || [];
      
      const minAnswerLength = Math.min(modelAnswers.length, openAIAnswers.length);
      
      for (let j = 0; j < minAnswerLength; j++) {
        const modelAnswer = String(modelAnswers[j]?.answer || '').toLowerCase().trim();
        const openAIAnswer = String(openAIAnswers[j]?.answer || '').toLowerCase().trim();
        
        if (modelAnswer && openAIAnswer) {
          totalComparisons++;
          if (modelAnswer === openAIAnswer || 
              modelAnswer.includes(openAIAnswer) || 
              openAIAnswer.includes(modelAnswer)) {
            totalMatches++;
          }
        }
      }
    }
    
    return totalComparisons > 0 ? Math.round((totalMatches / totalComparisons) * 100) : 0;
  };

  const getAnswersForQuestion = (modelResult: any, questionIndex: number): string[] => {
    if (!modelResult?.results) return [];
    
    return modelResult.results.map((result: any) => {
      const answer = result?.answers?.[questionIndex]?.answer;
      return String(answer || '').toLowerCase().trim();
    }).filter(Boolean);
  };

  const analyzeResponsePattern = (answers: string[]): { dominant: string, confidence: number } => {
    if (!answers.length) return { dominant: 'No data', confidence: 0 };
    
    const frequency: Record<string, number> = {};
    answers.forEach(answer => {
      frequency[answer] = (frequency[answer] || 0) + 1;
    });
    
    const sortedEntries = Object.entries(frequency).sort(([,a], [,b]) => b - a);
    const topAnswer = sortedEntries[0];
    
    if (!topAnswer) return { dominant: 'No data', confidence: 0 };
    
    const confidence = Math.round((topAnswer[1] / answers.length) * 100);
    return {
      dominant: topAnswer[0].charAt(0).toUpperCase() + topAnswer[0].slice(1),
      confidence
    };
  };

  const calculateQuestionVariance = (openAIAnswers: string[], modelAnswers: string[]): number => {
    if (!openAIAnswers.length || !modelAnswers.length) return 0;
    
    const openAIPattern = analyzeResponsePattern(openAIAnswers);
    const modelPattern = analyzeResponsePattern(modelAnswers);
    
    // Calculate similarity between the dominant patterns
    const patternSimilarity = openAIPattern.dominant.toLowerCase() === modelPattern.dominant.toLowerCase() ? 1 : 0;
    
    // Calculate confidence difference
    const confidenceDiff = Math.abs(openAIPattern.confidence - modelPattern.confidence) / 100;
    
    // Combine for variance score (higher = more different)
    const variance = (1 - patternSimilarity) * 70 + confidenceDiff * 30;
    
    return Math.round(variance);
  };

  const calculateInternalConsistency = (modelResult: any): number => {
    if (!modelResult?.results || modelResult.results.length < 2) return 100;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    const results = modelResult.results;
    
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const answers1 = results[i]?.answers || [];
        const answers2 = results[j]?.answers || [];
        
        let matches = 0;
        const minLength = Math.min(answers1.length, answers2.length);
        
        for (let k = 0; k < minLength; k++) {
          const answer1 = String(answers1[k]?.answer || '').toLowerCase().trim();
          const answer2 = String(answers2[k]?.answer || '').toLowerCase().trim();
          
          if (answer1 && answer2 && (
            answer1 === answer2 || 
            answer1.includes(answer2) || 
            answer2.includes(answer1)
          )) {
            matches++;
          }
        }
        
        if (minLength > 0) {
          totalSimilarity += (matches / minLength);
          comparisons++;
        }
      }
    }
    
    return comparisons > 0 ? Math.round((totalSimilarity / comparisons) * 100) : 100;
  };

  const generateModelPairings = (results: any[]): Array<{model1: any, model2: any}> => {
    const pairings: Array<{model1: any, model2: any}> = [];
    
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        pairings.push({
          model1: results[i],
          model2: results[j]
        });
      }
    }
    
    return pairings;
  };

  const calculateModelAgreement = (model1: any, model2: any): number => {
    if (!model1?.results || !model2?.results) return 0;
    
    let agreements = 0;
    let totalComparisons = 0;
    
    const minLength = Math.min(model1.results.length, model2.results.length);
    
    for (let i = 0; i < minLength; i++) {
      const answers1 = model1.results[i]?.answers || [];
      const answers2 = model2.results[i]?.answers || [];
      
      const minAnswerLength = Math.min(answers1.length, answers2.length);
      
      for (let j = 0; j < minAnswerLength; j++) {
        const answer1 = String(answers1[j]?.answer || '').toLowerCase().trim();
        const answer2 = String(answers2[j]?.answer || '').toLowerCase().trim();
        
        if (answer1 && answer2) {
          totalComparisons++;
          if (answer1 === answer2 || 
              answer1.includes(answer2) || 
              answer2.includes(answer1)) {
            agreements++;
          }
        }
      }
    }
    
    return totalComparisons > 0 ? Math.round((agreements / totalComparisons) * 100) : 0;
  };

  const getMostDivergentModel = (results: any[]): string | null => {
    const openAIResult = results.find(r => r.model === 'OpenAI');
    if (!openAIResult) return null;
    
    let lowestSimilarity = 100;
    let mostDivergent = null;
    
    results.filter(r => r.model !== 'OpenAI').forEach(result => {
      const similarity = calculateOverallSimilarity(result, openAIResult);
      if (similarity < lowestSimilarity) {
        lowestSimilarity = similarity;
        mostDivergent = result.model;
      }
    });
    
    return mostDivergent;
  };

    const getMostConsistentModel = (results: any[]): string | null => {
    let highestConsistency = 0;
    let mostConsistent = null;
    
    results.forEach(result => {
      const consistency = calculateInternalConsistency(result);
      if (consistency > highestConsistency) {
        highestConsistency = consistency;
        mostConsistent = result.model;
      }
    });
    
    return mostConsistent;
  };

  // Aggregate Analysis Functions
  const calculateAggregateConsensus = (questionIndex: number): { consensus: string, confidence: number, distribution: Record<string, number> } => {
    const allAnswers: string[] = [];
    const answerCounts: Record<string, number> = {};
    
    simulationResults.forEach(modelResult => {
      const answers = getAnswersForQuestion(modelResult, questionIndex);
      answers.forEach(answer => {
        if (answer) {
          allAnswers.push(answer);
          answerCounts[answer] = (answerCounts[answer] || 0) + 1;
        }
      });
    });
    
    if (allAnswers.length === 0) {
      return { consensus: 'No data', confidence: 0, distribution: {} };
    }
    
    const sortedAnswers = Object.entries(answerCounts).sort(([,a], [,b]) => b - a);
    const topAnswer = sortedAnswers[0];
    
    const confidence = Math.round((topAnswer[1] / allAnswers.length) * 100);
    
    return {
      consensus: topAnswer[0].charAt(0).toUpperCase() + topAnswer[0].slice(1),
      confidence,
      distribution: answerCounts
    };
  };

  const calculateModelDiversity = (): number => {
    if (simulationResults.length < 2) return 0;
    
    let totalDifferences = 0;
    let totalComparisons = 0;
    
    // Compare each pair of models
    for (let i = 0; i < simulationResults.length; i++) {
      for (let j = i + 1; j < simulationResults.length; j++) {
        const agreement = calculateModelAgreement(simulationResults[i], simulationResults[j]);
        totalDifferences += (100 - agreement);
        totalComparisons++;
      }
    }
    
    return totalComparisons > 0 ? Math.round(totalDifferences / totalComparisons) : 0;
  };

  const calculateResponseStability = (): number => {
    if (simulationResults.length === 0) return 0;
    
    let totalStability = 0;
    let questionCount = 0;
    
    for (let qIndex = 0; qIndex < Math.min(questions.length, 10); qIndex++) {
      const consensus = calculateAggregateConsensus(qIndex);
      if (consensus.confidence > 0) {
        totalStability += consensus.confidence;
        questionCount++;
      }
    }
    
    return questionCount > 0 ? Math.round(totalStability / questionCount) : 0;
  };

  const getModelContribution = (modelId: string): { uniqueInsights: number, agreementRate: number } => {
    const modelResult = simulationResults.find(r => r.model === modelId);
    if (!modelResult) return { uniqueInsights: 0, agreementRate: 0 };
    
    let uniqueCount = 0;
    let totalAgreements = 0;
    let totalComparisons = 0;
    
    // Compare this model against all others
    simulationResults.filter(r => r.model !== modelId).forEach(otherModel => {
      const agreement = calculateModelAgreement(modelResult, otherModel);
      totalAgreements += agreement;
      totalComparisons++;
      
      if (agreement < 50) { // Low agreement indicates unique insights
        uniqueCount++;
      }
    });
    
    return {
      uniqueInsights: Math.round((uniqueCount / Math.max(totalComparisons, 1)) * 100),
      agreementRate: totalComparisons > 0 ? Math.round(totalAgreements / totalComparisons) : 0
    };
  };

  const getCrossModelInsights = (): { 
    totalResponses: number, 
    avgResponsesPerModel: number, 
    consensusStrength: number,
    diversityIndex: number 
  } => {
    const totalResponses = simulationResults.reduce((sum, r) => sum + r.count, 0);
    const avgResponsesPerModel = simulationResults.length > 0 ? Math.round(totalResponses / simulationResults.length) : 0;
    const consensusStrength = calculateResponseStability();
    const diversityIndex = calculateModelDiversity();
    
    return {
      totalResponses,
      avgResponsesPerModel,
      consensusStrength,
      diversityIndex
    };
  };

  // CSV Download Function
  const downloadResults = () => {
    if (simulationResults.length === 0) {
      toast.error("No simulation results to export.");
      return;
    }

    // Helper function to escape CSV cells
    const escapeCsvCell = (cell: any): string => {
      const str = String(cell ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Create CSV headers based on the attached format
    const headers = [
      'Respondent #',
      'Model',
      'Archetype', 
      'Profile',
      ...questions.map(q => q.question_text)
    ].map(escapeCsvCell).join(',');

    // Create CSV rows from all model results
    const allRows: string[] = [];
    
    simulationResults.forEach(modelResult => {
      const modelName = modelResult.model;
      
      modelResult.results.forEach((result: any, index: number) => {
        // Create answers map for this respondent
        const answersMap = new Map(
          (result.answers || []).map((ans: any) => [
            ans.question_number,
            Array.isArray(ans.answer) ? ans.answer.join('; ') : String(ans.answer)
          ])
        );

        // Format demographic profile
        const profileString = Object.entries(result.demographicprofile || {})
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ');
        
        // Create row data matching the attachment format
        const rowData = [
          index + 1, // Respondent #
          modelName, // Model (new field as requested)
          result.archetype,
          profileString,
          ...questions.map(q => answersMap.get(q.question_number) || '')
        ];

        allRows.push(rowData.map(escapeCsvCell).join(','));
      });
    });

    // Combine headers and rows
    const csvContent = [headers, ...allRows].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${survey?.title?.replace(/ /g, '_') || 'survey'}_model_comparison.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Model comparison results downloaded successfully!');
  };

  // JSON Download Function for detailed export
  const downloadJSONResults = async () => {
    try {
      if (!simulationResults || simulationResults.length === 0) {
        toast.error('No simulation results to download');
        return;
      }

      // Prepare data for export
      const exportData = {
        survey: {
          id: surveyId,
          title: survey?.title || 'Untitled Survey',
          audience_description: survey?.audience_description || 'No description',
          created_at: survey?.created_at,
        },
        questions: questions.map(q => ({
          number: q.question_number,
          text: q.question_text,
          type: q.question_type,
          options: q.answer_option
        })),
        results: simulationResults.map(modelResult => ({
          model: modelResult.model,
          total_responses: modelResult.count,
          personas: modelResult.results.map((result: any, index: number) => ({
            persona_number: index + 1,
            archetype: result.archetype,
            demographic_assumptions: result.demographic_assumptions,
            answers: result.answers?.map((answer: any) => ({
              question_number: answer.question_number,
              answer: answer.answer,
              rationale: answer.rationale
            })) || []
          }))
        })),
        export_metadata: {
          exported_at: new Date().toISOString(),
          total_models: simulationResults.length,
          total_responses: simulationResults.reduce((sum, r) => sum + r.count, 0)
        }
      };

      // Create and download the file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `model-comparison-results-${surveyId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Results downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download results');
    }
  };

  // Data fetching
  useEffect(() => {
    if (surveyId) {
      fetchSurveyData();
    }
  }, [surveyId]);

  const fetchSurveyData = async () => {
    try {
      setLoading(true);

      // Fetch survey details
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single();

      if (surveyError) throw surveyError;
      setSurvey(surveyData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('question_order');

      if (questionsError) throw questionsError;
      setQuestions(questionsData);

      // Fetch simulation results grouped by model
      const { data: resultsData, error: resultsError } = await supabase
        .from('simulation_results')
        .select('*')
        .eq('survey_id', surveyId);

      if (resultsError) throw resultsError;

      // Group results by model
      const groupedResults = resultsData.reduce((acc: any, result: any) => {
        const model = result.model || 'OpenAI';
        if (!acc[model]) {
          acc[model] = [];
        }
        acc[model].push(result);
        return acc;
      }, {});

      // Convert to array format for easier handling
      const modelResults = Object.entries(groupedResults).map(([model, results]: [string, any]) => ({
        model,
        results: (results as any[]).sort((a: any, b: any) => a.respondent_number - b.respondent_number),
        count: (results as any[]).length
      }));

      setSimulationResults(modelResults);

    } catch (error) {
      console.error('Error fetching survey data:', error);
      toast.error('Failed to load survey data');
    } finally {
      setLoading(false);
    }
  };

  const runOpenAISimulation = async () => {
    try {
      // Validate prerequisites
      if (!questions || questions.length === 0) {
        toast.error('No questions found for this survey. Please check the Survey tab.');
        return;
      }

      if (!survey) {
        toast.error('Survey data not loaded. Please refresh the page.');
        return;
      }

      setRunningSimulations(prev => ({ ...prev, 'OpenAI': true }));
      setSimulationProgress(prev => ({ ...prev, 'OpenAI': { current: 0, total: openAISimulationCount, status: 'Initializing...' } }));
      
      const loadingToast = toast.loading(`Starting OpenAI simulation with ${openAISimulationCount} responses...`);

      // Process each simulation individually like the simulation page does
      const allResults = [];
      
      for (let i = 0; i < openAISimulationCount; i++) {
        setSimulationProgress(prev => ({ 
          ...prev, 
          'OpenAI': { 
            current: i, 
            total: openAISimulationCount, 
            status: `Generating response ${i + 1} of ${openAISimulationCount}...` 
          } 
        }));

        // Build the prompt like the simulation page does
        const audienceDescription = survey?.audience_description || 'General audience';
        
        // Parse targeting data from the correct field (targeting, not targeting_json)
        let targetingCriteria = {};
        if (survey?.targeting) {
          try {
            const targetingData = typeof survey.targeting === 'string' 
              ? JSON.parse(survey.targeting) 
              : survey.targeting;
            
            // The targeting data is nested under country ID, get the first country's data
            const countryData = Object.values(targetingData)[0];
            if (countryData && typeof countryData === 'object') {
              targetingCriteria = countryData;
            }
          } catch (error) {
            console.error('Error parsing targeting data:', error);
          }
        }
        
        // Debug: Log targeting criteria with full details
        console.log('Raw targeting field from survey:', survey?.targeting);
        console.log('Parsed targeting criteria:', targetingCriteria);
        console.log('Targeting criteria type:', typeof targetingCriteria);
        console.log('Targeting criteria keys:', Object.keys(targetingCriteria));
        console.log('Targeting criteria stringified:', JSON.stringify(targetingCriteria));
        
        // Build targeting instructions from the targeting JSON
        let targetingInstructions = '';
        if (targetingCriteria && Object.keys(targetingCriteria).length > 0) {
          console.log('Processing targeting criteria...');
          targetingInstructions = '\n\nTARGETING REQUIREMENTS - The persona MUST match these specific criteria:\n';
          
          Object.entries(targetingCriteria).forEach(([category, values]) => {
            console.log(`Processing category: ${category}, values:`, values);
            if (Array.isArray(values) && values.length > 0) {
              targetingInstructions += `- ${category}: Must be one of [${values.join(', ')}]\n`;
            }
          });
          
          targetingInstructions += '\nIMPORTANT: The demographicProfile MUST strictly comply with ALL targeting requirements above. Do not deviate from these constraints.\n';
          console.log('Final targeting instructions:', targetingInstructions);
        } else {
          console.warn('No targeting criteria found - targeting object:', targetingCriteria);
          console.warn('Keys length:', Object.keys(targetingCriteria || {}).length);
        }
        
        // Create detailed question list
        const detailedQuestionList = questions
          .map((question, idx) => {
            let qText = `${idx + 1}. ${question.question_text}`;
            const needsOptions = [
              'single_select_radio',
              'single_select_dropdown', 
              'multi_select_checkbox',
              'multiple_select',
              'rating_scale'
            ].includes(question.question_type);
            
            if (needsOptions) {
              let options = question.answer_option;
              if (typeof options === 'string') {
                try {
                  options = JSON.parse(options);
                } catch (e) {
                  options = [];
                }
              }
              if (Array.isArray(options) && options.length > 0) {
                qText += `\nOptions: ${options.join(', ')}`;
              }
            }
            return qText;
          })
          .join('\n\n');

        const sampleOutput = `Sample output:\n{\n  "simulated_responses": [{\n    "respondent_number": 1,\n    "archetype": "Young college student who works part-time",\n    "demographicProfile": {\n      "age": "22",\n      "gender": "Female",\n      "income": "Under $25,000",\n      "education": "Some College",\n      "employment": "Part-time",\n      "marital_status": "Single",\n      "household_size": "2",\n      "ethnicity": "Hispanic",\n      "location": "Urban",\n      "region": "West Coast",\n      "lifestyle": "Student and social",\n      "values": "Education and independence",\n      "personality": "Ambitious and tech-savvy"\n    },\n    "answers": [\n      { "question_number": 1, "answer": "Part-time" },\n      { "question_number": 2, "answer": "Netflix" },\n      { "question_number": 3, "answer": "3" },\n      { "question_number": 4, "answer": "Gaming and social media" }\n    ]\n  }]\n}`;

        const prompt = `
          Based on the following target audience:
          ---
          ${audienceDescription}
          ---
          ${targetingInstructions}
          
          ⚠️ CRITICAL TARGETING REQUIREMENTS ⚠️
          The persona you create MUST have these EXACT attributes (NO EXCEPTIONS):
          ${targetingCriteria['Age Range'] ? `- AGE: MUST be ${targetingCriteria['Age Range'].join(' OR ')} (NOT any other age)` : ''}
          ${targetingCriteria['Gender'] ? `- GENDER: MUST be ${targetingCriteria['Gender'].join(' OR ')} (NOT any other gender)` : ''}
          ${targetingCriteria['Household Income'] ? `- INCOME: MUST be ${targetingCriteria['Household Income'].join(' OR ')} (NOT any other income level)` : ''}
          ${targetingCriteria['Education Level'] ? `- EDUCATION: MUST be ${targetingCriteria['Education Level'].join(' OR ')} (NOT any other education level)` : ''}
          ${targetingCriteria['Employment Status'] ? `- EMPLOYMENT: MUST be ${targetingCriteria['Employment Status'].join(' OR ')} (NOT any other employment status)` : ''}
          
          Please generate a SINGLE, unique, and realistic simulated survey response for the survey titled "${survey.title}".

          CREATE A PERSONA THAT STRICTLY MATCHES THE TARGETING REQUIREMENTS ABOVE.
          
          DEMOGRAPHIC ATTRIBUTES (required - MUST match targeting above):
          - age: MUST be from the targeting requirements ${targetingCriteria['Age Range'] ? `(${targetingCriteria['Age Range'].join(' OR ')})` : ''}
          - gender: MUST be from the targeting requirements ${targetingCriteria['Gender'] ? `(${targetingCriteria['Gender'].join(' OR ')})` : ''}
          - income: MUST be from the targeting requirements ${targetingCriteria['Household Income'] ? `(${targetingCriteria['Household Income'].join(' OR ')})` : ''}
          - education: MUST be from the targeting requirements ${targetingCriteria['Education Level'] ? `(${targetingCriteria['Education Level'].join(' OR ')})` : ''}
          - employment: MUST be from the targeting requirements ${targetingCriteria['Employment Status'] ? `(${targetingCriteria['Employment Status'].join(' OR ')})` : ''}
          - marital_status: Single, Married, Divorced, etc.
          - household_size: Number of people in household
          - ethnicity: Ethnic background
          
          GEOGRAPHIC ATTRIBUTES (required):
          - location: Urban, Suburban, or Rural
          - region: Geographic region
          
          PSYCHOGRAPHIC ATTRIBUTES (required):
          - lifestyle: How they live and spend time
          - values: What's important to them
          - personality: Key personality traits

          For each question:
          - If it is multiple choice or rating scale, you MUST select from the provided options and use the option text or number exactly as shown. Do NOT invent, rephrase, or abbreviate options.
          - If it is open-ended, you MUST provide a short, realistic answer. Do NOT leave any answer blank or empty.
          - If you are unsure or do not know the answer for a multiple choice or rating scale, ALWAYS select the FIRST option from the provided list for that question. Never leave any answer blank.

          Here are the survey questions. You must provide an answer for EVERY question using the exact question_number:
          ---
          ${detailedQuestionList}
          ---

          ⚠️ FINAL REMINDER: The persona MUST strictly follow ALL targeting constraints listed at the top. Do NOT create a persona that doesn't match the targeting requirements.

          Your response MUST be a valid JSON object with this exact structure. ${sampleOutput}

          VALIDATION CHECKLIST BEFORE RESPONDING:
          ✓ Does the age match the targeting requirements? ${targetingCriteria['Age Range'] ? `(Must be: ${targetingCriteria['Age Range'].join(' OR ')})` : ''}
          ✓ Does the gender match the targeting requirements? ${targetingCriteria['Gender'] ? `(Must be: ${targetingCriteria['Gender'].join(' OR ')})` : ''}
          ✓ Does the income match the targeting requirements? ${targetingCriteria['Household Income'] ? `(Must be: ${targetingCriteria['Household Income'].join(' OR ')})` : ''}
          ✓ Does the education match the targeting requirements? ${targetingCriteria['Education Level'] ? `(Must be: ${targetingCriteria['Education Level'].join(' OR ')})` : ''}
          ✓ Does the employment match the targeting requirements? ${targetingCriteria['Employment Status'] ? `(Must be: ${targetingCriteria['Employment Status'].join(' OR ')})` : ''}
          
          If ANY of these don't match, REVISE the persona to comply with targeting.
        `;

        // Call the API with the proper format
        const response = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData}`);
        }

        const data = await response.json();
        const result = data.simulated_responses[0];
        
        if (result) {
          // Save to database in the format expected by models page
          const { error: insertError } = await supabase
            .from('simulation_results')
            .insert({
              survey_id: surveyId,
              model: 'OpenAI',
              respondent_number: i + 1,
              archetype: result.archetype,
              demographicprofile: result.demographicProfile,
              answers: result.answers,
              created_at: new Date().toISOString()
            });

          if (!insertError) {
            allResults.push(result);
          }
        }
      }

      // Update progress to complete
      setSimulationProgress(prev => ({ 
        ...prev, 
        'OpenAI': { 
          current: openAISimulationCount, 
          total: openAISimulationCount, 
          status: 'Refreshing data...' 
        } 
      }));

      // Refresh the data
      await fetchSurveyData();
      
      toast.dismiss(loadingToast);
      toast.success(`OpenAI simulation completed! Generated ${allResults.length} responses.`);
      
      // Play completion sound
      playSimulationDoneSound();

    } catch (error: any) {
      console.error('Error running OpenAI simulation:', error);
      toast.error(`Failed to run OpenAI simulation: ${error.message}`);
    } finally {
      setRunningSimulations(prev => ({ ...prev, 'OpenAI': false }));
      setSimulationProgress(prev => ({ ...prev, 'OpenAI': { current: 0, total: 0, status: '' } }));
    }
  };

  const runModelSimulation = async (modelId: string) => {
    // Handle OpenAI separately
    if (modelId === 'OpenAI') {
      return runOpenAISimulation();
    }

    try {
      // Validate prerequisites for other models
      if (!questions || questions.length === 0) {
        toast.error('No questions found for this survey. Please check the Survey tab.');
        return;
      }

      if (!survey) {
        toast.error('Survey data not loaded. Please refresh the page.');
        return;
      }

      // Check for existing OpenAI results more thoroughly
      if (!hasOpenAIResults) {
        toast.error('No OpenAI baseline results found. Please run the OpenAI simulation first.');
        return;
      }
      
      const openAIResults = simulationResults.find(r => r.model === 'OpenAI');
      const expectedTotal = openAIResults?.count || 3;

      console.log('Prerequisites check:', {
        questionsCount: questions.length,
        surveyLoaded: !!survey,
        openAIResultsFound: !!openAIResults,
        openAIResultsCount: openAIResults?.count || 0,
        expectedPersonas: expectedTotal
      });

      setRunningSimulations(prev => ({ ...prev, [modelId]: true }));
      setSimulationProgress(prev => ({ ...prev, [modelId]: { current: 0, total: expectedTotal, status: 'Initializing...' } }));
      
      const loadingToast = toast.loading(`Starting ${modelId} simulation...`);

      console.log('Sending to API:', {
        surveyId,
        models: [modelId],
        questionsCount: questions.length,
        questionsSample: questions.slice(0, 2), // Show first 2 questions for debugging
        audienceDescription: survey?.audience_description || '',
        surveyTitle: survey?.title || ''
      });

      // Transform questions to match expected API format
      const transformedQuestions = questions.map(q => ({
        ...q,
        options: q.answer_option ? 
          (Array.isArray(q.answer_option) ? q.answer_option : JSON.parse(q.answer_option || '[]'))
          : []
      }));

      setSimulationProgress(prev => ({ ...prev, [modelId]: { current: 0, total: expectedTotal, status: 'Sending request to API...' } }));

      // Start the simulation
      const response = await fetch('/api/poe-simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyId,
          models: [modelId],
          questions: transformedQuestions,
          audienceDescription: survey?.audience_description || '',
          surveyTitle: survey?.title || ''
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        let errorMessage = 'Failed to run simulation';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        toast.dismiss(loadingToast);
        throw new Error(errorMessage);
      }

      // Check if response is streaming or has immediate results
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType?.includes('text/plain') || contentType?.includes('text/event-stream')) {
        // Handle streaming response with real progress updates
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let currentProgress = 0;
        
        if (reader) {
          setSimulationProgress(prev => ({ ...prev, [modelId]: { current: 0, total: expectedTotal, status: 'Processing responses...' } }));
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.trim().startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.replace('data: ', ''));
                  if (data.progress) {
                    currentProgress = data.progress.current || currentProgress;
                    setSimulationProgress(prev => ({ 
                      ...prev, 
                      [modelId]: { 
                        current: currentProgress, 
                        total: expectedTotal, 
                        status: data.progress.status || `Processing response ${currentProgress + 1} of ${expectedTotal}...` 
                      } 
                    }));
                  }
                } catch (e) {
                  // Ignore parsing errors for progress updates
                }
              }
            }
          }
        }
        
        // Get final result
        result = await response.json();
        setSimulationProgress(prev => ({ ...prev, [modelId]: { current: expectedTotal, total: expectedTotal, status: 'Completed! Refreshing data...' } }));
      } else {
        // Handle regular JSON response with simulated progress
        setSimulationProgress(prev => ({ ...prev, [modelId]: { current: 0, total: expectedTotal, status: 'Processing responses...' } }));
        
        // Create progress simulation that updates more realistically
        let currentProgress = 0;
        const progressInterval = setInterval(() => {
          currentProgress++;
          if (currentProgress < expectedTotal) {
            setSimulationProgress(prev => ({ 
              ...prev, 
              [modelId]: { 
                current: currentProgress, 
                total: expectedTotal, 
                status: `Processing response ${currentProgress + 1} of ${expectedTotal}...` 
              } 
            }));
          }
        }, 2000); // Update every 2 seconds
        
        result = await response.json();
        
        // Clear the progress interval
        clearInterval(progressInterval);
        setSimulationProgress(prev => ({ ...prev, [modelId]: { current: expectedTotal, total: expectedTotal, status: 'Completed! Refreshing data...' } }));
      }
      
      console.log('Simulation result:', result);
      
      // Check if the simulation was actually successful
      if (!result.success) {
        console.error('Simulation failed:', result);
        toast.dismiss(loadingToast);
        throw new Error(result.message || 'Simulation failed');
      }

      // Check if any results were actually inserted
      const successfulResults = result.results?.filter(r => r.success) || [];
      const failedResults = result.results?.filter(r => !r.success) || [];
      
      console.log('Results breakdown:', {
        total: result.results?.length || 0,
        successful: successfulResults.length,
        failed: failedResults.length,
        failedDetails: failedResults,
        allResults: result.results
      });

      // If we have failed results, log the specific errors
      if (failedResults.length > 0) {
        console.error('Failed results details:', failedResults.map(r => ({
          respondent: r.respondent_number,
          error: r.error,
          model: r.model
        })));
      }

      setSimulationProgress(prev => ({ ...prev, [modelId]: { current: expectedTotal, total: expectedTotal, status: 'Completed! Refreshing data...' } }));
      
      // Refresh the results
      await fetchSurveyData();
      
      toast.dismiss(loadingToast);
      
      if (successfulResults.length > 0) {
        toast.success(`${modelId} simulation completed! Generated ${successfulResults.length} responses.`);
        // Play completion sound
        playSimulationDoneSound();
      } else if (failedResults.length > 0) {
        // Check if failures are due to missing API key
        const hasApiKeyError = failedResults.some(r => 
          r.error && r.error.toLowerCase().includes('api key')
        );
        
        if (hasApiKeyError) {
          toast.error(`${modelId} simulation failed: API key not configured. Please check your environment variables.`);
        } else {
          toast.error(`${modelId} simulation failed. Check console for details.`);
        }
      } else {
        toast.error(`${modelId} simulation failed to generate any responses. This may be due to missing API key configuration.`);
      }

    } catch (error: any) {
      console.error('Error running simulation:', error);
      toast.error(`Failed to run ${modelId} simulation: ${error.message}`);
    } finally {
      setRunningSimulations(prev => ({ ...prev, [modelId]: false }));
      setSimulationProgress(prev => ({ ...prev, [modelId]: { current: 0, total: 0, status: '' } }));
    }
  };

  const hasOpenAIResults = useMemo(() => {
    const openAIResult = simulationResults.find(r => r.model === 'OpenAI');
    // Only log once when results change, not on every render
    if (openAIResult && openAIResult.count > 0) {
      console.log('OpenAI baseline found:', {
        count: openAIResult.count,
        results: openAIResult.results?.length || 0
      });
    }
    return simulationResults.some(r => r.model === 'OpenAI' && r.count > 0);
  }, [simulationResults]);

  const getModelStatus = (modelId: string) => {
    const modelResult = simulationResults.find(r => r.model === modelId);
    if (modelResult && modelResult.count > 0) {
      return { status: 'completed', count: modelResult.count };
    }
    return { status: 'not_run', count: 0 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Survey not found</h1>
        <p className="text-gray-600">The requested survey could not be found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SimulatorTabs id={surveyId} surveyType="survey" />

      <div className="mb-8 mt-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Model Comparison</h1>
            <p className="text-gray-600">
              Test simulation results across different AI models: {survey.title}
            </p>
          </div>
          
          {simulationResults.length > 0 && (
            <button
              onClick={downloadResults}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Results
            </button>
          )}
        </div>
      </div>

      <div className="space-y-8">

        {/* Prerequisites Check */}
        {!hasOpenAIResults && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Start with OpenAI Baseline</h3>
                <p className="text-blue-700 mt-1">
                  Run the OpenAI simulation first to establish a baseline for model comparison.
                  Other models will compare their responses against the OpenAI results.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Model Selection and Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Available Models</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AVAILABLE_MODELS.map((model) => {
              const status = getModelStatus(model.id);
              const isRunning = runningSimulations[model.id];
              
              return (
                <div key={model.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{model.name}</h3>
                    {status.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{model.description}</p>
                  
                  {status.status === 'completed' && (
                    <p className="text-sm text-green-600 mb-3">
                      ✓ {status.count} responses generated
                    </p>
                  )}

                  {/* Special input for OpenAI simulation count */}
                  {model.id === 'OpenAI' && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of responses (N=)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={openAISimulationCount}
                        onChange={(e) => setOpenAISimulationCount(parseInt(e.target.value) || 3)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        disabled={isRunning}
                      />
                    </div>
                  )}
                  
                  {isRunning && simulationProgress[model.id] && (
                    <div className="mb-3">
                      <p className="text-sm text-blue-600 mb-1">
                        {simulationProgress[model.id].status}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: simulationProgress[model.id].total > 0 
                              ? `${(simulationProgress[model.id].current / simulationProgress[model.id].total) * 100}%` 
                              : '10%' 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => runModelSimulation(model.id)}
                    disabled={isRunning || (model.id !== 'OpenAI' && !hasOpenAIResults)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isRunning
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : (model.id !== 'OpenAI' && !hasOpenAIResults)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : status.status === 'completed'
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        {model.id === 'OpenAI' ? 'Run Simulation' : (status.status === 'completed' ? 'Re-run' : 'Run Simulation')}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Results Summary */}
        {simulationResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Simulation Results Summary
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {simulationResults
                .sort((a, b) => {
                  // Sort to show OpenAI first, then alphabetically
                  if (a.model === 'OpenAI') return -1;
                  if (b.model === 'OpenAI') return 1;
                  return a.model.localeCompare(b.model);
                })
                .map((result) => (
                <div key={result.model} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{result.count}</div>
                  <div className="text-sm text-gray-600">{result.model}</div>
                  <div className="text-xs text-gray-500 mt-1">responses</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistical Analytics */}
        {simulationResults.length > 1 && (
          <div className="space-y-6">
            
            {/* View Mode Toggle */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Analysis Mode</h2>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm ${viewMode === 'compare' ? 'font-medium text-blue-600' : 'text-gray-500'}`}>
                    Compare to OpenAI
                  </span>
                  <button
                    onClick={() => setViewMode(viewMode === 'compare' ? 'aggregate' : 'compare')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      viewMode === 'aggregate' ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        viewMode === 'aggregate' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm ${viewMode === 'aggregate' ? 'font-medium text-blue-600' : 'text-gray-500'}`}>
                    Aggregate Models
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {viewMode === 'compare' 
                  ? 'Compare each model\'s responses against OpenAI as the baseline reference.'
                  : 'Analyze consensus and diversity patterns across all models combined.'
                }
              </p>
            </div>

            {/* Overall Model Performance Comparison */}
            <div className="bg-white rounded-lg shadow p-6">
              {viewMode === 'compare' ? (
                <>
                  <h2 className="text-xl font-semibold mb-4">🎯 Overall Model Performance vs OpenAI</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    This shows how each AI model's responses differ from OpenAI's baseline responses across all questions.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {simulationResults
                      .filter(result => result.model !== 'OpenAI')
                      .map(result => {
                        const openAIResult = simulationResults.find(r => r.model === 'OpenAI');
                        const similarity = calculateOverallSimilarity(result, openAIResult);
                        const divergence = 100 - similarity;
                        
                        return (
                          <div key={result.model} className="p-4 border rounded-lg">
                            <h3 className="font-medium text-lg mb-2">{result.model}</h3>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Similarity to OpenAI</span>
                                  <span className="font-medium">{similarity}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${similarity}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Higher = More similar responses to OpenAI
                                </p>
                              </div>
                              
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Response Divergence</span>
                                  <span className="font-medium">{divergence}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{ width: `${divergence}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Higher = More unique perspectives vs OpenAI
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-4">🌐 Aggregate Model Analysis</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Cross-model consensus and diversity patterns when all AI models are analyzed together.
                  </p>
                  
                  {(() => {
                    const insights = getCrossModelInsights();
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 border rounded-lg bg-blue-50">
                          <h3 className="font-medium text-blue-900 mb-2">Total Sample Size</h3>
                          <div className="text-2xl font-bold text-blue-800">{insights.totalResponses}</div>
                          <p className="text-xs text-blue-600 mt-1">
                            Across {simulationResults.length} models
                          </p>
                        </div>
                        
                        <div className="p-4 border rounded-lg bg-green-50">
                          <h3 className="font-medium text-green-900 mb-2">Consensus Strength</h3>
                          <div className="text-2xl font-bold text-green-800">{insights.consensusStrength}%</div>
                          <p className="text-xs text-green-600 mt-1">
                            Average agreement level
                          </p>
                        </div>
                        
                        <div className="p-4 border rounded-lg bg-purple-50">
                          <h3 className="font-medium text-purple-900 mb-2">Model Diversity</h3>
                          <div className="text-2xl font-bold text-purple-800">{insights.diversityIndex}%</div>
                          <p className="text-xs text-purple-600 mt-1">
                            Response variation range
                          </p>
                        </div>
                        
                        <div className="p-4 border rounded-lg bg-orange-50">
                          <h3 className="font-medium text-orange-900 mb-2">Avg Per Model</h3>
                          <div className="text-2xl font-bold text-orange-800">{insights.avgResponsesPerModel}</div>
                          <p className="text-xs text-orange-600 mt-1">
                            Responses per model
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <div className="mt-6">
                    <h3 className="font-medium mb-4">Model Contribution Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {simulationResults.map(result => {
                        const contribution = getModelContribution(result.model);
                        return (
                          <div key={result.model} className="p-4 border rounded-lg">
                            <h4 className="font-medium text-lg mb-3">{result.model}</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Unique Insights</span>
                                  <span className="font-medium">{contribution.uniqueInsights}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-indigo-500 h-2 rounded-full" 
                                    style={{ width: `${contribution.uniqueInsights}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Distinctive perspectives offered
                                </p>
                              </div>
                              
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Consensus Alignment</span>
                                  <span className="font-medium">{contribution.agreementRate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-teal-500 h-2 rounded-full" 
                                    style={{ width: `${contribution.agreementRate}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Agreement with other models
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Question-by-Question Analysis */}
            <div className="bg-white rounded-lg shadow p-6">
              {viewMode === 'compare' ? (
                <>
                  <h2 className="text-xl font-semibold mb-4">📊 Question-by-Question Variance Analysis</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Shows how much each AI model varies from OpenAI's answers for individual questions. High variance indicates unique insights.
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Question #</th>
                          <th className="text-left py-3 px-4">OpenAI Response Pattern</th>
                          {simulationResults
                            .filter(result => result.model !== 'OpenAI')
                            .map(result => (
                              <th key={result.model} className="text-left py-3 px-4">
                                {result.model} Variance
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {questions.slice(0, 10).map((question, qIndex) => {
                          const openAIAnswers = getAnswersForQuestion(simulationResults.find(r => r.model === 'OpenAI'), qIndex);
                          const pattern = analyzeResponsePattern(openAIAnswers);
                          
                          return (
                            <tr key={qIndex} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">
                                <div>
                                  <div className="font-medium">Q{qIndex + 1}</div>
                                  <div className="text-xs text-gray-500 mt-1 max-w-xs">
                                    {question.question_text}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-sm">
                                  <div className="font-medium">{pattern.dominant}</div>
                                  <div className="text-xs text-gray-500">
                                    {pattern.confidence}% consensus
                                  </div>
                                </div>
                              </td>
                              {simulationResults
                                .filter(result => result.model !== 'OpenAI')
                                .map(result => {
                                  const modelAnswers = getAnswersForQuestion(result, qIndex);
                                  const variance = calculateQuestionVariance(openAIAnswers, modelAnswers);
                                  
                                  return (
                                    <td key={result.model} className="py-3 px-4">
                                      <div className="flex items-center space-x-2">
                                        <div className="flex-1">
                                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div 
                                              className={`h-1.5 rounded-full ${
                                                variance < 25 ? 'bg-green-500' :
                                                variance < 50 ? 'bg-yellow-500' :
                                                variance < 75 ? 'bg-orange-500' : 'bg-red-500'
                                              }`}
                                              style={{ width: `${variance}%` }}
                                            />
                                          </div>
                                        </div>
                                        <span className="text-xs font-medium min-w-[40px]">
                                          {variance}%
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {variance < 25 ? 'Very similar' :
                                         variance < 50 ? 'Somewhat different' :
                                         variance < 75 ? 'Quite different' : 'Very different'}
                                      </div>
                                    </td>
                                  );
                                })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">📖 Understanding Variance Scores</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
                      <div>
                        <span className="font-medium">0-25%:</span> Very similar responses - Models agree with OpenAI
                      </div>
                      <div>
                        <span className="font-medium">26-50%:</span> Moderate differences - Some unique perspectives
                      </div>
                      <div>
                        <span className="font-medium">51-75%:</span> Significant differences - Notably different viewpoints
                      </div>
                      <div>
                        <span className="font-medium">76-100%:</span> High divergence - Completely different approaches
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-4">📊 Aggregate Consensus Analysis</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Shows the overall consensus across all models for each question, revealing where AI models agree or diverge.
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Question #</th>
                          <th className="text-left py-3 px-4">Aggregate Consensus</th>
                          <th className="text-left py-3 px-4">Confidence Level</th>
                          <th className="text-left py-3 px-4">Response Distribution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {questions.slice(0, 10).map((question, qIndex) => {
                          const consensus = calculateAggregateConsensus(qIndex);
                          
                          return (
                            <tr key={qIndex} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">
                                <div>
                                  <div className="font-medium">Q{qIndex + 1}</div>
                                  <div className="text-xs text-gray-500 mt-1 max-w-xs">
                                    {question.question_text}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-sm">
                                  <div className="font-medium">{consensus.consensus}</div>
                                  <div className="text-xs text-gray-500">
                                    Most common response
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <div className="flex-1">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full ${
                                          consensus.confidence >= 75 ? 'bg-green-500' :
                                          consensus.confidence >= 50 ? 'bg-yellow-500' :
                                          consensus.confidence >= 25 ? 'bg-orange-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${consensus.confidence}%` }}
                                      />
                                    </div>
                                  </div>
                                  <span className="text-sm font-medium min-w-[40px]">
                                    {consensus.confidence}%
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {consensus.confidence >= 75 ? 'Strong consensus' :
                                   consensus.confidence >= 50 ? 'Moderate consensus' :
                                   consensus.confidence >= 25 ? 'Weak consensus' : 'No consensus'}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-xs">
                                  {Object.entries(consensus.distribution)
                                    .sort(([,a], [,b]) => (b as number) - (a as number))
                                    .slice(0, 3)
                                    .map(([answer, count], idx) => (
                                      <div key={answer} className={idx === 0 ? 'font-medium' : 'text-gray-500'}>
                                        {answer}: {count}
                                      </div>
                                    ))}
                                  {Object.keys(consensus.distribution).length > 3 && (
                                    <div className="text-gray-400 mt-1">
                                      +{Object.keys(consensus.distribution).length - 3} more...
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">🎯 Understanding Consensus Levels</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-800">
                      <div>
                        <span className="font-medium">75-100%:</span> Strong consensus - High model agreement
                      </div>
                      <div>
                        <span className="font-medium">50-74%:</span> Moderate consensus - Some model alignment
                      </div>
                      <div>
                        <span className="font-medium">25-49%:</span> Weak consensus - Limited agreement
                      </div>
                      <div>
                        <span className="font-medium">0-24%:</span> No consensus - Highly diverse responses
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Response Diversity Analysis */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🌈 Response Diversity & Consistency Analysis</h2>
              <p className="text-sm text-gray-600 mb-6">
                Measures how diverse each model's responses are internally and how consistent they are compared to each other.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Internal Consistency */}
                <div>
                  <h3 className="font-medium mb-3">Internal Consistency</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    How similar a model's responses are to each other (lower = more diverse personas)
                  </p>
                  {simulationResults.map(result => {
                    const consistency = calculateInternalConsistency(result);
                    return (
                      <div key={result.model} className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{result.model}</span>
                          <span className="font-medium">{consistency}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              consistency > 80 ? 'bg-orange-500' :
                              consistency > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${consistency}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {consistency > 80 ? 'Very consistent (limited diversity)' :
                           consistency > 60 ? 'Moderately consistent' : 'Highly diverse responses'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Cross-Model Agreement */}
                <div>
                  <h3 className="font-medium mb-3">Cross-Model Agreement</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    How often different models give the same type of answers
                  </p>
                  <div className="space-y-3">
                    {generateModelPairings(simulationResults).map(pairing => {
                      const agreement = calculateModelAgreement(pairing.model1, pairing.model2);
                      return (
                        <div key={`${pairing.model1.model}-${pairing.model2.model}`}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{pairing.model1.model} vs {pairing.model2.model}</span>
                            <span className="font-medium">{agreement}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${agreement}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {agreement > 75 ? 'High agreement' :
                             agreement > 50 ? 'Moderate agreement' : 'Low agreement (diverse perspectives)'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">💡 Key Insights & Recommendations</h2>
              
              {viewMode === 'compare' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-blue-900 mb-2">Most Unique Perspectives</h3>
                    {getMostDivergentModel(simulationResults) && (
                      <div className="p-3 bg-white rounded border-l-4 border-blue-500">
                        <p className="font-medium">{getMostDivergentModel(simulationResults)}</p>
                        <p className="text-sm text-gray-600">
                          Provides the most unique insights compared to OpenAI baseline
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-green-900 mb-2">Most Consistent Model</h3>
                    {getMostConsistentModel(simulationResults) && (
                      <div className="p-3 bg-white rounded border-l-4 border-green-500">
                        <p className="font-medium">{getMostConsistentModel(simulationResults)}</p>
                        <p className="text-sm text-gray-600">
                          Provides the most reliable and predictable responses
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-purple-900 mb-2">Consensus Quality</h3>
                    {(() => {
                      const insights = getCrossModelInsights();
                      const qualityLevel = insights.consensusStrength >= 70 ? 'High' : 
                                          insights.consensusStrength >= 50 ? 'Moderate' : 'Low';
                      const borderColor = insights.consensusStrength >= 70 ? 'border-green-500' : 
                                         insights.consensusStrength >= 50 ? 'border-yellow-500' : 'border-red-500';
                      
                      return (
                        <div className={`p-3 bg-white rounded border-l-4 ${borderColor}`}>
                          <p className="font-medium">{qualityLevel} Consensus ({insights.consensusStrength}%)</p>
                          <p className="text-sm text-gray-600">
                            {insights.consensusStrength >= 70 ? 'Strong agreement across models' :
                             insights.consensusStrength >= 50 ? 'Moderate agreement with some variance' :
                             'High diversity in model responses'}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-indigo-900 mb-2">Response Diversity</h3>
                    {(() => {
                      const insights = getCrossModelInsights();
                      const diversityLevel = insights.diversityIndex >= 60 ? 'High' : 
                                            insights.diversityIndex >= 30 ? 'Moderate' : 'Low';
                      const borderColor = insights.diversityIndex >= 60 ? 'border-purple-500' : 
                                         insights.diversityIndex >= 30 ? 'border-blue-500' : 'border-gray-500';
                      
                      return (
                        <div className={`p-3 bg-white rounded border-l-4 ${borderColor}`}>
                          <p className="font-medium">{diversityLevel} Diversity ({insights.diversityIndex}%)</p>
                          <p className="text-sm text-gray-600">
                            {insights.diversityIndex >= 60 ? 'Models provide varied perspectives' :
                             insights.diversityIndex >= 30 ? 'Balanced mix of agreement and diversity' :
                             'Models tend to respond similarly'}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-white rounded">
                <h4 className="font-medium mb-2">📈 Business Recommendations</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {viewMode === 'compare' ? (
                    <>
                      <li>• Use diverse models for comprehensive market research</li>
                      <li>• Combine consistent models for reliable baseline insights</li>
                      <li>• High variance questions may need additional research</li>
                      <li>• Consider model strengths for different question types</li>
                    </>
                  ) : (
                    <>
                      <li>• High consensus questions indicate strong market signals</li>
                      <li>• Low consensus areas may represent emerging trends</li>
                      <li>• Use aggregate insights for population-level conclusions</li>
                      <li>• Balance consensus strength with diversity for complete picture</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

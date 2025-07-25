'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { Download, Save, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import SimulatorTabs from '../../SimulatorTabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Helper Functions for Prompt Generation ---
const createQuestionList = (questions) => {
  return questions.map(q => {
    let base = `Question ${q.question_number}: "${q.question_text}" (Type: ${q.type})`;
    if (q.type !== "input" && Array.isArray(q.options)) {
      base += `\nAllowed options:\n${q.options.map(opt => `- ${opt}`).join('\n')}`;
      base += `\nIMPORTANT: For this question, you MUST select from the provided options and use the option text exactly as shown. Do NOT invent, rephrase, or abbreviate options.`;
    }
    return base;
  }).join('\n');
};

const generatePersonas = (options) => {
  return Object.entries(options)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('; ');
};

// --- Reusable UI Components ---

const SurveySelection = ({ survey, questionsToAsk }) => (
  <div className="bg-white shadow-lg rounded-lg p-6 border">
    <h2 className="text-lg font-semibold mb-4 border-b pb-2">1. Survey Details</h2>
    <input
      type="text"
      readOnly
      value={survey?.title || 'Loading survey...'}
      className="w-full mt-1 border px-3 py-2 rounded-md shadow-sm bg-gray-100"
    />
    <p className="mt-4 text-sm font-medium text-gray-800">Survey Questions ({questionsToAsk.length})</p>
    <ul className="mt-2 space-y-2 border rounded-md p-2 h-40 overflow-y-auto bg-slate-50">
      {questionsToAsk.length > 0 ? (
        questionsToAsk.map(q => (
          <li key={q.id} className="bg-white p-2 rounded shadow-sm text-sm">
            <span>{q.question_text}</span>
          </li>
        ))
      ) : (
        <li className="text-center text-gray-500 text-sm py-4">Loading questions...</li>
      )}
    </ul>
  </div>
);

const AudienceStep = ({
  audienceMode, setAudienceMode, personaText, setPersonaText,
  savedAudiences, handleLoadAudience, selectedCountryId, handleCountryChange,
  countries, fieldsByCategory, selectedCategory, setSelectedCategory,
  selectedField, setSelectedField, selectedOptions, toggleOption,
  audienceName, setAudienceName, handleSaveAudience, disabled,
  personaTemplates // <-- ADD THIS
}) => (
  <fieldset disabled={disabled} className="bg-white shadow-lg rounded-lg p-6 border disabled:opacity-60">
    <div className="flex items-center mb-4 pb-2 border-b">
      <h2 className="text-lg font-semibold mr-4">2. Define Target</h2>
      <div className="flex items-center bg-gray-200 rounded-lg p-1">
        <button onClick={() => setAudienceMode('targeting')} className={`px-4 py-1 text-sm rounded-md ${audienceMode === 'targeting' ? 'bg-blue-600 text-white shadow font-semibold' : 'bg-white text-blue-600'}`}>Target Audience</button>
        <button onClick={() => setAudienceMode('persona')} className={`px-4 py-1 text-sm rounded-md ${audienceMode === 'persona' ? 'bg-blue-600 text-white shadow font-semibold' : 'bg-white text-blue-600'}`}>AI Personas</button>
      </div>
    </div>
    {audienceMode === 'targeting' ? (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Load Saved Target</label>
            <Select onValueChange={handleLoadAudience}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="— Keep survey's default target —" /></SelectTrigger>
              <SelectContent className="bg-white">
                {savedAudiences.map(aud => (<SelectItem key={aud.id} value={aud.id}>{aud.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <Select value={selectedCountryId} onValueChange={handleCountryChange}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                    {countries.map(country => (<SelectItem key={country.id} value={country.id}>{country.country_name}</SelectItem>))}
                </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex border rounded-md divide-x bg-white h-72 mt-4">
          <div className="w-1/3 p-2 bg-slate-50 border-r overflow-y-auto">{Object.keys(fieldsByCategory).map(cat => (<div key={cat} className={`cursor-pointer py-2 px-2 border-b text-sm hover:bg-slate-100 ${selectedCategory === cat ? 'font-bold text-blue-700' : ''}`} onClick={() => { setSelectedCategory(cat); setSelectedField(''); }}>{cat}</div>))}</div>
          <div className="w-1/3 p-2 bg-slate-50 border-r overflow-y-auto">{Object.keys(fieldsByCategory[selectedCategory] || {}).map(field => (<div key={field} className={`cursor-pointer py-2 px-2 border-b text-sm hover:bg-slate-100 ${selectedField === field ? 'font-bold text-blue-700' : ''}`} onClick={() => setSelectedField(field)}>{field}</div>))}</div>
          <div className="w-1/2 p-4 bg-white overflow-y-auto">{(fieldsByCategory[selectedCategory]?.[selectedField] || []).map(option => (<label key={option} className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" checked={(selectedOptions[selectedField] || []).includes(option)} onChange={() => toggleOption(selectedField, option)} className="h-4 w-4 rounded accent-blue-600"/><span>{option}</span></label>))}</div>
        </div>
        {Object.keys(selectedOptions).length > 0 && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
            <label className="block text-sm font-medium text-gray-700">Save Current Target</label>
            <div className="flex gap-2 mt-1">
              <input value={audienceName} onChange={(e) => setAudienceName(e.target.value)} placeholder="e.g., US Coastal Millennials" className="w-full border px-3 py-2 rounded-md shadow-sm"/>
              <button onClick={handleSaveAudience} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"><Save size={16} /> Save</button>
            </div>
          </div>
        )}
      </>
    ) : (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Enter your persona below:</label>
        <textarea
            value={personaText}
            onChange={(e) => setPersonaText(e.target.value)}
            className="w-full h-48 border rounded-md p-3 shadow-sm"
            placeholder="e.g., A successful businesswoman in her late 30s, living in a major city, who values luxury and cultural experiences on her family vacations."
        />
        <div className="flex gap-2 mt-2">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            onClick={async () => {
              // Save to current survey
              const { error } = await supabase
                .from('surveys')
                .update({ persona_description: personaText })
                .eq('id', surveyId);
              if (error) toast.error("Failed to save persona.");
              else toast.success("Persona saved to this survey!");
            }}
          >
            Save
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            onClick={async () => {
              const name = prompt("Template name?");
              if (!name) return;
              const { error } = await supabase
                .from('persona_templates')
                .insert({ name, description: personaText });
              if (error) toast.error("Failed to save template.");
              else toast.success("Persona template saved!");
              // Optionally: refresh templates list here
            }}
          >
            Save Template
          </button>
          <Select onValueChange={async (templateId) => {
            const { data } = await supabase
              .from('persona_templates')
              .select('*')
              .eq('id', templateId)
              .single();
            if (data) setPersonaText(data.description);
          }}>
            <SelectTrigger className="w-48 bg-white ml-2">
              <SelectValue placeholder="Load template..." />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {personaTemplates.map(tpl => (
                <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )}
  </fieldset>
);

const SimulationControls = ({ simulationCount, setSimulationCount, handleGenerateSimulation, isSimulating, disabled }) => (
  <fieldset disabled={disabled} className="bg-white shadow-lg rounded-lg p-6 border disabled:opacity-60">
    <h2 className="text-lg font-semibold mb-4 border-b pb-2">3. Configure & Run Simulation</h2>
    <div className="mb-4">
      <label className="block font-medium mb-1 text-sm">Number of Responses</label>
      <input type="number" min="1" max="100" className="border px-3 py-2 rounded-md w-28 text-sm" value={simulationCount} onChange={(e) => setSimulationCount(Number(e.target.value))}/>
    </div>
    <button onClick={handleGenerateSimulation} disabled={isSimulating} className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 font-bold disabled:bg-gray-400">{isSimulating ? 'Generating...' : 'Generate Simulated Responses'}</button>
  </fieldset>
);

const RawDataDisplay = ({ results, questions, onDownloadCSV, isSimulating, simulationProgress, simulationCount, handleDeleteResults }) => (
    <div className="relative bg-white p-6 rounded-lg shadow-lg border">
        {isSimulating && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
                <Loader2 className="animate-spin h-10 w-10 text-blue-600 mb-4" />
                <p className="text-lg font-semibold text-gray-700">Generating AI responses...</p>
                <p className="text-sm text-gray-500">This may take a moment.</p>
                {simulationCount > 0 && (
                    <p className="text-sm font-bold text-blue-700 mt-2">{simulationProgress} of {simulationCount} responses complete</p>
                )}
            </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg">Raw Simulation Data</h2>
          <div className="flex gap-2">
            <button className="bg-blue-50 text-blue-700 px-3 py-1 rounded font-semibold" onClick={onDownloadCSV}>
              Download CSV
            </button>
            <button
              className="bg-red-600 text-white px-3 py-1 rounded font-semibold"
              onClick={handleDeleteResults}
            >
              Clear Results
            </button>
          </div>
        </div>
        <div className="mb-2 text-gray-600 text-sm">
          Simulation completes: <span className="font-bold">{results.length}</span>
        </div>
        <div className="space-y-6 mt-4 border rounded-lg p-4 h-[calc(100vh-15rem)] overflow-y-auto bg-slate-50">
            {results.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                    <p className="text-center text-gray-500 py-10">Raw results will appear here...</p>
                </div>
            ) : (
                results.map((result, index) => (
                    <div key={result.id || index} className="bg-white p-4 rounded shadow">
                        <p className="font-semibold text-blue-800">
                            Respondent #{result.respondent_number || (index + 1)}: <span className="font-normal text-gray-700">{result.archetype}</span>
                        </p>
                        <div className="mt-2 text-xs text-gray-600 border-t pt-2">
                            <strong>Profile:</strong> {Object.entries(result.demographicprofile || {}).map(([key, value]) => `${key}: ${value}`).join('; ')}
                        </div>
                        <div className="mt-3 space-y-3 border-t pt-3">
                            {(result.answers || []).map((item, qIndex) => {
                                // Convert question_number to number to ensure type matching
                                const questionNumber = typeof item.question_number === 'string' 
                                    ? parseInt(item.question_number, 10) 
                                    : item.question_number;
                                    
                                const question = questions.find(q => q.question_number === questionNumber);
                                const questionText = question ? question.question_text : `Question #${item.question_number || 'N/A'}`;
                                
                                return (
                                    <div key={qIndex} className="text-sm">
                                        <p className="font-medium text-gray-800">{questionText}</p>
                                        <p className="text-gray-600 pl-2 border-l-2 border-gray-300 ml-1 mt-1">{String(item.answer)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);


export default function SimulationPage({ params }) {
  const pathname = usePathname();
  const { id: surveyId } = params;

  const isActiveTab = (path) => pathname.includes(path);

  const [survey, setSurvey] = useState(null);
  const [audienceMode, setAudienceMode] = useState('targeting');
  const [personaText, setPersonaText] = useState('');
  const [countries, setCountries] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [fieldsByCategory, setFieldsByCategory] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('Demographics');
  const [selectedField, setSelectedField] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({});
  const [questionsToAsk, setQuestionsToAsk] = useState([]);
  const [simulationCount, setSimulationCount] = useState(5);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState([]);
  const [savedAudiences, setSavedAudiences] = useState([]);
  const [audienceName, setAudienceName] = useState('');
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [surveyMode, setSurveyMode] = useState(''); // <-- Add survey_mode to your state declarations at the top
  const audioRef = useRef(null);
  const [personaTemplates, setPersonaTemplates] = useState([]); // <-- ADD THIS

  // Fetch initial data for the page
  useEffect(() => {
    const getInitialData = async () => {
      if (!surveyId) return;

      const loadingToast = toast.loading("Loading survey data...");
      try {
        // Step 1: Fetch Survey, Countries, and Audiences
        const [surveyRes, countryRes, audienceRes] = await Promise.all([
          supabase.from('surveys')
            .select('*, country(*), survey_mode') // <-- Add survey_mode to select
            .eq('id', surveyId)
            .single(),
          supabase.from('country').select('id, country_name').order('country_name'),
          supabase.from('savedaudiences').select('*').order('name')
        ]);

        if (surveyRes.error) throw new Error(`Survey: ${surveyRes.error.message}`);
        if (countryRes.error) throw new Error(`Countries: ${countryRes.error.message}`);
        if (audienceRes.error) throw new Error(`Audiences: ${audienceRes.error.message}`);

        const surveyData = surveyRes.data;
        const countryData = countryRes.data;
        
        setSurvey(surveyData);
        setCountries(countryData || []);
        setSavedAudiences(audienceRes.data || []);

        // Step 2: Set initial UI state from survey data
        if (surveyData.country_id) {
          setSelectedCountryId(surveyData.country_id);
          if (surveyData.targeting && surveyData.targeting[surveyData.country_id]) {
            setSelectedOptions(surveyData.targeting[surveyData.country_id]);
          }
        } else if (countryData?.length > 0) {
          setSelectedCountryId(countryData[0].id);
        }

        // Step 3: Fetch Questions and call the refresh function for results
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .select('*')
          .eq('survey_id', surveyId)
          .order('question_order');

        if (questionError) throw new Error(`Questions: ${questionError.message}`);
        setQuestionsToAsk(questionData || []);
        
        // Use the refresh function to load simulation results
        await refreshSimulationResults();
        
        toast.success("Survey data loaded.", { id: loadingToast });
      } catch (error) {
        toast.error(`Failed to load page: ${error.message}`, { id: loadingToast });
        console.error("Data loading failed:", error);
      }
    };

    getInitialData();
  }, [surveyId]);

  // Refresh simulation results from the database
const refreshSimulationResults = async () => {
  if (!surveyId) return;
  
  const { data, error } = await supabase
    .from('simulation_results')
    .select('*')
    .eq('survey_id', surveyId)
    .order('respondent_number');
    
  if (error) {
    console.error("Failed to load simulation results:", error);
    toast.error(`Failed to load results: ${error.message}`);
    return;
  }
  
  setSimulationResults(data || []);
};

  // Fetch targeting attributes when country changes
  useEffect(() => {
    if (!selectedCountryId) return;
    async function fetchAttributesForCountry() {
      const buildQuery = (tableName) => supabase.from(tableName).select('field_name, value').eq('country_id', selectedCountryId);
      
      const [demoRaw, geoRaw, psychoRaw] = await Promise.all([
        buildQuery('demoattributes'),
        buildQuery('geoattributes'),
        buildQuery('psychoattributes'),
      ]);

      const groupFields = (raw) => Object.entries((raw?.data || []).reduce((acc, item) => {
        if (!acc[item.field_name]) acc[item.field_name] = new Set();
        acc[item.field_name].add(item.value);
        return acc;
      }, {})).reduce((acc, [name, values]) => ({ ...acc, [name]: Array.from(values).sort() }), {});

      setFieldsByCategory({ Demographics: groupFields(demoRaw), Geographics: groupFields(geoRaw), Psychographics: groupFields(psychoRaw) });
      setSelectedCategory('Demographics');
      setSelectedField('');
    }
    fetchAttributesForCountry();
  }, [selectedCountryId]);

  const handleCountryChange = (countryId) => { 
    setSelectedCountryId(countryId); 
    setSelectedOptions({}); 
    toast.info("Targeting options cleared for new country.");
  };

  const toggleOption = useCallback((field, option) => { 
    setSelectedOptions(prev => { 
      const currentValues = new Set(prev[field] || []);
      currentValues.has(option) ? currentValues.delete(option) : currentValues.add(option);
      const newOptions = { ...prev, [field]: Array.from(currentValues) };
      if (newOptions[field].length === 0) delete newOptions[field];
      return newOptions;
    }); 
  }, []);

  const handleLoadAudience = (audienceId) => { 
    if (!audienceId) return; 
    const aud = savedAudiences.find(a => a.id === audienceId); 
    if (aud) {
        setSelectedOptions(aud.targeting_json || {});
        toast.success(`Loaded audience: ${aud.name}`);
    }
  };

  const handleSaveAudience = async () => { 
    if (!audienceName.trim()) return toast.error("Please provide a name for the audience.");
    const { data, error } = await supabase.from('savedaudiences').insert({ name: audienceName.trim(), targeting_json: selectedOptions }).select();
    if (error) return toast.error("Failed to save audience.");
    setSavedAudiences(prev => [...prev, ...data]); 
    setAudienceName('');
    toast.success("Audience saved!"); 
  };

  const handleDeleteResults = async () => {
    if (simulationResults.length === 0) {
      return toast.error("There are no results to delete.");
    }
    const confirmed = window.confirm("Are you sure you want to delete all simulation results for this survey? This action cannot be undone.");
    if (confirmed) {
      const loadingToast = toast.loading("Deleting results...");
      const { error } = await supabase.from('simulation_results').delete().eq('survey_id', surveyId);
      if (error) {
        toast.error(`Failed to delete results: ${error.message}`, { id: loadingToast });
      } else {
        setSimulationResults([]);
        toast.success("All simulation results have been deleted.", { id: loadingToast });
      }
    }
  };

  const handleGenerateSimulation = async () => {
    if (questionsToAsk.length === 0) {
      return toast.error("Survey has no questions to simulate.");
    }

    audioRef.current = new Audio('/simulator/simulation/simulation-done.mp3');
    audioRef.current.load();

    setIsSimulating(true);
    setSimulationProgress(0);
    
    const lastRespondentNumber = simulationResults.length > 0
      ? Math.max(...simulationResults.map(r => r.respondent_number || 0))
      : 0;

    const audienceDescription = audienceMode === 'persona' ? personaText : generatePersonas(selectedOptions);
    const questionList = createQuestionList(questionsToAsk);
    const newSimulations = [];

    for (let i = 1; i <= simulationCount; i++) {
      const respondentNumber = lastRespondentNumber + i;
      const allResultsSoFar = [...simulationResults, ...newSimulations];
      const existingArchetypes = allResultsSoFar.map(r => r.archetype).filter(Boolean).join(', ');
      
      const prompt = `
        Based on the following target audience:
        ---
        ${audienceDescription}
        ---
        Please generate a SINGLE, unique, and realistic simulated survey response for the survey titled "${survey.title}".
        
        For all questions except those of type "input", you MUST select from the provided answer options and use the option text exactly as shown in the answer option. Do NOT invent, rephrase, or abbreviate options.

        Here are the survey questions. You must provide an answer for EACH question using the exact question_number:
        ---
        ${questionList}
        ---        ---
                ${questionList}
                ---

        Your response MUST be a valid JSON object with this exact structure:
        {
          "simulated_responses": [{
            "respondent_number": ${respondentNumber},
            "archetype": "Brief persona description",
            "demographicProfile": {
              "key demographic attributes": "values"
            },
            "answers": [
              {
                "question_number": 1,
                "answer": "your answer for question 1"
              },
              {
                "question_number": 2,
                "answer": "your answer for question 2"
              }
              // etc. for each question
            ]
          }]
        }

        IMPORTANT:
        - Each question_number must match exactly with the input questions
        - Provide an answer for EVERY question
        - Numbers must be integers, not strings
        - Keep answers concise and realistic
      `;

      try {
        const response = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `Request failed for respondent #${i}.`);
        }

        const data = await response.json();
        const newResult = data.simulated_responses[0];
        
        if (!newResult) {
            throw new Error(`AI returned an invalid response for respondent #${i}.`);
        }

        // FIX: Clean and validate the AI's response with strict integer comparison.
        const cleanedAnswers = questionsToAsk.map((question) => {
            // First try to match by question_number
            const aiAnswerObject = Array.isArray(newResult.answers) 
                ? newResult.answers.find(a => {
                    // Convert both to numbers for consistent comparison
                    const aiQuestionNum = parseInt(String(a.question_number), 10);
                    const questionNum = parseInt(String(question.question_number), 10);
                    return aiQuestionNum === questionNum;
                }) 
                : null;
            
            // Add debug logging
            if (!aiAnswerObject) {
                console.warn(`No answer found for question ${question.question_number}`, {
                    question,
                    available_answers: newResult.answers
                });
            }
            
            return {
                question_number: question.question_number,
                answer: aiAnswerObject?.answer || ''
            };
        });

        const formattedResult = {
          id: uuidv4(),
          survey_id: surveyId,
          respondent_number: respondentNumber,
          archetype: newResult.archetype,
          answers: cleanedAnswers,
          demographicprofile: newResult.demographicProfile
        };

        newSimulations.push(formattedResult);
        setSimulationResults(prevResults => [...prevResults, formattedResult]);
        setSimulationProgress(i);

      } catch (error) {
        toast.error(`Simulation failed: ${error.message}`);
        setIsSimulating(false);
        return;
      }
    }

    try {
      const { error: insertError } = await supabase.from('simulation_results').insert(newSimulations);
      if (insertError) throw insertError;

      toast.success("Simulation complete! All new results saved.");
      
      if (audioRef.current) {
        audioRef.current.play().catch(err => console.error("Audio playback failed:", err));
      }

    } catch (error) {
      toast.error(`Failed to save results to database: ${error.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const exportToCSV = () => {
    if (simulationResults.length === 0) {
      toast.error("No simulation results to export.");
      return;
    }

    const escapeCsvCell = (cell) => {
      const str = String(cell ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Respondent #', 
      'Archetype', 
      'Profile', 
      ...questionsToAsk.map(q => q.question_text)
    ].map(escapeCsvCell).join(',');

    const rows = simulationResults.map(res => {
      const answersMap = new Map(
        (res.answers || []).map(ans => [
          ans.question_number, // Use integer directly
          Array.isArray(ans.answer) ? ans.answer.join('; ') : String(ans.answer)
        ])
      );

      const profileString = Object.entries(res.demographicprofile || {})
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
      
      const rowData = [
        res.respondent_number,
        res.archetype,
        profileString,
        ...questionsToAsk.map(q => answersMap.get(q.question_number) || '')
      ];

      return rowData.map(escapeCsvCell).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${survey?.title?.replace(/ /g, '_') || 'survey'}_simulation.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fetch persona templates on mount
  useEffect(() => {
    async function fetchPersonaTemplates() {
      const { data, error } = await supabase
        .from('persona_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setPersonaTemplates(data || []);
    }
    fetchPersonaTemplates();
  }, []);

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      {/* Main Navigation Tabs */}
      <nav className="flex space-x-8 border-b border-gray-200 mb-6">
        <Link 
          href={`/simulator/${surveyId}/general`}
          className={`pb-4 px-1 ${isActiveTab('general') 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          General
        </Link>
        <Link 
          href={`/simulator/${surveyId}/targeting`}
          className={`pb-4 px-1 ${isActiveTab('targeting') 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          Targeting
        </Link>
        <Link 
          href={`/simulator/${surveyId}/survey`}
          className={`pb-4 px-1 ${isActiveTab('survey') 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          Survey
        </Link>
        <Link 
          href={`/simulator/${surveyId}/quotas`}
          className={`pb-4 px-1 ${isActiveTab('quotas') 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          Quotas
        </Link>
        <Link 
          href={`/simulator/${surveyId}/simulation`}
          className={`pb-4 px-1 ${isActiveTab('simulation') 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          Simulation
        </Link>
        <Link 
          href={`/simulator/${surveyId}/reporting`}
          className={`pb-4 px-1 ${isActiveTab('reporting') 
            ? 'border-b-2 border-blue-500 text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          Reporting
        </Link>
      </nav>

      {/* Remove SimulatorTabs component since we're replacing it */}
      {/* <SimulatorTabs id={params.id} /> */}
      
      {/* Keep your existing content */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
              <SurveySelection survey={survey} questionsToAsk={questionsToAsk} />
              <AudienceStep 
                  audienceMode={audienceMode}
                  setAudienceMode={setAudienceMode}
                  personaText={personaText}
                  setPersonaText={setPersonaText}
                  savedAudiences={savedAudiences}
                  handleLoadAudience={handleLoadAudience}
                  selectedCountryId={selectedCountryId}
                  handleCountryChange={handleCountryChange}
                  countries={countries}
                  fieldsByCategory={fieldsByCategory}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedField={selectedField}
                  setSelectedField={setSelectedField}
                  selectedOptions={selectedOptions}
                  toggleOption={toggleOption}
                  audienceName={audienceName}
                  setAudienceName={setAudienceName}
                  handleSaveAudience={handleSaveAudience}
                  disabled={!surveyId}
                  personaTemplates={personaTemplates} // <-- ADD THIS LINE
              />
              <SimulationControls 
                  simulationCount={simulationCount}
                  setSimulationCount={setSimulationCount}
                  handleGenerateSimulation={handleGenerateSimulation}
                  isSimulating={isSimulating}
                  disabled={!surveyId}
              />
          </div>
          {/* Right Column */}
          <RawDataDisplay 
              results={simulationResults} 
              questions={questionsToAsk} 
              onDownloadCSV={exportToCSV} 
              isSimulating={isSimulating} 
              simulationProgress={simulationProgress} 
              simulationCount={simulationCount} 
              handleDeleteResults={handleDeleteResults}
          />
        </div>
      </div>
    </div>
  );
}


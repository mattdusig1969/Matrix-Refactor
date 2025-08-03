'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Helper: Generate options from question text for rating_scale (e.g., "1-5")
function generateOptionsFromText(question) {
  if (question.question_type === 'rating_scale') {
    // Try to extract a range like "1-5" or "1 to 8" from the question text
    const match = question.question_text.match(/([0-9]+)\s*[-to]+\s*([0-9]+)/i);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = parseInt(match[2], 10);
      if (!isNaN(start) && !isNaN(end) && end > start) {
        return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
      }
    }
    // Fallback: 1-5
    return ['1','2','3','4','5'];
  }
  return [];
}
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



// Function to create the question list for the prompt, with debug logging
export function createQuestionList(questions: any[]): string {
  const questionList = questions
    .map((question, idx) => {
      let qText = `${idx + 1}. ${question.question_text}`;
      // Only require options for multiple-choice/rating questions
      const needsOptions = [
        'single_select_radio',
        'single_select_dropdown',
        'multi_select_checkbox',
        'multiple_select',
        'rating_scale'
      ].includes(question.question_type);
      if (needsOptions) {
        if (!('options' in question)) {
          console.error(`Question object is missing 'options' property:`, question);
          throw new Error(`Question '${question.question_text}' is missing 'options' property!`);
        }
        if (!Array.isArray(question.options) || question.options.length === 0) {
          console.error(`Question '${question.question_text}' has no options or options is not an array:`, question.options);
          throw new Error(`Question '${question.question_text}' is missing options!`);
        }
        // Debug: log options for each question
        console.log(`Options for question '${question.question_text}':`, question.options);
        qText += `\nOptions: ${question.options.join(', ')}`;
      }
      return qText;
    })
    .join('\n\n');
  // Debug: log the full prompt
  console.log('Full OpenAI prompt being sent:', questionList);
  return questionList;
}
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
  personaTemplates, surveyId
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
      <label className="block font-medium mb-1 text-sm">Number of Simulated Respondents</label>
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
                    <p className="text-sm font-bold text-blue-700 mt-2">{simulationProgress} of {simulationCount} surveys complete</p>
                )}
            </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg">Raw Simulation Data</h2>
          <div className="flex gap-2">
            <button className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold text-xs" style={{fontSize:'0.85rem',padding:'0.25rem 0.5rem'}} onClick={onDownloadCSV}>
              Download CSV
            </button>
            <button
              className="bg-red-600 text-white px-2 py-0.5 rounded font-semibold text-xs" style={{fontSize:'0.85rem',padding:'0.25rem 0.5rem'}}
              onClick={handleDeleteResults}
            >
              Clear Results
            </button>
          </div>
        </div>
        <div className="mb-2 text-gray-600 text-sm">
          Simulation completes: <span className="font-bold">{results.filter(r => r.run_number === 1).length}</span>
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



        const needsOptions = [
          'single_select_radio',
          'single_select_dropdown',
          'multi_select_checkbox',
          'multiple_select',
          'rating_scale'
        ];
        const questionsWithOptions = (questionData || []).map(q => {
          let options = [];
          // Always try to parse answer_option if present
          if (q.answer_option) {
            try {
              let optString = q.answer_option;
              // Handle double-encoded (e.g., '"[\"A\",\"B\"]"')
              if (typeof optString === 'string' && optString.startsWith('"[')) {
                optString = optString.replace(/^"|"$/g, '');
              }
              options = JSON.parse(optString);
            } catch (e) {
              console.warn('Failed to parse answer_option for question', q.id, q.answer_option, e);
              options = [];
            }
          }
          // If still empty and needsOptions, try to generate from question text (for rating_scale)
          if ((!Array.isArray(options) || options.length === 0) && q.question_type === 'rating_scale') {
            options = generateOptionsFromText(q);
          }
          // Defensive: ensure options is always an array
          if (!Array.isArray(options)) options = [];
          return { ...q, options };
        });
        setQuestionsToAsk(questionsWithOptions);

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
      }, {})).reduce((acc, [name, values]) => {
        let arr;
        if (values instanceof Set) {
          arr = Array.from(values);
        } else if (Array.isArray(values)) {
          arr = values;
        } else {
          arr = Array.from(new Set());
        }
        return { ...acc, [name]: arr.sort() };
      }, {});

      setFieldsByCategory({ Demographics: groupFields(demoRaw), Geographics: groupFields(geoRaw), Psychographics: groupFields(psychoRaw) });
      setSelectedCategory('Demographics');
      setSelectedField('');
    }
    fetchAttributesForCountry();
  }, [selectedCountryId]);

  const handleCountryChange = (countryId) => { 
    setSelectedCountryId(countryId); 
    setSelectedOptions({}); 
    toast.success("Targeting options cleared for new country.");
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

    audioRef.current = new Audio('/simulator/[id]/simulation/simulation-done.mp3');
    
    audioRef.current.load();

    setIsSimulating(true);
    setSimulationProgress(0);

    const lastRespondentNumber = simulationResults.length > 0
      ? Math.max(...simulationResults.map(r => r.respondent_number || 0))
      : 0;

    const audienceDescription = audienceMode === 'persona' ? personaText : generatePersonas(selectedOptions);
    const batchSize = 3; // Number of respondents per batch
    const totalNeeded = simulationCount;
    let generated = 0;
    let attempts = 0;
    const maxAttempts = simulationCount * 5;
    const newSimulations = [];
    const usedArchetypes = new Set(simulationResults.map(r => r.archetype));
    const usedProfiles = new Set(simulationResults.map(r => JSON.stringify(r.demographicprofile)));

    const maxRetriesPerRespondent = 3;
    while (generated < totalNeeded && attempts < maxAttempts) {
      const batch = [];
      const batchRespondentNumbers = [];
      for (let i = 0; i < batchSize && generated + i < totalNeeded; i++) {
        batch.push({ retryCount: 0 });
        batchRespondentNumbers.push(lastRespondentNumber + generated + i + 1);
      }

      for (let i = 0; i < batch.length; i++) {
        let retryCount = 0;
        let success = false;
        let cleanedAnswers = null;
        let newResult = null;
        let personaData = null;
        let respondentNumber = batchRespondentNumbers[i];
        while (retryCount < maxRetriesPerRespondent && !success) {
          attempts++;
          // ...existing code to build prompt, send to OpenAI, and parse response...
          // (Copy the prompt/questionList/sampleOutput logic from your current code here)
          const allResultsSoFar = [...simulationResults, ...newSimulations];
          const existingArchetypes = allResultsSoFar.map(r => r.archetype).filter(Boolean).join(', ');
          const existingProfiles = allResultsSoFar.map(r => JSON.stringify(r.demographicprofile)).filter(Boolean).join('\n');
          const detailedQuestionList = questionsToAsk.map((q, idx) => {
            let line = `${idx + 1}. ${q.question_text}`;
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
          const sampleOutput = `Sample output:\n{\n  "simulated_responses": [{\n    "respondent_number": 1,\n    "archetype": "Young professional who loves adventure travel",\n    "demographicProfile": {\n      "age": "28",\n      "income": "$80,000",\n      "education": "Bachelor's"\n    },\n    "answers": [\n      { "question_number": 1, "answer": "Once a year" },\n      { "question_number": 2, "answer": "Relaxation" },\n      { "question_number": 3, "answer": "5" },\n      { "question_number": 4, "answer": "A trip to Japan with my family." }\n    ]\n  }]\n}`;
          const prompt = `
            Based on the following target audience:
            ---
            ${audienceDescription}
            ---
            Please generate a SINGLE, unique, and realistic simulated survey response for the survey titled "${survey.title}".

            For each question:
            - If it is multiple choice or rating scale, you MUST select from the provided options and use the option text or number exactly as shown. Do NOT invent, rephrase, or abbreviate options.
            - If it is open-ended, you MUST provide a short, realistic answer. Do NOT leave any answer blank or empty.
            - If you are unsure or do not know the answer for a multiple choice or rating scale, ALWAYS select the FIRST option from the provided list for that question. Never leave any answer blank.

            Here are the survey questions. You must provide an answer for EVERY question using the exact question_number:
            ---
            ${detailedQuestionList}
            ---

            IMPORTANT: Each persona MUST have a unique archetype and a unique combination of demographic attributes (such as income, ethnicity, education, etc.). Do NOT repeat the same archetype or the same full set of demographic details as any previous respondent. Previously used archetypes: [${existingArchetypes}]. Previously used demographic profiles (JSON):\n${existingProfiles}

            Your response MUST be a valid JSON object with this exact structure. ${sampleOutput}

            IMPORTANT:
            - Each question_number must match exactly with the input questions
            - Provide a NON-EMPTY answer for EVERY question (no blanks allowed)
            - If unsure, ALWAYS use the FIRST option from the provided list for multiple choice or rating scale
            - Numbers must be integers, not strings
            - Keep answers concise and realistic
          `;
          let response;
          let is429 = false;
          let waitMs = 10000 * (retryCount + 1); // Exponential backoff: 10s, 20s, 30s
          try {
            response = await fetch('/api/simulate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt }),
            });
            if (response.status === 429) {
              is429 = true;
              toast.error('OpenAI rate limit hit. Waiting before retrying...');
              await new Promise(res => setTimeout(res, waitMs));
              retryCount++;
              continue;
            }
          } catch (err) {
            retryCount++;
            continue;
          }
          if (!response.ok) {
            retryCount++;
            continue;
          }
          const data = await response.json();
          newResult = data.simulated_responses[0];
          if (!newResult) {
            retryCount++;
            continue;
          }
          // Check for duplicate archetype or demographic profile
          const profileString = JSON.stringify(newResult.demographicProfile);
          if (usedArchetypes.has(newResult.archetype) || usedProfiles.has(profileString)) {
            retryCount++;
            continue;
          }
          // Clean and validate the AI's response with strict integer comparison.
          let hasEmptyAnswer = false;
          cleanedAnswers = questionsToAsk.map((question) => {
            const aiAnswerObject = Array.isArray(newResult.answers)
              ? newResult.answers.find(a => {
                  const aiQuestionNum = parseInt(String(a.question_number), 10);
                  const questionNum = parseInt(String(question.question_number), 10);
                  return aiQuestionNum === questionNum;
                })
              : null;
            let answer = aiAnswerObject?.answer || '';
            const needsOptions = [
              'single_select_radio',
              'single_select_dropdown',
              'multi_select_checkbox',
              'multiple_select',
              'rating_scale'
            ];
            if (needsOptions.includes(question.question_type)) {
              if (!Array.isArray(question.options) || question.options.length === 0) {
                hasEmptyAnswer = true;
              }
              const normalize = (str) => String(str).toLowerCase().replace(/[^a-z0-9]+/g, '').trim();
              const allowedOptions = question.options.map(opt => String(opt).trim());
              const normalizedAllowed = allowedOptions.map(opt => normalize(opt));
              if (question.question_type === 'multi_select_checkbox' || question.question_type === 'multiple_select') {
                const aiAnswers = String(answer).split(';').map(a => a.trim()).filter(Boolean);
                if (aiAnswers.length === 0) {
                  hasEmptyAnswer = true;
                }
                const validAnswers = aiAnswers.map(ans => {
                  const normAns = normalize(ans);
                  const idx = normalizedAllowed.findIndex(opt => opt === normAns);
                  if (idx !== -1) {
                    return allowedOptions[idx];
                  } else {
                    return null;
                  }
                }).filter(Boolean);
                if (validAnswers.length !== aiAnswers.length) {
                  hasEmptyAnswer = true;
                }
                answer = validAnswers.join('; ');
              } else {
                const normalizedAnswer = normalize(answer);
                if (!answer || normalizedAnswer === '') {
                  hasEmptyAnswer = true;
                }
                const matchedIdx = normalizedAllowed.findIndex(opt => opt === normalizedAnswer);
                if (matchedIdx !== -1) {
                  answer = allowedOptions[matchedIdx];
                } else if (!hasEmptyAnswer) {
                  hasEmptyAnswer = true;
                }
              }
            } else {
              if (!answer || String(answer).trim() === '') {
                hasEmptyAnswer = true;
              }
            }
            return {
              question_number: question.question_number,
              answer
            };
          });
          if (!hasEmptyAnswer) {
            success = true;
            break;
          }
          retryCount++;
        }
        // If still not successful after retries, fallback: use first allowed option for any invalid answer
        if (!success) {
          cleanedAnswers = questionsToAsk.map((question) => {
            const needsOptions = [
              'single_select_radio',
              'single_select_dropdown',
              'multi_select_checkbox',
              'multiple_select',
              'rating_scale'
            ];
            if (needsOptions.includes(question.question_type)) {
              if (Array.isArray(question.options) && question.options.length > 0) {
                if (question.question_type === 'multi_select_checkbox' || question.question_type === 'multiple_select') {
                  return {
                    question_number: question.question_number,
                    answer: question.options[0]
                  };
                } else {
                  return {
                    question_number: question.question_number,
                    answer: question.options[0]
                  };
                }
              } else {
                return { question_number: question.question_number, answer: '' };
              }
            } else {
              return { question_number: question.question_number, answer: 'N/A' };
            }
          });
        }
        personaData = {
          archetype: newResult?.archetype || `Fallback Persona #${respondentNumber}`,
          demographicprofile: newResult?.demographicProfile || {}
        };
        const { data: inserted, error: insertError } = await supabase
          .from('simulation_results')
          .insert({
            survey_id: surveyId,
            respondent_number: respondentNumber,
            archetype: personaData.archetype,
            answers: cleanedAnswers,
            demographicprofile: personaData.demographicprofile,
            run_number: 1,
            persona_data: personaData
          })
          .select()
          .single();
        if (insertError) {
          toast.error(`Failed to save simulation result: ${insertError.message}`);
          setIsSimulating(false);
          return;
        }
        if (!inserted.persona_id) {
          await supabase
            .from('simulation_results')
            .update({ persona_id: inserted.id })
            .eq('id', inserted.id);
        }
        newSimulations.push({ ...inserted, persona_id: inserted.id });
        setSimulationResults(prevResults => [...prevResults, { ...inserted, persona_id: inserted.id }]);
        setSimulationProgress(prev => prev + 1);
        usedArchetypes.add(personaData.archetype);
        usedProfiles.add(JSON.stringify(personaData.demographicprofile));
        generated++;
      }
    }
    if (generated < totalNeeded) {
      toast.error(`Only ${generated} unique personas could be generated. Try reducing the number or broadening the target.`);
    }
    toast.success("Simulation complete! All new results saved.");
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.error("Audio playback failed:", err));
    }
    setIsSimulating(false);
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
      {/* Shared SimulatorTabs navigation */}
      <SimulatorTabs id={surveyId} surveyType={surveyMode} />

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
                  personaTemplates={personaTemplates}
                  surveyId={surveyId}
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


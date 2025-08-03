"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import MatrixTabs from '../../MatrixTabs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MatrixModulesPage({ params }) {
  const [questions, setQuestions] = useState([]);
  const [modules, setModules] = useState([]); // Array of { moduleId, questions }
  const [questionsPerModule, setQuestionsPerModule] = useState(2);
  const [loading, setLoading] = useState(false);

  // Fetch questions and modules on mount
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      // Fetch questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('id, question_text, module_id')
        .eq('survey_id', params.id)
        .order('question_order', { ascending: true });
      setQuestions(questionsData || []);

      // Fetch modules
      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, module_number')
        .eq('survey_id', params.id)
        .order('module_number', { ascending: true });
      const displayModules = [];
      for (const mod of modulesData || []) {
        const { data: modQuestions } = await supabase
          .from('questions')
          .select('id, question_text')
          .eq('module_id', mod.id)
          .order('question_order', { ascending: true });
        displayModules.push({ moduleId: mod.id, moduleNumber: mod.module_number, questions: modQuestions || [] });
      }
      setModules(displayModules);
      setLoading(false);
    }
    fetchInitialData();
  }, [params.id]);

  // Only group and create modules after button click
  const handleCreateModules = async () => {
    setLoading(true);
    setModules([]); // Clear previous modules
    // Optionally delete previous modules for this survey
    await supabase
      .from('modules')
      .delete()
      .eq('survey_id', params.id);
    // Group questions
    const grouped = [];
    for (let i = 0; i < questions.length; i += questionsPerModule) {
      grouped.push(questions.slice(i, i + questionsPerModule));
    }
    // Create modules and assign questions
    for (let i = 0; i < grouped.length; i++) {
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .insert({ survey_id: params.id, module_number: i + 1 })
        .select();
      if (moduleError || !moduleData?.[0]) continue;
      const moduleId = moduleData[0].id;
      const questionIds = grouped[i].map(q => q.id);
      await supabase
        .from('questions')
        .update({ module_id: moduleId })
        .in('id', questionIds);
    }
    // Refetch modules and their questions for display
    const { data: modulesData } = await supabase
      .from('modules')
      .select('id, module_number')
      .eq('survey_id', params.id)
      .order('module_number', { ascending: true });
    const displayModules = [];
    for (const mod of modulesData || []) {
      const { data: modQuestions } = await supabase
        .from('questions')
        .select('id, question_text')
        .eq('module_id', mod.id)
        .order('question_order', { ascending: true });
      displayModules.push({ moduleId: mod.id, moduleNumber: mod.module_number, questions: modQuestions || [] });
    }
    setModules(displayModules);
    // Refetch questions to update their module_id
    const { data: updatedQuestions } = await supabase
      .from('questions')
      .select('id, question_text, module_id')
      .eq('survey_id', params.id)
      .order('question_order', { ascending: true });
    setQuestions(updatedQuestions || []);
    setLoading(false);
  };

  return (
    <div className="p-8">
      <MatrixTabs id={params.id} />
      <h2 className="text-2xl font-bold mb-6">Modules</h2>
      <div className="mb-4">
        <label className="font-semibold mr-2">Questions per module:</label>
        <input
          type="number"
          min={1}
          value={questionsPerModule}
          onChange={e => setQuestionsPerModule(Number(e.target.value))}
          className="border rounded px-2 py-1 w-16"
        />
        <button
          className="ml-4 bg-blue-600 text-white px-4 py-2 rounded font-bold"
          onClick={handleCreateModules}
          disabled={loading}
        >
          Create Modules
        </button>
      </div>
      {modules.length > 0 && modules.map((mod) => (
        <div key={mod.moduleId} className="mb-6 border rounded shadow p-4">
          <h3 className="text-lg font-bold mb-2">
            Module {mod.moduleNumber}
            <span className="ml-2 text-xs text-gray-400">{mod.moduleId}</span>
          </h3>
          <ul className="ml-4 list-disc">
            {mod.questions.map(q => (
              <li key={q.id}>{q.question_text}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

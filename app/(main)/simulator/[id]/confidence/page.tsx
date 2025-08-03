'use client';

import { useState, useEffect, useRef } from 'react';
import SimulatorTabs from '../../SimulatorTabs';
import { Button } from '@/components/ui/button';

interface ConfidenceMetrics {
  answer_stability: number;
  total_responses: number;
  flagged_count: number;
  model_certainty?: number; // <-- add this
}

interface QuestionStability {
  question: string;
  answer_stability: number;
}

export default function ConfidenceTab({ params }: { params: { id: string } }) {
  const { id } = params;
  const [metrics, setMetrics] = useState<ConfidenceMetrics | null>(null);
  const [questionStability, setQuestionStability] = useState<QuestionStability[]>([]);
  const [surveyQuestions, setSurveyQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(false);
  const [rerunCount, setRerunCount] = useState(2);
  const [rerunProgress, setRerunProgress] = useState<{completed: number, total: number}>({ completed: 0, total: 0 }); // progress meter
  const [surveyMode, setSurveyMode] = useState<string>('synthetic');
  const [rerunHistory, setRerunHistory] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchConfidenceMetrics = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        // Fetch survey mode for SimulatorTabs and survey questions
        const surveyRes = await fetch(`/api/simulator/${id}`);
        const surveyJson = await surveyRes.json();
        setSurveyMode(surveyJson?.data?.survey_mode || 'synthetic');
        // Try to get questions from surveys table (questions field is text, likely JSON)
        let questionsArr: any[] = [];
        if (typeof surveyJson?.data?.questions === 'string') {
          try {
            const parsed = JSON.parse(surveyJson.data.questions);
            if (Array.isArray(parsed)) {
              questionsArr = parsed;
            }
          } catch (e) {
            // fallback: not valid JSON
          }
        } else if (Array.isArray(surveyJson?.data?.questions)) {
          questionsArr = surveyJson.data.questions;
        }
        setSurveyQuestions(questionsArr);

        // Fetch confidence metrics
        const response = await fetch(`/api/simulator/${id}/confidence`);
        const result = await response.json();
        console.log('DEBUG: /api/simulator/[id]/confidence result', result);

        // Support new API shape: { overall: {stability, ...}, perQuestion: [...] }
        const overall = result?.overall;
        const perQuestion = result?.perQuestion;
        console.log('DEBUG: overall', overall);
        console.log('DEBUG: perQuestion', perQuestion);

        // Set metrics if stability is a number (even if total_responses is 0 or missing)
        if (overall && typeof overall.stability === 'number') {
          setMetrics({
            answer_stability: overall.stability,
            total_responses: typeof overall.total_responses === 'number' ? overall.total_responses : 0,
            flagged_count: typeof overall.flagged_count === 'number' ? overall.flagged_count : 0,
            model_certainty: typeof overall.model_certainty === 'number' ? overall.model_certainty : undefined
          });
        } else {
          setMetrics({
            answer_stability: null,
            total_responses: 0,
            flagged_count: 0,
            model_certainty: undefined
          });
        }

        // Set per-question stability if available
        if (Array.isArray(perQuestion) && perQuestion.length > 0) {
          console.log('DEBUG: questionsArr', questionsArr);
          console.log('DEBUG: perQuestion', perQuestion);
          setQuestionStability(perQuestion.map((q: any) => {
            let questionText = q.question_number;
            if (Array.isArray(questionsArr)) {
              // Accept both string and number for question_number
              const found = questionsArr.find((qq: any) => Number(qq.question_number) === Number(q.question_number));
              if (found && typeof found === 'object' && found !== null) {
                questionText = found.question_text || found.text || found.question || questionText;
              }
            }
            return {
              question: questionText,
              answer_stability: q.stability
            };
          }));
        } else {
          setQuestionStability([]);
        }
      } catch (error) {
        console.error('Error fetching confidence metrics:', error);
        setMetrics({
          answer_stability: null,
          total_responses: 0,
          flagged_count: 0
        });
        setQuestionStability([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConfidenceMetrics();
    // Fetch rerun history
    const fetchRerunHistory = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/simulator/${id}/rerun-history`);
        const json = await res.json();
        if (json.data) setRerunHistory(json.data);
      } catch (e) {
        setRerunHistory([]);
      }
    };
    fetchRerunHistory();
  }, [id]);

  // Polling-based rerun simulation with real backend progress
  const handleRerunSimulation = async () => {
    if (!id || rerunCount < 1) return;
    setRerunning(true);
    setRerunProgress({ completed: 0, total: 0 });
    try {
      // Prepare audio for rerun completion
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      audioRef.current = new Audio(`/simulator/${id}/simulation/simulation-done.mp3`);
      // Start rerun in background, get run_id and persona_count
      const response = await fetch(`/api/simulator/${id}/rerun-simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rerunCount,
          purpose: 'confidence_testing'
        })
      });
      const result = await response.json();
      if (!response.ok || !result.run_id) {
        alert(`Error: ${result.error || 'Failed to start rerun'}`);
        setRerunning(false);
        return;
      }
      const { run_id, persona_count } = result;
      // Poll for progress
      let completed = 0;
      let pollTries = 0;
      const poll = async () => {
        try {
          const progRes = await fetch(`/api/simulator/${id}/rerun-simulation?run_id=${run_id}`);
          const progJson = await progRes.json();
          if (progJson && typeof progJson.personas_completed === 'number') {
            completed = progJson.personas_completed;
            setRerunProgress({ completed, total: persona_count });
            if (completed < persona_count) {
              pollTries++;
              setTimeout(poll, 1500); // poll every 1.5s
            } else {
              // Done!
              if (audioRef.current) {
                audioRef.current.play().catch(err => console.error('Audio playback failed:', err));
              }
              setTimeout(() => {
                window.location.reload();
              }, 1200);
            }
          } else {
            // fallback: keep polling, but stop after 2min
            pollTries++;
            if (pollTries < 80) setTimeout(poll, 1500);
          }
        } catch (e) {
          pollTries++;
          if (pollTries < 80) setTimeout(poll, 1500);
        }
      };
      poll();
    } catch (error) {
      console.error('Error rerunning simulation:', error);
      alert('Failed to rerun simulation');
      setRerunning(false);
      setRerunProgress({ completed: 0, total: 0 });
    }
  };

  // --- DUMMY DATA UI ---
  return (
    <div>
      {/* Hidden audio element for rerun completion sound */}
      <audio ref={audioRef} style={{ display: 'none' }} preload="auto">
        <source src={`/simulator/${id}/simulation/simulation-done.mp3`} type="audio/mpeg" />
      </audio>
      {/* ...existing code... */}
    <div className="p-8 bg-gray-50 min-h-screen">
      <SimulatorTabs id={id} surveyType={surveyMode} />
      {/* Single column, full width boxes */}
      <div className="flex flex-col gap-8 max-w-3xl items-start">
        {/* Test Answer Stability Controls + Rerun History */}
        <div className="bg-white rounded-xl border shadow-sm p-6 w-full">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Test Answer Stability</h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Reruns per persona</label>
              <input
                type="number"
                min="1"
                max="5"
                value={rerunCount}
                onChange={(e) => setRerunCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-1 border rounded text-sm"
                disabled={rerunning}
              />
            </div>
            <Button
              onClick={handleRerunSimulation}
              disabled={rerunning || !id}
              className="mt-4 sm:mt-0"
            >
              {rerunning ? 'Running...' : 'Re-run'}
            </Button>
          </div>
          {rerunning && rerunProgress && rerunProgress.total > 0 && (
            <div className="w-full mt-4">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((rerunProgress.completed / (rerunProgress.total || 1)) * 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1 text-center">
                Processing reruns: {rerunProgress.completed} of {rerunProgress.total} persona{rerunProgress.completed === 1 ? '' : 's'} complete
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Runs simulation {rerunCount}x with same personas to test consistency
          </p>
          {/* Rerun History Table */}
          {rerunHistory.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Rerun History</h4>
              <table className="w-full text-xs border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left font-medium p-2">Date</th>
                    <th className="text-left font-medium p-2"># Runs</th>
                    <th className="text-left font-medium p-2">Run #</th>
                    <th className="text-left font-medium p-2">Personas</th>
                    <th className="text-left font-medium p-2">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {rerunHistory.map((run, idx) => (
                    <tr key={run.id || idx} className="border-t">
                      <td className="p-2">{run.created_at ? new Date(run.created_at).toLocaleString() : ''}</td>
                      <td className="p-2">{run.run_number ?? ''}</td>
                      <td className="p-2">{run.run_number}</td>
                      <td className="p-2">{run.persona_count}</td>
                      <td className="p-2">{run.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Survey-Level Confidence Summary */}
        <div className="bg-white rounded-xl border shadow-sm p-6 w-full">
          <h3 className="text-lg font-semibold mb-2">Survey-Level Confidence Summary</h3>
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="text-5xl font-bold text-gray-900">
              {metrics && (metrics.answer_stability === null || metrics.total_responses < 1)
                ? 'N/A'
                : metrics
                ? `${Math.round(metrics.answer_stability * 100)}%`
                : '--'}
            </div>
            <div className="text-lg font-semibold text-green-600 mt-2">
              {metrics && (metrics.answer_stability === null || metrics.total_responses < 1)
                ? 'No reruns yet'
                : metrics && metrics.answer_stability >= 0.9
                ? 'High Confidence'
                : metrics && metrics.answer_stability >= 0.7
                ? 'Medium Confidence'
                : 'Low Confidence'}
            </div>
          </div>
          <div className="mt-2 text-gray-600 text-sm">
            Based on answer stability across reruns. Other metrics coming soon.
          </div>
          <ul className="mt-4 space-y-1 text-sm">
            <li className="flex items-center gap-2 opacity-50"><span className="text-green-500">●</span> Persona Alignment <span className="ml-auto font-semibold">--</span></li>
            <li className="flex items-center gap-2"><span className="text-blue-500">●</span> Model Certainty <span className="ml-auto font-semibold">{metrics && typeof metrics.model_certainty === 'number' ? (metrics.model_certainty * 100).toFixed(1) + '%' : '--'}</span></li>
            <li className="flex items-center gap-2 opacity-50"><span className="text-yellow-500">●</span> Benchmark Similarity <span className="ml-auto font-semibold">--</span></li>
            <li className="flex items-center gap-2"><span className="text-purple-500">●</span> Answer Stability <span className="ml-auto font-semibold">{metrics && typeof metrics.answer_stability === 'number' && metrics.total_responses > 0 ? (metrics.answer_stability * 100).toFixed(1) + '%' : 'N/A'}</span></li>
            <li className="flex items-center gap-2 opacity-50"><span className="text-pink-500">●</span> Justification Quality <span className="ml-auto font-semibold">--</span></li>
          </ul>
          <div className="mt-4 text-sm text-gray-600">
            <div>{metrics ? metrics.total_responses : '--'} responses simulated</div>
            <div>{metrics ? metrics.flagged_count : '--'} flagged for review</div>
          </div>
        </div>
        {/* Per-Question Confidence Breakdown */}
        <div className="bg-white rounded-xl border shadow-sm p-6 w-full">
          <h3 className="text-lg font-semibold mb-4">Per-Question Confidence Breakdown</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left font-medium pb-2">Question</th>
                <th className="text-left font-medium pb-2">Answer Stability</th>
                <th className="text-left font-medium pb-2 opacity-50">Alignment</th>
                <th className="text-left font-medium pb-2 opacity-50">Benchmark</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(questionStability) && questionStability.length > 0 ? (
                questionStability.map((qs, idx) => {
                  // Always match question_number as a number
                  let questionText = qs.question;
                  let isUserInput = false;
                  if (Array.isArray(surveyQuestions)) {
                    const found = surveyQuestions.find((qq: any) => {
                      if (qq && typeof qq === 'object' && 'question_number' in qq) {
                        return Number(qq.question_number) === Number(qs.question);
                      }
                      return false;
                    });
                    if (found && typeof found === 'object' && found !== null) {
                      questionText = (found as any).question_text || (found as any).text || (found as any).question || questionText;
                      isUserInput = ((found as any).question_type === 'user_input');
                    }
                  }
                  return (
                    <tr className="border-t" key={questionText + idx}>
                      <td>{questionText}</td>
                      <td>
                        <span className="text-green-600 font-semibold">
                          {isUserInput ? 'N/A User Input' : (typeof qs.answer_stability === 'number' ? qs.answer_stability.toFixed(2) : '--')}
                        </span>
                      </td>
                      <td className="opacity-50">--</td>
                      <td className="opacity-50">--</td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={4} className="text-gray-400">No per-question data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Methodology */}
        <div className="bg-white rounded-xl border shadow-sm p-6 w-full">
          <h3 className="text-lg font-semibold mb-4">Methodology</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div><span className="font-semibold">Persona Alignment</span><br />The extent to which responses reflect the simulated persona/saric characteristics</div>
            <div><span className="font-semibold">Benchmark Similarity</span><br />The degree of agreement with external benchmarks or histomatta</div>
            <div><span className="font-semibold">Model Certainty</span><br />The confidence level reported by the simulation model</div>
            <div><span className="font-semibold">Answer Stability</span><br />The consistency of responses across runs</div>
            <div><span className="font-semibold">Justification Quality</span><br />The logical coherence of the response explanations</div>
          </div>
        </div>
        {/* Flags and Review */}
        <div className="bg-white rounded-xl border shadow-sm p-6 w-full">
          <h3 className="text-lg font-semibold mb-4">Flags and Review</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left font-medium pb-2">Type</th>
                <th className="text-left font-medium pb-2">Description</th>
                <th className="text-left font-medium pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td>Answer Variation</td>
                <td>Same persona gave different answers</td>
                <td><button className="text-blue-600 hover:underline">View</button></td>
              </tr>
              <tr className="border-t">
                <td>Low Benchmark March</td>
                <td>Answers deviated &gt;1% from national</td>
                <td><button className="text-blue-600 hover:underline">Compare</button></td>
              </tr>
              <tr className="border-t">
                <td>Logic Gap in Justifica</td>
                <td>Weak, or circular reasoning</td>
                <td><button className="text-blue-600 hover:underline">Review</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
}
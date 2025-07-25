'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { saveAs } from 'file-saver';
import WordCloud from '@/components/WordCloud';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const chartableTypes = [
  'single_select_radio',
  'multiple_select',
  'rating_scale',
  'single_select_dropdown'
];

export default function ReportingPage({ params }) {
  const pathname = usePathname();
  const { id: surveyId } = params;
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [charts, setCharts] = useState([]);
  const [wordCloudData, setWordCloudData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch questions and results
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      console.log('Starting data fetch for surveyId:', surveyId);
      
      // Fetch questions with correct column names
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select(`
          id,
          survey_id,
          question_number,
          question_text,
          question_type
        `)
        .eq('survey_id', surveyId)
        .order('question_number');
      
      console.log('Questions data:', {
        count: questionsData?.length,
        types: questionsData?.map(q => q.question_type),
        chartableCount: questionsData?.filter(q => chartableTypes.includes(q.question_type)).length,
        firstQuestion: questionsData?.[0]
      });
      
      if (questionsError) {
        console.error('Questions error:', questionsError);
        toast.error(questionsError.message);
        return;
      }

      // Fetch results
      const { data: resultsData, error: resultsError } = await supabase
        .from('simulation_results')
        .select('*')
        .eq('survey_id', surveyId);
      
      console.log('Results data:', {
        count: resultsData?.length,
        firstResult: resultsData?.[0],
        hasAnswers: resultsData?.every(r => r.answers && Array.isArray(r.answers))
      });
      
      if (resultsError) {
        console.error('Results error:', resultsError);
        toast.error(resultsError.message);
        return;
      }

      // Only proceed if we have both questions and results
      if (!questionsData?.length || !resultsData?.length) {
        console.warn('Missing data:', { 
          hasQuestions: Boolean(questionsData?.length), 
          hasResults: Boolean(resultsData?.length) 
        });
        setLoading(false);
        return;
      }

      setQuestions(questionsData);
      setResults(resultsData);
      setLoading(false);
    }
    
    fetchData();
  }, [surveyId]);

  // Update the chart building logic to use question_type instead of type
  useEffect(() => {
    if (!questions?.length || !results?.length) {
      console.log('No questions or results to process', { 
        questionsLength: questions?.length, 
        resultsLength: results?.length 
      });
      setCharts([]);
      return;
    }

    const chartArr = [];
    questions.forEach(q => {
      if (!q.question_number || !chartableTypes.includes(q.question_type)) return;
      
      const counts = {};
      results.forEach(r => {
        if (!r.answers || !Array.isArray(r.answers)) {
          console.log('Invalid answers format:', r);
          return;
        }
        
        const answerObj = r.answers.find(a => 
          String(a?.question_number) === String(q.question_number)
        );
        
        if (!answerObj?.answer) return;
        
        // Handle different answer types
        if (Array.isArray(answerObj.answer)) {
          answerObj.answer.forEach(ans => {
            if (ans) counts[ans] = (counts[ans] || 0) + 1;
          });
        } else if (typeof answerObj.answer === 'string') {
          if (q.type === 'multiple_select' && answerObj.answer.includes(',')) {
            answerObj.answer.split(',')
              .map(s => s.trim())
              .filter(Boolean)
              .forEach(ans => {
                counts[ans] = (counts[ans] || 0) + 1;
              });
          } else {
            counts[answerObj.answer] = (counts[answerObj.answer] || 0) + 1;
          }
        } else {
          const answerStr = String(answerObj.answer);
          counts[answerStr] = (counts[answerStr] || 0) + 1;
        }
      });

      if (Object.keys(counts).length > 0) {
        chartArr.push({
          question: q.question_text,
          data: Object.entries(counts).map(([name, value]) => ({ 
            name, 
            count: value 
          }))
        });
      }
    });

    console.log('Generated chart data:', chartArr);
    setCharts(chartArr);

    // Process open-ended responses for word cloud
    const wordCounts = {};
    const openEndedQuestions = questions.filter(q => q.question_type === 'user_input');
    
    openEndedQuestions.forEach(q => {
      results.forEach(r => {
        if (!r.answers || !Array.isArray(r.answers)) return;
        
        const answerObj = r.answers.find(a => 
          String(a?.question_number) === String(q.question_number)
        );
        
        if (!answerObj?.answer || typeof answerObj.answer !== 'string') return;
        
        // Process the text: split by spaces, clean, and count
        const words = answerObj.answer
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ') // Remove punctuation
          .split(/\s+/)
          .filter(word => 
            word.length > 3 && // Only words longer than 3 characters
            !['this', 'that', 'with', 'from', 'they', 'them', 'were', 'been', 
              'have', 'will', 'would', 'could', 'should', 'there', 'where', 
              'when', 'what', 'which', 'while', 'very', 'more', 'most', 
              'some', 'many', 'much', 'like', 'just', 'also', 'only'].includes(word)
          );
        
        words.forEach(word => {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
      });
    });

    // Convert to array format for word cloud
    const wordCloudArray = Object.entries(wordCounts)
      .map(([text, count]) => ({ text, count: count as number }))
      .filter(item => item.count > 1) // Only show words that appear more than once
      .sort((a, b) => b.count - a.count);

    setWordCloudData(wordCloudArray);
  }, [questions, results]);

  const handleDownloadCSV = () => {
    if (!results?.length || !questions?.length) {
      toast.error('No data available to download');
      return;
    }

    try {
      // Create CSV header row
      const headers = ['Respondent #', 'Profile'];
      questions.forEach(q => headers.push(q.question_text));

      // Create CSV rows
      const csvRows = results.map((result, index) => {
        // Start with respondent number and profile
        const row = [
          (index + 1).toString(),
          JSON.stringify(result.demographicProfile || {})
        ];

        // Add answers for each question in order
        questions.forEach(question => {
          const answer = result.answers?.find(a => 
            parseInt(String(a.question_number)) === parseInt(String(question.question_number))
          )?.answer;

          let formattedAnswer = '';
          if (Array.isArray(answer)) {
            formattedAnswer = answer.join(', ');
          } else if (answer !== undefined && answer !== null) {
            formattedAnswer = answer.toString();
          }

          row.push(formattedAnswer);
        });

        return row;
      });

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.map(cell => 
          typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
        ).join(','))
      ].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(blob, `survey_results_${surveyId}_${timestamp}.csv`);
      
      toast.success('CSV file downloaded successfully');
    } catch (error) {
      console.error('CSV Generation Error:', error);
      toast.error('Failed to generate CSV file');
    }
  };

  // Helper function to check if a tab is active
  const isActiveTab = (path) => pathname.includes(path);

  if (loading) return <div className="p-8">Loading report...</div>;

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="mb-8">
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

        {/* Download Button */}
        <div className="flex justify-end mb-6">
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download CSV
          </button>
        </div>

        {/* Chart section */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-800">📊 Response Distribution</h2>
          {loading ? (
            <div className="text-center py-8">Loading report...</div>
          ) : charts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {charts.map(chart => (
                <div key={chart.question} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-6 leading-relaxed">{chart.question}</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: '#374151' }}
                        interval={'preserveStartEnd'}
                        angle={-35}
                        textAnchor="end"
                        height={100}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => {
                          // Truncate long labels to fit better
                          return value.length > 15 ? value.substring(0, 15) + '...' : value;
                        }}
                      />
                      <YAxis 
                        allowDecimals={false}
                        tick={{ fontSize: 13, fill: '#374151' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '14px'
                        }}
                        formatter={(value, name) => [value, 'Count']}
                        labelFormatter={(label) => `Response: ${label}`}
                      />
                      <Bar 
                        dataKey="count" 
                        radius={[4, 4, 0, 0]}
                      >
                        {chart.data.map((entry, index) => {
                          const colors = [
                            '#8B5CF6', // Purple
                            '#10B981', // Green  
                            '#F59E0B', // Orange/Yellow
                            '#EF4444', // Red
                            '#3B82F6', // Blue
                            '#06B6D4', // Cyan
                            '#84CC16', // Lime
                            '#F97316', // Orange
                            '#EC4899', // Pink
                            '#6366F1'  // Indigo
                          ];
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={colors[index % colors.length]} 
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No chartable data available.</p>
          )}

          {/* Word Cloud Section */}
          {wordCloudData.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">☁️ Keyword Cloud</h2>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <WordCloud words={wordCloudData} width={800} height={400} />
              </div>
            </div>
          )}

          {/* Open-Ended Responses Table */}
          {(() => {
            const openEndedQuestions = questions.filter(q => q.question_type === 'user_input');
            if (openEndedQuestions.length === 0) return null;

            return (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">💬 Open-Ended Responses</h2>
                <div className="space-y-6">
                  {openEndedQuestions.map(question => {
                    const responses = results
                      .map(r => {
                        const answer = r.answers?.find(a => 
                          String(a?.question_number) === String(question.question_number)
                        );
                        return answer?.answer;
                      })
                      .filter(Boolean);

                    return (
                      <div key={question.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">{question.question_text}</h3>
                        <div className="space-y-3">
                          {responses.slice(0, 10).map((response, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-600 font-medium">Respondent #{index + 1}:</span>
                              <p className="text-gray-800 mt-1">{response}</p>
                            </div>
                          ))}
                          {responses.length > 10 && (
                            <div className="text-center pt-2">
                              <span className="text-gray-500 text-sm">
                                ... and {responses.length - 10} more responses
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
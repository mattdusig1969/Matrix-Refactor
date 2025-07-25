"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import SimulatorTabs from '../../SimulatorTabs';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, MoreVertical } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// The component now receives the initial data as props
export default function SurveyClient({ initialSurvey, initialQuestions, params }) {
  // Initialize state from the props passed by the Server Component
  const [formData, setFormData] = useState(initialSurvey || {});
  const [questionsText, setQuestionsText] = useState(() => {
    if (initialSurvey?.questions) {
      try {
        const parsed = JSON.parse(initialSurvey.questions);
        return parsed.raw || '';
      } catch {
        return initialSurvey.questions;
      }
    }
    return '';
  });
  
  const [parsedQuestions, setParsedQuestions] = useState(() => 
    Array.isArray(initialQuestions)
      ? initialQuestions.map(q => ({
          id: q.id, // Ensure id is stored
          question: q.question_text,
          type: q.question_type,
          answers: Array.isArray(q.answer_option)
            ? q.answer_option
            : typeof q.answer_option === 'string'
              ? JSON.parse(q.answer_option)
              : [],
          question_options: q.question_options || {}, // Initialize options
        }))
      : []
  );

  const [mode, setMode] = useState('build'); // 'build' or 'url'
  const [surveyUrl, setSurveyUrl] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState({ 
    id: null,
    question: '', 
    type: '', 
    answers: [],
    question_options: {}
  });
  const [optionsMenuIdx, setOptionsMenuIdx] = useState(null); // State for options menu

  // State for Survey Preview Overlay
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState({});

  const handleOpenPreview = () => {
    setCurrentQuestionIndex(0);
    setPreviewAnswers({});
    setIsPreviewing(true);
  };

  const handleClosePreview = () => {
    setIsPreviewing(false);
  };

  const handleAnswerChange = (questionIndex, answer) => {
    const currentQuestion = parsedQuestions[questionIndex];
    setPreviewAnswers(prev => {
      const newAnswers = { ...prev };
      if (currentQuestion.type === 'multiple_select') {
        const existingAnswers = newAnswers[questionIndex] || [];
        if (existingAnswers.includes(answer)) {
          newAnswers[questionIndex] = existingAnswers.filter(a => a !== answer);
        } else {
          newAnswers[questionIndex] = [...existingAnswers, answer];
        }
      } else {
        newAnswers[questionIndex] = answer;
      }
      return newAnswers;
    });
  };

  const handleQuestionOptionChange = async (questionIndex, optionKey, optionValue) => {
    const questionToUpdate = parsedQuestions[questionIndex];
    if (!questionToUpdate) return;

    // Create a deep copy to avoid mutation issues
    const newQuestions = JSON.parse(JSON.stringify(parsedQuestions));
    const currentOptions = newQuestions[questionIndex].question_options || {};
    currentOptions[optionKey] = optionValue;
    newQuestions[questionIndex].question_options = currentOptions;

    // Update state immediately for responsive UI
    setParsedQuestions(newQuestions);
    setOptionsMenuIdx(null); // Close menu after change

    // Update the database
    const { error } = await supabase
      .from('questions')
      .update({ question_options: currentOptions })
      .eq('id', questionToUpdate.id);

    if (error) {
      toast.error('Failed to save option.');
      // Revert state on error
      setParsedQuestions(parsedQuestions);
    } else {
      toast.success('Option saved!');
    }
  };

  const renderPreviewQuestion = () => {
    if (!parsedQuestions || parsedQuestions.length === 0) {
      return <p>No questions to preview.</p>;
    }

    const question = parsedQuestions[currentQuestionIndex];
    const answer = previewAnswers[currentQuestionIndex];

    const renderAnswers = () => {
      switch (question.type) {
        case 'single_select_radio':
          return (question.answers || []).map((opt) => (
            <label key={opt} className="block mb-2">
              <input
                type="radio"
                name={`question_${currentQuestionIndex}`}
                value={opt}
                checked={answer === opt}
                onChange={() => handleAnswerChange(currentQuestionIndex, opt)}
                className="mr-2"
              />
              {opt}
            </label>
          ));
        case 'multiple_select':
          return (question.answers || []).map((opt) => (
            <label key={opt} className="block mb-2">
              <input
                type="checkbox"
                name={`question_${currentQuestionIndex}`}
                value={opt}
                checked={(answer || []).includes(opt)}
                onChange={() => handleAnswerChange(currentQuestionIndex, opt)}
                className="mr-2"
              />
              {opt}
            </label>
          ));
        case 'rating_scale': {
           // Default scale
           let scaleOptions = ['1', '2', '3', '4', '5']; 
           
           // Try to find a pattern like "scale of 1-8" in the question text
           const match = question.question.match(/scale of 1-([0-9]+)/i);

           if (match && match[1]) {
             const maxScale = parseInt(match[1], 10);
             // If a valid number is found, generate the options array dynamically
             if (!isNaN(maxScale) && maxScale > 0) {
               scaleOptions = Array.from({ length: maxScale }, (_, i) => String(i + 1));
             }
           }

           return scaleOptions.map(opt => (
            <label key={opt} className="inline-block mr-4">
              <input
                type="radio"
                name={`question_${currentQuestionIndex}`}
                value={opt}
                checked={answer === opt}
                onChange={() => handleAnswerChange(currentQuestionIndex, opt)}
                className="mr-1"
              />
              {opt}
            </label>
          ));
        }
        case 'single_select_dropdown':
          return (
            <select
              value={answer || ''}
              onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="" disabled>Select an option</option>
              {(question.answers || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          );
        case 'user_input':
          return (
            <textarea
              value={answer || ''}
              onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
              className="w-full border rounded p-2"
              rows={4}
            />
          );
        default:
          return <p>Unsupported question type.</p>;
      }
    };

    return (
      <div>
        <h3 className="text-xl font-bold mb-4">{question.question}</h3>
        <div>{renderAnswers()}</div>
      </div>
    );
  };


  // The initial loading state is no longer needed as data is present from the start
  // const [loading, setLoading] = useState(true);

  // REMOVED the initial data-fetching useEffect hooks. They are no longer needed.

  const handleUpdateQuestion = (index) => {
    // Create a new array to avoid direct mutation
    const newParsedQuestions = [...parsedQuestions];
    // Replace the question at the given index with the value from the edit state
    // Preserve id and question_options from the original question
    newParsedQuestions[index] = {
      ...editValue,
      id: parsedQuestions[index].id,
      question_options: parsedQuestions[index].question_options
    };

    // Update the state for the parsed questions list
    setParsedQuestions(newParsedQuestions);

    // Reconstruct the main questionsText string from the updated array
    const newQuestionsText = newParsedQuestions.map(q => {
        const answers = (q.answers || []).map(a => `A: ${a}`).join('\n');
        return `Q: ${q.question}\nType: ${q.type}\n${answers}`;
    }).join('\n\n');

    // Update the state for the main textarea
    setQuestionsText(newQuestionsText);

    // Exit editing mode
    setEditingIdx(null);
  };

  const handleMoveQuestion = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= parsedQuestions.length) {
      return; // Cannot move outside of array bounds
    }

    const newQuestions = [...parsedQuestions];
    // Swap elements
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];

    // Update local state immediately for responsive UI
    setParsedQuestions(newQuestions);

    // Reconstruct and update the main text area
    const newQuestionsText = newQuestions.map(q => {
        const answers = (q.answers || []).map(a => `A: ${a}`).join('\n');
        return `Q: ${q.question}\nType: ${q.type}\n${answers}`;
    }).join('\n\n');
    setQuestionsText(newQuestionsText);

    // Create an array of update promises for the database
    const updatePromises = newQuestions.map((q, idx) =>
      supabase
        .from('questions')
        .update({ question_order: idx, question_number: idx }) // Also update question_number
        .eq('id', q.id)
    );

    try {
      const results = await Promise.all(updatePromises);
      const hasError = results.some(res => res.error);
      if (hasError) throw new Error('Failed to update question order.');
      toast.success('Question order saved!');
    } catch (error) {
      toast.error(error.message);
      // Optional: Revert state if DB update fails
      setParsedQuestions(parsedQuestions);
    }
  };

  const handleAddAnswer = () => {
    setEditValue(prev => ({
      ...prev,
      answers: [...(prev.answers || []), '']
    }));
  };

  const handleRemoveAnswer = (indexToRemove) => {
    setEditValue(prev => ({
      ...prev,
      answers: prev.answers.filter((_, index) => index !== indexToRemove)
    }));
  };

  // Save handler remains the same
  const handleSaveSurvey = async () => {
    try {
      const { error } = await supabase
        .from('surveys')
        .update({ questions: JSON.stringify({ raw: questionsText }) })
        .eq('id', params.id);

      if (error) throw error;

      const parsed = questionsText.split('\n\n').map((q, i) => {
        const [question, type, ...answers] = q.split('\n').map(line => line.replace(/^Q: |^Type: |^A: /, ''));
        return { question, type, answers, question_order: i };
      });

      await supabase
        .from('questions')
        .delete()
        .eq('survey_id', params.id);

      for (let pq of parsed) {
        await supabase
          .from('questions')
          .insert({
            survey_id: params.id,
            question_text: pq.question,
            question_type: pq.type,
            answer_option: JSON.stringify(pq.answers),
            question_order: pq.question_order,
            question_number: pq.question_order, // Set question_number to be the same as question_order
          });
      }

      // Reload questions from DB
      const { data: questionsData } = await supabase
        .from('questions')
        .select('id, question_text, question_type, answer_option, question_order, question_options')
        .eq('survey_id', params.id)
        .order('question_order', { ascending: true });

      setParsedQuestions(
        Array.isArray(questionsData)
          ? questionsData.map(q => ({
              id: q.id, // Ensure id is stored on reload
              question: q.question_text,
              type: q.question_type,
              answers: Array.isArray(q.answer_option)
                ? q.answer_option
                : typeof q.answer_option === 'string'
                  ? JSON.parse(q.answer_option)
                  : [],
              question_options: q.question_options || {}, // Initialize options on reload
            }))
          : []
      );

      toast.success('Survey and questions saved!');
    } catch (err) {
      toast.error('Error saving survey.');
    }
  };

  return (
    <div className="p-8">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <SimulatorTabs active="survey" id={params.id} surveyType={formData.survey_mode} />
        </div>

        {/* Survey Mode Selection */}
        <div className="my-6 flex items-center justify-between">
          <div className="flex gap-4">
            <button
              className={`px-4 py-2 rounded ${mode === 'build' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setMode('build')}
            >
              Build a Survey
            </button>
            <button
              className={`px-4 py-2 rounded ${mode === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setMode('url')}
            >
              Insert Survey URL
            </button>
          </div>
          <button
            onClick={handleOpenPreview}
            className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
          >
            Preview
          </button>
        </div>

        {/* Build a Survey Form */}
        {mode === 'build' && (
          <div className="mb-8">
            <label className="form-label block mb-2">
              Paste Survey Questions & Answers (use format below):
            </label>
            <div className="text-sm text-gray-500 mb-2">
              <pre className="bg-gray-50 p-2 rounded overflow-x-auto w-full">
Q: Your question text here<br></br>
Type: single_select_radio | multiple_select | rating_scale | single_select_dropdown | user_input<br></br>
A: Answer 1<br></br>
              </pre>
            </div>
            <textarea
              className="w-full border rounded px-3 py-2 mb-4"
              rows={16}
              value={questionsText}
              onChange={e => setQuestionsText(e.target.value)}
              placeholder={`Q: How often do you typically go on vacation per year?
Type: single_select_radio
A: Once a year
A: 2-3 times a year
A: 4 or more times a year
A: Less than once a year

Q: What is your primary motivation for traveling?
Type: single_select_radio
A: Relaxation
A: Adventure
A: Cultural exploration
A: Visiting friends and family

...`}
            />
            <button
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition"
              onClick={handleSaveSurvey}
            >
              Save Survey
            </button>

            {/* Display Parsed Questions */}
            <div className="space-y-4 mt-6">
              <AnimatePresence>
                {Array.isArray(parsedQuestions) && parsedQuestions.map((pq, idx) => (
                  <motion.div
                    key={pq.id} // Use stable ID for animation key
                    layout
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="border rounded p-4 bg-gray-50 flex gap-4 relative"
                  >
                    <div className="flex-grow">
                      {editingIdx === idx ? (
                        <div>
                          <input
                            type="text"
                            value={editValue.question}
                            onChange={(e) => setEditValue({ ...editValue, question: e.target.value })}
                            className="w-full border rounded px-2 py-1 mb-2"
                          />
                          <input
                            type="text"
                            value={editValue.type}
                            onChange={(e) => setEditValue({ ...editValue, type: e.target.value })}
                            className="w-full border rounded px-2 py-1 mb-2"
                          />
                          {(editValue.answers || []).map((ans, ansIdx) => (
                            <div key={ansIdx} className="flex items-center gap-2 mb-1">
                              <input
                                type="text"
                                value={ans}
                                onChange={(e) => {
                                  const newAnswers = [...editValue.answers];
                                  newAnswers[ansIdx] = e.target.value;
                                  setEditValue({ ...editValue, answers: newAnswers });
                                }}
                                className="w-full border rounded px-2 py-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveAnswer(ansIdx)}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={handleAddAnswer}
                              className="bg-blue-500 text-white px-4 py-1 rounded text-sm"
                            >
                              Add Answer
                            </button>
                            <button
                              className="bg-green-500 text-white px-4 py-2 rounded ml-2"
                              onClick={() => handleUpdateQuestion(idx)}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="font-bold mb-1">
                            {pq.question}
                            {pq.question_options?.required && <span className="text-red-500 ml-1">*</span>}
                          </div>
                          <div className="text-sm mb-1">Type: {pq.type}</div>
                          <ul className="list-disc ml-6 mb-2">
                            {(pq.answers ?? []).map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                          </ul>
                          <div className="mt-auto pt-2">
                            <button
                              className="bg-yellow-500 text-white px-4 py-2 rounded"
                              onClick={() => {
                                setEditingIdx(idx);
                                setEditValue({
                                  id: pq.id,
                                  question: pq.question,
                                  type: pq.type,
                                  answers: pq.answers,
                                  question_options: pq.question_options || {},
                                });
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-2">
                      <button
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp size={20} />
                      </button>
                      <button
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        disabled={idx === parsedQuestions.length - 1}
                        className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown size={20} />
                      </button>
                    </div>
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => setOptionsMenuIdx(optionsMenuIdx === idx ? null : idx)}
                        className="p-1 rounded-full hover:bg-gray-200"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {optionsMenuIdx === idx && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-10">
                          <div className="p-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!pq.question_options?.required}
                                onChange={(e) => handleQuestionOptionChange(idx, 'required', e.target.checked)}
                              />
                              <span>Required</span>
                            </label>
                            <div className="mt-2 pt-2 border-t text-gray-400">
                              <button disabled className="w-full text-left">Skip Logic</button>
                              <button disabled className="w-full text-left">Piping</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Insert Survey URL Form */}
        {mode === 'url' && (
          <div className="mb-8">
            <label className="form-label block mb-2">Survey URL:</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 mb-4"
              value={surveyUrl}
              onChange={e => setSurveyUrl(e.target.value)}
              placeholder="Paste your survey URL here..."
            />
          </div>
        )}

        {/* Survey Preview Overlay */}
        {isPreviewing && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg relative">
              <button
                onClick={handleClosePreview}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
              
              {currentQuestionIndex < parsedQuestions.length ? (
                <>
                  {renderPreviewQuestion()}
                  <div className="flex justify-between mt-6">
                    <button
                      onClick={() => setCurrentQuestionIndex(i => i - 1)}
                      disabled={currentQuestionIndex === 0}
                      className="bg-gray-300 text-gray-800 px-4 py-2 rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentQuestionIndex(i => i + 1)}
                      className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      {currentQuestionIndex === parsedQuestions.length - 1 ? 'Finish' : 'Next'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Survey Complete!</h2>
                  <p>You have completed the preview.</p>
                  <button
                    onClick={handleClosePreview}
                    className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
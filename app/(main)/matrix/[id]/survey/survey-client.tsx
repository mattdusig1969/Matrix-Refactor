// MATRIX: SurveyClient copied from simulator
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import MatrixTabs from '../../MatrixTabs';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, MoreVertical } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SurveyClient({ initialSurvey, initialQuestions, params }) {
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
          id: q.id,
          question: q.question_text,
          type: q.question_type,
          answers: Array.isArray(q.answer_option)
            ? q.answer_option
            : typeof q.answer_option === 'string'
              ? JSON.parse(q.answer_option)
              : [],
          question_options: q.question_options || {},
        }))
      : []
  );

  const [mode, setMode] = useState('build');
  const [surveyUrl, setSurveyUrl] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState({ question: '', type: '', answers: [] });
  const [optionsMenuIdx, setOptionsMenuIdx] = useState(null);

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

    const newQuestions = JSON.parse(JSON.stringify(parsedQuestions));
    const currentOptions = newQuestions[questionIndex].question_options || {};
    currentOptions[optionKey] = optionValue;
    newQuestions[questionIndex].question_options = currentOptions;

    setParsedQuestions(newQuestions);
    setOptionsMenuIdx(null);

    const { error } = await supabase
      .from('questions')
      .update({ question_options: currentOptions })
      .eq('id', questionToUpdate.id);

    if (error) {
      toast.error('Failed to save option.');
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
           let scaleOptions = ['1', '2', '3', '4', '5']; 
           const match = question.question.match(/scale of 1-([0-9]+)/i);
           if (match && match[1]) {
             const maxScale = parseInt(match[1], 10);
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

  // ...existing code for editing, moving, saving, previewing, etc. (identical to simulator version)
  // Only difference: use MatrixTabs instead of SimulatorTabs

  return (
    <div className="p-8">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <MatrixTabs id={params.id} />
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
                  placeholder={`Q: How often do you typically go on vacation per year?\nType: single_select_radio\nA: Once a year\nA: 2-3 times a year\nA: 4 or more times a year\nA: Less than once a year\n\nQ: What is your primary motivation for traveling?\nType: single_select_radio\nA: Relaxation\nA: Adventure\nA: Cultural exploration\nA: Visiting friends and family\n...`}
                />
                <button
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition"
                  // TODO: Implement handleSaveSurvey logic if needed
                >
                  Save Survey
                </button>

                {/* Display Parsed Questions */}
                <div className="space-y-4 mt-6">
                  <AnimatePresence>
                    {Array.isArray(parsedQuestions) && parsedQuestions.map((pq, idx) => (
                      <motion.div
                        key={pq.id}
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
                                    // TODO: Implement handleRemoveAnswer
                                    className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                              <div className="mt-2">
                                <button
                                  type="button"
                                  // TODO: Implement handleAddAnswer
                                  className="bg-blue-500 text-white px-4 py-1 rounded text-sm"
                                >
                                  Add Answer
                                </button>
                                <button
                                  className="bg-green-500 text-white px-4 py-2 rounded ml-2"
                                  // TODO: Implement handleUpdateQuestion
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
                            // TODO: Implement handleMoveQuestion
                            disabled={idx === 0}
                            className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp size={20} />
                          </button>
                          <button
                            // TODO: Implement handleMoveQuestion
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
                                    // TODO: Implement handleQuestionOptionChange
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

"use client";
import React, { useState, useEffect } from "react";

export default function PreviewClientSurvey({
  survey_id,
  design_id,
  user_session_id,
  targeting,
  questionsData,
  designCSS,
  sessionData,
  targetingQuestions,
  allPossibleOptions,
  attributeQuestions = [],
  headline,
}) {
  // Navigation state
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [targetingComplete, setTargetingComplete] = useState(targetingQuestions.length === 0);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [surveyStep, setSurveyStep] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [currentSurveyAnswer, setCurrentSurveyAnswer] = useState(null);

  // Handle targeting question answer
  const handleNextTargetingQuestion = async () => {
    if (!currentAnswer) return;

    const { type, key } = targetingQuestions[step];
    const newAnswer = { [key]: currentAnswer };
    setAnswers((prev) => ({ ...prev, ...newAnswer }));

    // Preview mode - just log instead of saving
    console.log('Preview mode: Targeting answer:', newAnswer);

    if (step + 1 >= targetingQuestions.length) {
      setTargetingComplete(true);
    } else {
      setStep(step + 1);
      setCurrentAnswer(null);
    }
  };

  // Handle survey question answer
  const handleNextSurveyQuestion = async () => {
    if (currentSurveyAnswer === null) return;

    const questionId = questionsData[surveyStep]?.id;
    const newAnswer = { [questionId]: currentSurveyAnswer };
    setSurveyAnswers((prev) => ({ ...prev, ...newAnswer }));

    // Preview mode - just log instead of saving
    console.log('Preview mode: Survey answer:', newAnswer);

    setSurveyStep(surveyStep + 1);
    setCurrentSurveyAnswer(null);
  };

  // Render input based on question type
  const renderSurveyInput = (question) => {
    if (!question) return null;
    
    const options = question.answers || [];

    switch (question.question_type) {
      case 'single_select':
      case 'single_select_radio':
        return options.map(option => (
          <div key={option} className="survey-option">
            <label style={{ display: 'flex', alignItems: 'flex-start', textAlign: 'left' }}>
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={currentSurveyAnswer === option}
                onChange={(e) => setCurrentSurveyAnswer(e.target.value)}
                style={{ marginRight: '8px', flexShrink: 0, marginTop: '3px' }}
              />
              <span>{option}</span>
            </label>
          </div>
        ));
      case 'multiple_select':
        return options.map(option => (
          <div key={option} className="survey-option">
            <label style={{ display: 'flex', alignItems: 'flex-start', textAlign: 'left' }}>
              <input
                type="checkbox"
                name={question.id}
                value={option}
                checked={currentSurveyAnswer?.includes(option) || false}
                onChange={(e) => {
                  const currentAnswers = currentSurveyAnswer || [];
                  if (e.target.checked) {
                    setCurrentSurveyAnswer([...currentAnswers, e.target.value]);
                  } else {
                    setCurrentSurveyAnswer(currentAnswers.filter(val => val !== e.target.value));
                  }
                }}
                style={{ marginRight: '8px', flexShrink: 0, marginTop: '3px' }}
              />
              <span>{option}</span>
            </label>
          </div>
        ));
      case 'rating_scale':
        return (
          <div className="survey-option" style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(val => (
              <label key={val}>
                <input
                  type="radio"
                  name={question.id}
                  value={val}
                  checked={currentSurveyAnswer === String(val)}
                  onChange={(e) => setCurrentSurveyAnswer(e.target.value)}
                />
                {val}
              </label>
            ))}
          </div>
        );
      case 'user_input':
      default:
        return (
          <textarea
            placeholder="Enter answer"
            className="survey-input-text"
            value={currentSurveyAnswer || ''}
            onChange={(e) => setCurrentSurveyAnswer(e.target.value)}
          />
        );
    }
  };

  return (
    <div className="frame">
      {/* Inject design CSS without server-side encoding to prevent hydration errors */}
      {designCSS && (
        <style
          id="matrix-design-css"
          dangerouslySetInnerHTML={{ __html: designCSS }}
        />
      )}
      <div className="inner-container">
        <div className="survey-headline">{headline}</div>
        {!targetingComplete ? (
          <>
            <div className="survey-question">
              {(() => {
                const key = targetingQuestions[step]?.key;
                const attrObj = attributeQuestions.find(a => a.field_name === key);
                return attrObj?.questiontext || key;
              })()}
            </div>
            <div id="render-survey">
              {allPossibleOptions[targetingQuestions[step]?.key]?.map((option) => (
                <div key={option} className="survey-option">
                  <label>
                    <input
                      type="radio"
                      name={targetingQuestions[step]?.key}
                      value={option}
                      checked={currentAnswer === option}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      style={{ marginRight: 8 }}
                    />
                    {option}
                  </label>
                </div>
              ))}
            </div>
            <button
              onClick={handleNextTargetingQuestion}
              disabled={!currentAnswer}
              className="cta-button"
            >
              Next
            </button>
          </>
        ) : surveyStep < (questionsData?.length || 0) ? (
          <>
            <div className="survey-question">
              {questionsData[surveyStep]?.question_text}
            </div>
            <div id="render-survey">
              {renderSurveyInput(questionsData[surveyStep])}
            </div>
            <button
              onClick={handleNextSurveyQuestion}
              disabled={currentSurveyAnswer === null}
              className="cta-button"
            >
              Next
            </button>
          </>
        ) : (
          <div className="survey-headline">
            Thank you for completing the survey!
          </div>
        )}
      </div>
    </div>
  );
}

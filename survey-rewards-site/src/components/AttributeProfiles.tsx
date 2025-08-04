'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronRight, Clock, DollarSign, CheckCircle } from 'lucide-react';

interface AttributeProfile {
  profile_id: string;
  profile_type: 'basic' | 'location' | 'personal';
  profile_name: string;
  description: string;
  reward_amount: number;
  estimated_duration_minutes: number;
  is_completed: boolean;
  question_count: number;
}

interface ProfileQuestion {
  field_name: string;
  question_text: string;
  question_type: string;
  options: string[];
}

interface AttributeProfilesProps {
  panelistId: string;
  countryId: string;
}

export default function AttributeProfiles({ panelistId, countryId }: AttributeProfilesProps) {
  const [profiles, setProfiles] = useState<AttributeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ProfileQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Fetch available profiles
  useEffect(() => {
    fetchProfiles();
  }, [panelistId, countryId]);

  const fetchProfiles = async () => {
    try {
      const response = await fetch(
        `/api/attribute-profiles/available?panelist_id=${panelistId}&country_id=${countryId}`
      );
      const data = await response.json();
      
      if (response.ok) {
        setProfiles(data.profiles || []);
      } else {
        toast.error(data.error || 'Failed to load profiles');
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const startProfile = async (profileType: string) => {
    try {
      setLoading(true);
      setActiveProfile(profileType);
      setStartTime(new Date());
      setAnswers({});

      const response = await fetch(
        `/api/attribute-profiles/questions?profile_type=${profileType}&country_id=${countryId}`
      );
      const data = await response.json();
      
      if (response.ok) {
        setQuestions(data.questions || []);
      } else {
        toast.error(data.error || 'Failed to load questions');
        setActiveProfile(null);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
      setActiveProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (fieldName: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const submitProfile = async () => {
    if (!activeProfile || !startTime) return;

    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q => !answers[q.field_name]);
    if (unansweredQuestions.length > 0) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    try {
      setSubmitting(true);
      const completionTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

      const response = await fetch('/api/attribute-profiles/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panelist_id: panelistId,
          profile_type: activeProfile,
          responses: answers,
          completion_time_seconds: completionTime
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        setActiveProfile(null);
        setQuestions([]);
        setAnswers({});
        fetchProfiles(); // Refresh to show completion
      } else {
        toast.error(data.error || 'Failed to submit profile');
      }
    } catch (error) {
      console.error('Error submitting profile:', error);
      toast.error('Failed to submit profile');
    } finally {
      setSubmitting(false);
    }
  };

  const getProfileIcon = (profileType: string) => {
    switch (profileType) {
      case 'basic': return '👤';
      case 'location': return '📍';
      case 'personal': return '🎯';
      default: return '📋';
    }
  };

  if (loading && !activeProfile) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show profile questionnaire
  if (activeProfile && questions.length > 0) {
    const progress = Object.keys(answers).length;
    const total = questions.length;
    const progressPercent = (progress / total) * 100;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {getProfileIcon(activeProfile)} {profiles.find(p => p.profile_type === activeProfile)?.profile_name}
            </h2>
            <button
              onClick={() => setActiveProfile(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{progress}/{total} completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.field_name} className="border-b border-gray-100 pb-6 last:border-b-0">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {index + 1}. {question.question_text}
                </label>
                
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label key={option} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name={question.field_name}
                        value={option}
                        checked={answers[question.field_name] === option}
                        onChange={(e) => handleAnswerChange(question.field_name, e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={submitProfile}
              disabled={submitting || progress < total}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Complete Profile
                  <DollarSign className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show profile list
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Complete Your Profiles</h2>
        <p className="text-gray-600 mt-2">
          Complete these profiles to earn rewards and get better survey matches based on your location.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <div
            key={profile.profile_id}
            className={`bg-white rounded-lg shadow-sm border p-6 relative ${
              profile.is_completed ? 'border-green-200 bg-green-50' : 'hover:shadow-md transition-shadow'
            }`}
          >
            {/* Completion Badge */}
            {profile.is_completed && (
              <div className="absolute top-4 right-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            )}

            {/* Profile Icon & Title */}
            <div className="flex items-start gap-3 mb-4">
              <div className="text-2xl">{getProfileIcon(profile.profile_type)}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{profile.profile_name}</h3>
                <p className="text-sm text-gray-600 mt-1">{profile.description}</p>
              </div>
            </div>

            {/* Profile Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{profile.estimated_duration_minutes} min</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>${profile.reward_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-sm text-gray-500 mb-4">
              {profile.question_count} questions
            </div>

            {/* Action Button */}
            {profile.is_completed ? (
              <div className="flex items-center justify-center py-2 px-4 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                ✓ Completed
              </div>
            ) : (
              <button
                onClick={() => startProfile(profile.profile_type)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Profile
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

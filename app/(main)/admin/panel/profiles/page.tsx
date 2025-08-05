'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Plus,
  Clock,
  Users,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import PanelTabs from '../PanelTabs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProfilesPage() {
  const [panelists, setPanelists] = useState([])
  const [profilingSurveys, setProfilingSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all') // New status filter
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSurveyModal, setShowSurveyModal] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState(null)
  const [newSurvey, setNewSurvey] = useState({ name: '', description: '', questions: '', status: 'live' })
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSurvey, setEditingSurvey] = useState(null)
  const [editQuestions, setEditQuestions] = useState([])
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'single_select_radio',
    answers: ['']
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Refetch data when status filter changes
    fetchData()
  }, [statusFilter])

  // Handle click outside modal to close
  const handleModalClick = (e: React.MouseEvent, closeModal: () => void) => {
    // If clicked on the backdrop (not the modal content), close the modal
    if (e.target === e.currentTarget) {
      closeModal()
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('Starting fetchData...')
      
      // Fetch panelists - simplified query for now
      try {
        const { data: panelistsData, error: panelistsError } = await supabase
          .from('panelists')
          .select('*')
          .order('created_at', { ascending: false })

        if (panelistsError) {
          console.warn('Panelists fetch error:', panelistsError)
          setPanelists([])
        } else {
          setPanelists(panelistsData || [])
        }
      } catch (e) {
        console.warn('Panelists table might not exist:', e)
        setPanelists([])
      }

      // Fetch profiling surveys with optional status filtering
      console.log('Fetching profiling surveys...')
      let surveysQuery = supabase
        .from('profiling_surveys')
        .select('*')
        .order('created_at', { ascending: false })
      
      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        surveysQuery = surveysQuery.eq('status', statusFilter)
      }
      
      const { data: surveysData, error: surveysError } = await surveysQuery

      console.log('Surveys query result:', { surveysData, surveysError })

      if (surveysError) {
        console.error('Surveys error:', surveysError)
        throw surveysError
      }
      
      // Process the surveys data
      let processedSurveys = []
      if (surveysData && surveysData.length > 0) {
        processedSurveys = surveysData.map(survey => {
          console.log('Processing survey:', survey.name)
          console.log('Questions field type:', typeof survey.questions)
          console.log('Questions field content:', survey.questions)
          
          let parsedQuestions = []
          let questionCount = 0
          
          // Handle questions field - it might be JSON string or object
          if (survey.questions) {
            try {
              let questionsData = survey.questions
              
              // If it's a string, parse it
              if (typeof survey.questions === 'string') {
                questionsData = JSON.parse(survey.questions)
              }
              
              // Extract raw text and parse questions
              if (questionsData && questionsData.raw) {
                parsedQuestions = parseQuestions(questionsData.raw)
                questionCount = parsedQuestions.length
              }
            } catch (e) {
              console.error('Error parsing questions for survey:', survey.name, e)
            }
          }
          
          console.log(`Survey "${survey.name}" has ${questionCount} questions`)
          
          return {
            ...survey,
            parsed_questions: parsedQuestions,
            question_count: questionCount
          }
        })
      }
      
      console.log('Final processed surveys:', processedSurveys)
      setProfilingSurveys(processedSurveys)

    } catch (error) {
      console.error('Error fetching data:', error)
      // Set empty arrays on error to prevent UI issues
      setProfilingSurveys([])
      setPanelists([])
    } finally {
      setLoading(false)
    }
  }

  const parseQuestions = (questionsText) => {
    if (!questionsText.trim()) return []
    
    return questionsText.split('\n\n').map((questionBlock, index) => {
      const lines = questionBlock.trim().split('\n')
      let question = ''
      let type = 'single_select_radio'
      let answers = []

      lines.forEach(line => {
        if (line.startsWith('Q: ')) {
          question = line.substring(3).trim()
        } else if (line.startsWith('Type: ')) {
          type = line.substring(6).trim()
        } else if (line.startsWith('A: ')) {
          answers.push(line.substring(3).trim())
        }
      })

      return {
        question_text: question,
        question_type: type,
        answer_option: JSON.stringify(answers),
        question_order: index,
        question_number: String(index + 1)
      }
    })
  }

  const handleCreateSurvey = async () => {
    try {
      if (!newSurvey.name.trim()) {
        alert('Please enter a survey name')
        return
      }

      console.log('Creating survey with data:', newSurvey)

      // Parse questions first to validate
      const parsedQuestions = parseQuestions(newSurvey.questions)
      console.log('Parsed questions count:', parsedQuestions.length)

      // Create the profiling survey with the data we know exists in the table
      const surveyInsertData = {
        name: newSurvey.name,
        description: newSurvey.description,
        is_active: newSurvey.status === 'live', // Keep backward compatibility
        questions: JSON.stringify({ raw: newSurvey.questions }),
        status: newSurvey.status
      }

      console.log('Inserting survey data:', surveyInsertData)

      const { data: surveyData, error: surveyError } = await supabase
        .from('profiling_surveys')
        .insert(surveyInsertData)
        .select()
        .single()

      if (surveyError) {
        console.error('Survey creation error:', surveyError)
        throw surveyError
      }

      console.log('Survey created successfully:', surveyData)

      // Try to create questions in separate table if it exists
      if (parsedQuestions.length > 0) {
        try {
          const questionsToInsert = parsedQuestions.map(q => ({
            ...q,
            profiling_survey_id: surveyData.id
          }))

          console.log('Attempting to insert questions:', questionsToInsert)

          const { error: questionsError } = await supabase
            .from('profiling_questions')
            .insert(questionsToInsert)

          if (questionsError) {
            console.warn('Questions table insert failed (table might not exist):', questionsError)
            // Don't throw error - questions are stored in the main survey record
          } else {
            console.log('Questions created successfully in separate table')
          }
        } catch (e) {
          console.warn('Questions table might not exist:', e)
        }
      }

      // Reset form and close modal
      setNewSurvey({ name: '', description: '', questions: '', status: 'live' })
      setShowCreateModal(false)
      
      // Refresh data
      console.log('Refreshing data...')
      await fetchData()
      
      alert('Profile survey created successfully!')
    } catch (error) {
      console.error('Error creating survey:', error)
      alert('Error creating survey: ' + error.message)
    }
  }

  const handleDeleteSurvey = async (surveyId) => {
    if (!confirm('Are you sure you want to delete this profiling survey?')) return

    try {
      const { error } = await supabase
        .from('profiling_surveys')
        .delete()
        .eq('id', surveyId)

      if (error) throw error
      
      fetchData()
      alert('Survey deleted successfully!')
    } catch (error) {
      console.error('Error deleting survey:', error)
      alert('Error deleting survey: ' + error.message)
    }
  }

  const handleViewSurvey = (survey) => {
    setSelectedSurvey(survey)
    setShowSurveyModal(true)
  }

  const handleEditSurvey = (survey) => {
    setEditingSurvey(survey)
    setEditQuestions(survey.parsed_questions || [])
    setShowEditModal(true)
  }

  const handleSaveEditedSurvey = async () => {
    try {
      if (!editingSurvey.name.trim()) {
        alert('Please enter a survey name')
        return
      }

      console.log('Saving edited survey:', editingSurvey.name)

      // Convert questions back to raw format
      const rawQuestions = editQuestions.map(q => {
        const answers = JSON.parse(q.answer_option || '[]')
        return `Q: ${q.question_text}\nType: ${q.question_type}\n${answers.map(a => `A: ${a}`).join('\n')}`
      }).join('\n\n')

      // Update the survey
      const { error: surveyError } = await supabase
        .from('profiling_surveys')
        .update({
          name: editingSurvey.name,
          description: editingSurvey.description,
          questions: JSON.stringify({ raw: rawQuestions }),
          status: editingSurvey.status,
          is_active: editingSurvey.status === 'live' // Keep backward compatibility
        })
        .eq('id', editingSurvey.id)

      if (surveyError) {
        console.error('Survey update error:', surveyError)
        throw surveyError
      }

      console.log('Survey updated successfully')

      // Close modal and refresh data
      setShowEditModal(false)
      setEditingSurvey(null)
      setEditQuestions([])
      await fetchData()
      
      alert('Survey updated successfully!')
    } catch (error) {
      console.error('Error updating survey:', error)
      alert('Error updating survey: ' + error.message)
    }
  }

  const handleAddQuestion = () => {
    const question = {
      question_text: newQuestion.question_text,
      question_type: newQuestion.question_type,
      answer_option: JSON.stringify(newQuestion.answers.filter(a => a.trim())),
      question_order: editQuestions.length,
      question_number: String(editQuestions.length + 1)
    }
    
    setEditQuestions([...editQuestions, question])
    setNewQuestion({
      question_text: '',
      question_type: 'single_select_radio',
      answers: ['']
    })
    setShowAddQuestion(false)
  }

  const handleUpdateQuestion = (index, updatedQuestion) => {
    const updated = [...editQuestions]
    updated[index] = updatedQuestion
    setEditQuestions(updated)
  }

  const handleDeleteQuestion = (index) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const updated = editQuestions.filter((_, i) => i !== index)
      setEditQuestions(updated)
    }
  }

  const addAnswerOption = () => {
    setNewQuestion({
      ...newQuestion,
      answers: [...newQuestion.answers, '']
    })
  }

  const updateAnswerOption = (index, value) => {
    const updated = [...newQuestion.answers]
    updated[index] = value
    setNewQuestion({
      ...newQuestion,
      answers: updated
    })
  }

  const removeAnswerOption = (index) => {
    if (newQuestion.answers.length > 1) {
      const updated = newQuestion.answers.filter((_, i) => i !== index)
      setNewQuestion({
        ...newQuestion,
        answers: updated
      })
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Panel Administration</h1>
        <p className="text-gray-600">Manage your panelist community and survey profiles</p>
      </div>

      <PanelTabs />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Profile Management</h2>
            <p className="text-gray-600">Manage profiling surveys and panelist profile completion</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create Profile Survey</span>
          </button>
        </div>

        {/* Profile Completion Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Fully Profiled</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {panelists.filter(p => p.panelist_profiles?.length >= 3).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Partially Profiled</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {panelists.filter(p => p.panelist_profiles?.length > 0 && p.panelist_profiles?.length < 3).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Not Profiled</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {panelists.filter(p => !p.panelist_profiles?.length).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profiling Surveys Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Profiling Surveys</h3>
              <div className="flex items-center space-x-4">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="live">Live</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Survey
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading surveys...</p>
              </div>
            ) : profilingSurveys.length > 0 ? (
              <div className="space-y-4">
                {profilingSurveys.map((survey) => {
                  console.log('Rendering survey:', survey.name, 'Question count:', survey.question_count)
                  return (
                  <div key={survey.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="font-medium text-gray-900">{survey.name}</div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          survey.status === 'live' ? 'bg-green-100 text-green-800' :
                          survey.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          survey.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {survey.status ? survey.status.charAt(0).toUpperCase() + survey.status.slice(1) : 'Active'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">{survey.description}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        {survey.question_count || 0} questions • Created {new Date(survey.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewSurvey(survey)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditSurvey(survey)}
                        className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteSurvey(survey.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No profiling surveys created yet</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 text-blue-600 hover:text-blue-900 font-medium"
                >
                  Create your first profiling survey
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Status Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Profile Completion Overview</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading profiles...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {panelists.slice(0, 10).map((panelist) => (
                  <div key={panelist.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {panelist.first_name?.[0]}{panelist.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {panelist.first_name} {panelist.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {panelist.email || panelist.mobile}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {panelist.panelist_profiles?.length || 0}/5 profiles completed
                        </div>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((panelist.panelist_profiles?.length || 0) / 5 * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Survey Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => handleModalClick(e, () => setShowCreateModal(false))}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Profile Survey</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Survey Name *
                </label>
                <input
                  type="text"
                  value={newSurvey.name}
                  onChange={(e) => setNewSurvey({...newSurvey, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Demographic Profile Survey"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newSurvey.description}
                  onChange={(e) => setNewSurvey({...newSurvey, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Brief description of this profiling survey"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={newSurvey.status}
                  onChange={(e) => setNewSurvey({...newSurvey, status: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="live">Live - Visible to panelists</option>
                  <option value="paused">Paused - Hidden but can be resumed</option>
                  <option value="archived">Archived - Permanently hidden</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Survey Questions & Answers (use format below):
                </label>
                <div className="text-sm text-gray-500 mb-2">
                  <pre className="bg-gray-50 p-2 rounded overflow-x-auto w-full text-xs">
{`Q: Your question text here
Type: single_select_radio | multiple_select | rating_scale | single_select_dropdown | user_input
A: Answer 1
A: Answer 2

Q: Next question...
Type: single_select_radio
A: Option 1
A: Option 2`}
                  </pre>
                </div>
                <textarea
                  value={newSurvey.questions}
                  onChange={(e) => setNewSurvey({...newSurvey, questions: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={20}
                  placeholder={`Q: What is your current employment status?
Type: single_select_radio
A: Employed full-time
A: Employed part-time
A: Self-employed
A: Unemployed
A: Retired
A: Student

Q: Which of the following smartphone brands are you familiar with? (Select all that apply)
Type: multiple_select
A: Apple (iPhone)
A: Samsung
A: Google (Pixel)
A: OnePlus
A: Xiaomi`}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSurvey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Survey
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Survey View Modal */}
      {showSurveyModal && selectedSurvey && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => handleModalClick(e, () => setShowSurveyModal(false))}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedSurvey.name}</h2>
              <button 
                onClick={() => setShowSurveyModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">{selectedSurvey.description}</p>
              <div className="text-sm text-gray-500">
                Status: {selectedSurvey.status || 'Active'} • Created: {new Date(selectedSurvey.created_at).toLocaleDateString()}
              </div>
              
              <div className="space-y-6">
                {/* Display parsed questions from the questions field */}
                {selectedSurvey.parsed_questions && selectedSurvey.parsed_questions.length > 0 ? (
                  selectedSurvey.parsed_questions.map((question, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-gray-900">
                        {index + 1}. {question.question_text}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2">Type: {question.question_type}</p>
                      {question.answer_option && (
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {JSON.parse(question.answer_option).map((option, i) => (
                            <li key={i}>{option}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No questions found for this survey.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Survey Modal */}
      {showEditModal && editingSurvey && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => handleModalClick(e, () => setShowEditModal(false))}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Survey: {editingSurvey.name}</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel - Survey Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Survey Name *
                  </label>
                  <input
                    type="text"
                    value={editingSurvey.name}
                    onChange={(e) => setEditingSurvey({...editingSurvey, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingSurvey.description}
                    onChange={(e) => setEditingSurvey({...editingSurvey, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editingSurvey.status || 'live'}
                    onChange={(e) => setEditingSurvey({...editingSurvey, status: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="live">Live - Visible to panelists</option>
                    <option value="paused">Paused - Hidden but can be resumed</option>
                    <option value="archived">Archived - Permanently hidden</option>
                  </select>
                </div>

                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Questions ({editQuestions.length})</h3>
                  <button
                    onClick={() => setShowAddQuestion(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Question</span>
                  </button>
                </div>

                {/* Questions List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {editQuestions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-700">Q{index + 1}</span>
                        <button
                          onClick={() => handleDeleteQuestion(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={question.question_text}
                        onChange={(e) => handleUpdateQuestion(index, {...question, question_text: e.target.value})}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 mb-2"
                        placeholder="Question text"
                      />
                      <select
                        value={question.question_type}
                        onChange={(e) => handleUpdateQuestion(index, {...question, question_type: e.target.value})}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="single_select_radio">Single Select (Radio)</option>
                        <option value="multiple_select">Multiple Select</option>
                        <option value="single_select_dropdown">Single Select (Dropdown)</option>
                        <option value="rating_scale">Rating Scale</option>
                        <option value="user_input">Text Input</option>
                      </select>
                      {question.answer_option && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500 mb-1">Answer Options:</div>
                          {JSON.parse(question.answer_option).map((option, optIndex) => (
                            <div key={optIndex} className="text-xs text-gray-600">• {option}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEditedSurvey}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Right Panel - Question Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {editQuestions.map((question, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {index + 1}. {question.question_text}
                      </h4>
                      <p className="text-sm text-gray-500 mb-3">Type: {question.question_type}</p>
                      
                      {question.question_type === 'single_select_radio' && (
                        <div className="space-y-2">
                          {JSON.parse(question.answer_option || '[]').map((option, optIndex) => (
                            <label key={optIndex} className="flex items-center">
                              <input type="radio" name={`q${index}`} className="mr-2" />
                              <span className="text-sm">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {question.question_type === 'multiple_select' && (
                        <div className="space-y-2">
                          {JSON.parse(question.answer_option || '[]').map((option, optIndex) => (
                            <label key={optIndex} className="flex items-center">
                              <input type="checkbox" className="mr-2" />
                              <span className="text-sm">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {question.question_type === 'single_select_dropdown' && (
                        <select className="w-full border border-gray-300 rounded px-3 py-2">
                          <option>Select an option...</option>
                          {JSON.parse(question.answer_option || '[]').map((option, optIndex) => (
                            <option key={optIndex}>{option}</option>
                          ))}
                        </select>
                      )}
                      
                      {question.question_type === 'user_input' && (
                        <input type="text" className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Your answer..." />
                      )}
                      
                      {question.question_type === 'rating_scale' && (
                        <div className="flex space-x-2">
                          {[1,2,3,4,5].map(num => (
                            <button key={num} className="w-8 h-8 border border-gray-300 rounded hover:bg-blue-100">
                              {num}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestion && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => handleModalClick(e, () => setShowAddQuestion(false))}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Question</h2>
              <button 
                onClick={() => setShowAddQuestion(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text *
                </label>
                <input
                  type="text"
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter your question"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  value={newQuestion.question_type}
                  onChange={(e) => setNewQuestion({...newQuestion, question_type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="single_select_radio">Single Select (Radio Buttons)</option>
                  <option value="multiple_select">Multiple Select (Checkboxes)</option>
                  <option value="single_select_dropdown">Single Select (Dropdown)</option>
                  <option value="rating_scale">Rating Scale (1-5)</option>
                  <option value="user_input">Text Input</option>
                </select>
              </div>

              {(newQuestion.question_type !== 'user_input' && newQuestion.question_type !== 'rating_scale') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer Options
                  </label>
                  <div className="space-y-2">
                    {newQuestion.answers.map((answer, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={answer}
                          onChange={(e) => updateAnswerOption(index, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                          placeholder={`Option ${index + 1}`}
                        />
                        {newQuestion.answers.length > 1 && (
                          <button
                            onClick={() => removeAnswerOption(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addAnswerOption}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowAddQuestion(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddQuestion}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

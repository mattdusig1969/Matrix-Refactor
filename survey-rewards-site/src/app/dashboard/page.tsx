'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Gift, 
  User, 
  Settings, 
  LogOut, 
  Bell,
  Search,
  DollarSign,
  Clock,
  Target,
  TrendingUp,
  Star,
  Plus,
  Menu,
  X,
  ChevronDown,
  Mail,
  Phone,
  Key,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../../../lib/supabase-client'

interface PanelistStats {
  id: string
  first_name: string
  last_name: string
  email?: string
  mobile?: string
  language: string
  country?: string
  country_id?: string
  created_at: string
  total_earnings: number
  total_cashouts: number
  available_balance: number
  surveys_completed: number
  profile_completion_percentage: number
}

interface EarningsHistory {
  id: string
  transaction_type: string
  amount: number
  description: string
  source?: string
  created_at: string
}

interface ProfilingSurvey {
  id: string
  name: string
  description: string
  questions: any
  is_active: boolean
  status: string
  created_at: string
  question_count: number
  estimated_duration: number
  reward_amount: number
  parsed_questions: any[]
}

interface AttributeProfile {
  profile_id: string
  profile_type: string
  profile_name: string
  description: string
  reward_amount: number
  estimated_duration_minutes: number
  is_completed: boolean
  question_count: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [panelistData, setPanelistData] = useState<PanelistStats | null>(null)
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistory[]>([])
  const [profilingSurveys, setProfilingSurveys] = useState<ProfilingSurvey[]>([])
  const [attributeProfiles, setAttributeProfiles] = useState<AttributeProfile[]>([])
  const [completedSurveys, setCompletedSurveys] = useState<string[]>([])
  const [availableSurveys, setAvailableSurveys] = useState<any[]>([])
  const [showSurveyModal, setShowSurveyModal] = useState(false)
  const [activeSurvey, setActiveSurvey] = useState<ProfilingSurvey | null>(null)
  const [activeSurveyType, setActiveSurveyType] = useState<'profiling' | 'main' | 'attribute' | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [surveyResponses, setSurveyResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: ''
  })

  useEffect(() => {
    // Check authentication first
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Auth session:', session)
      
      // Check for fallback authentication if no Supabase session
      const fallbackAuth = localStorage.getItem('fallback_auth_user')
      
      if (!session && !fallbackAuth) {
        console.log('No session or fallback auth found, redirecting to home')
        router.push('/')
        return
      }
      
      if (fallbackAuth && !session) {
        console.log('Using fallback authentication:', fallbackAuth)
      }
      
      // Load the saved active tab from localStorage
      const savedTab = localStorage.getItem('dashboardActiveTab')
      if (savedTab && ['dashboard', 'rewards', 'profile', 'settings'].includes(savedTab)) {
        setActiveTab(savedTab)
      }

      const loadData = async () => {
        const panelistInfo = await fetchPanelistData()
        // fetchEarningsHistory() will be called when panelistData is set via useEffect
        await fetchProfilingSurveys()
        await fetchAttributeProfiles(panelistInfo) // Pass panelist info
        await fetchCompletedSurveys(panelistInfo) // Pass panelist info
        await fetchAvailableSurveys(panelistInfo)
      }
      loadData()
    }
    
    checkAuth()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isUserDropdownOpen && !target.closest('.user-dropdown')) {
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserDropdownOpen])

  // Initialize form data when panelist data loads
  useEffect(() => {
    if (panelistData) {
      setFormData({
        firstName: panelistData.first_name || '',
        lastName: panelistData.last_name || '',
        email: panelistData.email || '',
        mobile: panelistData.mobile || ''
      })
      
      // Fetch earnings history now that we have panelist data
      fetchEarningsHistory()
    }
  }, [panelistData])

  // Show toast notification
  const showToastNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  // Handle form input changes
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Save personal information
  const savePersonalInfo = async () => {
    try {
      console.log('Starting save operation with data:', formData)
      const panelistId = panelistData?.id
      
      if (!panelistId) {
        showToastNotification('Unable to save: No user ID found', 'error')
        return
      }

      console.log('Attempting to update panelist with ID:', panelistId)

      // Try to update the database first
      try {
        const { data, error } = await supabase
          .from('panelists')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            mobile: formData.mobile,
            updated_at: new Date().toISOString()
          })
          .eq('id', panelistId)

        if (error) {
          console.error('Database update error:', error)
          throw error
        }

        console.log('Database update successful:', data)
        
        // Update local state
        setPanelistData(prev => prev ? {
          ...prev,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          mobile: formData.mobile
        } : null)

        // Save to localStorage as backup
        const updatedData = {
          ...panelistData,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          mobile: formData.mobile
        }
        localStorage.setItem('earnly_user_profile', JSON.stringify(updatedData))

        showToastNotification('Personal information updated successfully!')
        
      } catch (dbError) {
        console.error('Database save failed, using local storage fallback:', dbError)
        
        // Fallback: Save to localStorage only
        const updatedData = {
          ...panelistData,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          mobile: formData.mobile,
          updated_at: new Date().toISOString()
        }
        
        localStorage.setItem('earnly_user_profile', JSON.stringify(updatedData))
        
        // Update local state
        setPanelistData(prev => prev ? {
          ...prev,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          mobile: formData.mobile
        } : null)

        showToastNotification('Changes saved locally! (Database temporarily unavailable)')
      }

    } catch (error) {
      console.error('Error saving personal info:', error)
      showToastNotification('An error occurred. Please try again.', 'error')
    }
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    localStorage.setItem('dashboardActiveTab', tabId)
  }

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear any local storage data
      localStorage.removeItem('dashboardActiveTab')
      localStorage.removeItem('panelistData')
      localStorage.removeItem('fallback_auth_user')
      localStorage.removeItem('earnly_user_profile')
      
      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      showToastNotification('Error signing out. Please try again.', 'error')
    }
  }

  const fetchPanelistData = async () => {
    try {
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current authenticated user:', user)
      
      let userEmail = user?.email
      
      // Check for fallback authentication if no Supabase user
      if (!user) {
        const fallbackAuth = localStorage.getItem('fallback_auth_user')
        if (fallbackAuth) {
          try {
            const fallbackUser = JSON.parse(fallbackAuth)
            console.log('Using fallback auth user:', fallbackUser)
            userEmail = fallbackUser.email
          } catch (e) {
            console.error('Error parsing fallback auth:', e)
          }
        }
      }
      
      if (!userEmail) {
        console.log('No authenticated user or fallback found')
        router.push('/')
        return null
      }

      // First try to get from panelists table using the authenticated user's email
      const { data: panelistData, error: panelistError } = await supabase
        .from('panelists')
        .select('*, country:country_id(id, country_name)')
        .eq('email', userEmail)
        .single()

      if (!panelistError && panelistData) {
        console.log('Panelist data from panelists table:', panelistData)
        
        // Calculate available balance from earnings
        const { data: earningsData } = await supabase
          .from('panelist_earnings')
          .select('amount, transaction_type')
          .eq('panelist_id', panelistData.id)
          .eq('status', 'completed')

        const totalEarnings = earningsData?.reduce((sum, earning) => {
          return earning.transaction_type === 'earning' || earning.transaction_type === 'bonus'
            ? sum + parseFloat(earning.amount)
            : sum - parseFloat(earning.amount)
        }, 0) || 0

        const enrichedPanelistData: PanelistStats = {
          ...panelistData,
          available_balance: totalEarnings,
          total_earnings: totalEarnings,
          total_cashouts: 0,
          surveys_completed: 0, // This could be calculated from survey participation records
          profile_completion_percentage: 0
        }

        setPanelistData(enrichedPanelistData)
        return enrichedPanelistData
      }

      console.log('Panelists table not available, falling back to panelist_stats...')
      
      // Fallback to panelist_stats table
      const { data, error } = await supabase
        .from('panelist_stats')
        .select('*, country:country_id(id, country_name)')
        .eq('email', userEmail)
        .single()

      if (error) {
        console.error('Error fetching panelist data from both tables:', error)
        
        // Create a default panelist record if none exists
        const defaultPanelist: PanelistStats = {
          id: user?.id || 'fallback-user',
          email: userEmail,
          first_name: user?.user_metadata?.first_name || '',
          last_name: user?.user_metadata?.last_name || '',
          mobile: user?.user_metadata?.mobile || '',
          country_id: 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', // Default to US
          language: 'en',
          created_at: new Date().toISOString(),
          available_balance: 0,
          total_earnings: 0,
          total_cashouts: 0,
          surveys_completed: 0,
          profile_completion_percentage: 0
        }
        
        console.log('Creating default panelist record:', defaultPanelist)
        setPanelistData(defaultPanelist)
        
        // Save to localStorage as backup
        localStorage.setItem('panelistData', JSON.stringify(defaultPanelist))
        return defaultPanelist
      }

      console.log('Panelist data with country:', data)
      setPanelistData(data)
      return data // Return data so we can use it immediately
    } catch (error) {
      console.error('Error:', error)
      
      // Final fallback: Check localStorage
      const savedProfile = localStorage.getItem('earnly_user_profile')
      if (savedProfile) {
        console.log('Loading from localStorage fallback')
        const profileData = JSON.parse(savedProfile)
        setPanelistData(profileData)
        return profileData
      }
      
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchEarningsHistory = async () => {
    try {
      // Only fetch earnings if we have panelist data with ID
      if (!panelistData?.id) {
        console.log('No panelist ID available for earnings fetch')
        return
      }

      // Get recent earnings for the current panelist only
      const { data, error } = await supabase
        .from('panelist_earnings')
        .select('*')
        .eq('panelist_id', panelistData.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching earnings:', error)
        return
      }

      console.log('Fetched earnings for user:', panelistData.id, data)
      setEarningsHistory(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchCompletedSurveys = async (panelistInfo?: PanelistStats) => {
    try {
      const panelist = panelistInfo || panelistData
      const panelistId = panelist?.id || 'a1b2c3d4-e5f6-7890-abcd-123456789012'
      
      // Check database for completed surveys (both profiling and attribute profiles)
      const { data: completedFromDB, error: dbError } = await supabase
        .from('panelist_profiles')
        .select('profiling_survey_id, survey_type')
        .eq('panelist_id', panelistId)

      if (dbError) {
        console.error('Error fetching completed surveys from database:', dbError)
      } else if (completedFromDB) {
        // Separate regular profiling surveys from attribute profiles
        const completedProfilingIds = completedFromDB
          .filter(item => !item.survey_type || item.survey_type !== 'attribute_profile')
          .map(item => item.profiling_survey_id)
          
        const completedAttributeIds = completedFromDB
          .filter(item => item.survey_type === 'attribute_profile')
          .map(item => item.profiling_survey_id)
        
        setCompletedSurveys(completedProfilingIds)
        
        // Update attribute profiles completion status - only if we have attribute profiles loaded
        setAttributeProfiles(prev => {
          if (prev.length === 0) return prev // Don't update empty array
          return prev.map(profile => ({
            ...profile,
            is_completed: completedAttributeIds.includes(profile.profile_id)
          }))
        })
        
        console.log('Loaded completed profiling surveys:', completedProfilingIds)
        console.log('Loaded completed attribute profiles:', completedAttributeIds)
        return
      }

      // Fallback to localStorage if database query fails
      const completed = localStorage.getItem('completedProfilingSurveys')
      if (completed) {
        setCompletedSurveys(JSON.parse(completed))
      }
    } catch (error) {
      console.error('Error fetching completed surveys:', error)
    }
  }

  const startSurvey = (survey: ProfilingSurvey) => {
    setActiveSurvey(survey)
    setActiveSurveyType('profiling')
    setCurrentQuestionIndex(0)
    setSurveyResponses({})
    setShowSurveyModal(true)
  }

  const startMainSurvey = (survey: any) => {
    // Convert main survey to the same format as profiling survey
    const formattedSurvey: ProfilingSurvey = {
      id: survey.id,
      name: survey.title,
      description: survey.description,
      questions: null, // Main surveys use parsed_questions directly
      is_active: true,
      status: 'active',
      created_at: survey.created_at || new Date().toISOString(),
      question_count: survey.question_count,
      estimated_duration: survey.duration,
      reward_amount: survey.reward,
      parsed_questions: survey.parsed_questions || []
    }
    
    setActiveSurvey(formattedSurvey)
    setActiveSurveyType('main')
    setCurrentQuestionIndex(0)
    setSurveyResponses({})
    setShowSurveyModal(true)
  }

  const handleSurveyResponse = (questionId: string, answer: any) => {
    setSurveyResponses(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const nextQuestion = () => {
    if (activeSurvey && currentQuestionIndex < activeSurvey.parsed_questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      completeSurvey()
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const completeSurvey = async () => {
    if (!activeSurvey || !activeSurveyType) return

    try {
      const panelistId = panelistData?.id || 'a1b2c3d4-e5f6-7890-abcd-123456789012'
      
      if (activeSurveyType === 'profiling') {
        // Handle profiling survey completion
        const surveyResponse = {
          panelist_id: panelistId,
          profiling_survey_id: activeSurvey.id,
          data: surveyResponses,
          completed_at: new Date().toISOString()
        }

        console.log('Saving profiling survey response:', surveyResponse)

        const { data: dbResponse, error: dbError } = await supabase
          .from('panelist_profiles')
          .insert(surveyResponse)

        if (dbError) {
          console.error('Error saving profiling survey response:', dbError)
          showToastNotification(`There was an error saving your survey: ${dbError.message || 'Unknown error'}. Please try again.`, 'error')
          return
        }

        // Mark profiling survey as completed locally
        const newCompleted = [...completedSurveys, activeSurvey.id]
        setCompletedSurveys(newCompleted)
        localStorage.setItem('completedProfilingSurveys', JSON.stringify(newCompleted))
      } else if (activeSurveyType === 'attribute') {
        // Handle attribute profile completion - try API first, fallback to direct insert
        const attributeResponse = {
          profiling_survey_id: activeSurvey.id, // Use the attribute profile ID as profiling_survey_id
          data: JSON.stringify(surveyResponses), // Ensure JSON string format
          completed_at: new Date().toISOString(),
          survey_type: 'attribute_profile' // Add a field to distinguish type
        }

        console.log('Saving attribute profile response via API:', attributeResponse)
        console.log('Profile ID validation:', activeSurvey.id, 'Is valid UUID:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeSurvey.id))

        let saveSuccess = false

        try {
          // First, try using the API route
          const response = await fetch('/api/save-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              panelistId: panelistId,
              profileData: attributeResponse
            })
          })

          const result = await response.json()

          if (response.ok) {
            console.log('Profile saved successfully via API:', result)
            saveSuccess = true
          } else {
            console.log('API failed, will try direct insert. Error:', result)
          }
        } catch (fetchError) {
          console.log('API request failed, will try direct insert. Error:', fetchError)
        }

        // If API failed, try direct insert (requires permissive RLS policy)
        if (!saveSuccess) {
          console.log('Attempting direct database insert as fallback')
          
          // Validate the UUID format before attempting insert
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          const isValidUUID = uuidRegex.test(activeSurvey.id)
          
          console.log('Profile ID validation:', {
            profileId: activeSurvey.id,
            length: activeSurvey.id.length,
            isValidUUID: isValidUUID
          })
          
          if (!isValidUUID) {
            console.error('Invalid UUID format for profile ID:', activeSurvey.id)
            showToastNotification('Invalid profile ID format. Please refresh and try again.', 'error')
            return
          }
          
          const directInsertData = {
            panelist_id: panelistId,
            profiling_survey_id: activeSurvey.id, // This should now be a proper UUID
            data: JSON.stringify(surveyResponses), // Ensure it's a JSON string for JSONB column
            completed_at: new Date().toISOString(),
            survey_type: 'attribute_profile'
          }

          console.log('Direct insert data:', directInsertData)

          const { data: dbResponse, error: dbError } = await supabase
            .from('panelist_profiles')
            .insert(directInsertData)

          if (dbError) {
            console.error('Direct insert also failed:', dbError)
            console.error('Error details:', {
              code: dbError.code,
              message: dbError.message,
              details: dbError.details,
              hint: dbError.hint
            })
            
            // Provide more specific error messages
            let errorMessage = 'Unknown error occurred'
            if (dbError.code === '23505') {
              errorMessage = 'You have already completed this profile'
            } else if (dbError.code === '22P02') {
              errorMessage = 'Invalid data format. Please try again.'
            } else if (dbError.code === '23503') {
              errorMessage = 'User account not found. Please refresh and try again.'
            } else {
              errorMessage = dbError.message || 'Database error occurred'
            }
            
            showToastNotification(`Error saving profile: ${errorMessage}`, 'error')
            return
          } else {
            console.log('Profile saved successfully via direct insert:', dbResponse)
            saveSuccess = true
          }
        }

        if (!saveSuccess) {
          showToastNotification('Unable to save your profile. Please try again.', 'error')
          return
        } else {
          showToastNotification('Profile saved successfully! 🎉', 'success')
        }
      } else if (activeSurveyType === 'main') {
        // Handle main survey completion
        const participationRecord = {
          panelist_id: panelistId,
          survey_id: activeSurvey.id,
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          responses: surveyResponses,
          earnings_amount: activeSurvey.reward_amount
        }

        console.log('Saving main survey participation:', participationRecord)

        const { data: dbResponse, error: dbError } = await supabase
          .from('panelist_survey_participations')
          .insert(participationRecord)

        if (dbError) {
          console.error('Error saving main survey participation:', dbError)
          showToastNotification(`There was an error saving your survey: ${dbError.message || 'Unknown error'}. Please try again.`, 'error')
          return
        }
      }

      // Create earnings record for all types of surveys
      const earningsRecord = {
        panelist_id: panelistId,
        transaction_type: 'earning',
        amount: activeSurvey.reward_amount,
        description: `Completed ${activeSurvey.name}`,
        source: activeSurveyType === 'profiling' ? 'profiling_survey' : 
                activeSurveyType === 'attribute' ? 'attribute_profile' : 'survey_completion',
        status: 'completed'
      }

      const { data: earningsData, error: earningsError } = await supabase
        .from('panelist_earnings')
        .insert(earningsRecord)

      if (earningsError) {
        console.error('Error saving earnings record:', earningsError)
      } else {
        console.log('Earnings record saved successfully:', earningsData)
      }

      // Update local state
      if (panelistData) {
        const updatedBalance = (panelistData.available_balance || 0) + activeSurvey.reward_amount
        setPanelistData(prev => prev ? {
          ...prev,
          available_balance: updatedBalance,
          total_earnings: (prev.total_earnings || 0) + activeSurvey.reward_amount,
          surveys_completed: (prev.surveys_completed || 0) + 1
        } : null)
      }

      // Refresh data based on survey type
      if (activeSurveyType === 'profiling') {
        await fetchCompletedSurveys()
      } else if (activeSurveyType === 'attribute') {
        await fetchCompletedSurveys() // This will update both profiling and attribute completion status
      } else {
        // Refresh available surveys to remove completed one
        await fetchAvailableSurveys()
      }

      // Close modal
      setShowSurveyModal(false)
      setActiveSurvey(null)
      setActiveSurveyType(null)
      
      showToastNotification(`🎉 Survey completed! You earned $${activeSurvey.reward_amount.toFixed(2)}`, 'success')
    } catch (error) {
      console.error('Error completing survey:', error)
      showToastNotification('There was an error completing the survey. Please try again.', 'error')
    }
  }

  const fetchAvailableSurveys = async (panelistInfo?: PanelistStats) => {
    try {
      // Use the passed panelist info or the state data
      const panelist = panelistInfo || panelistData
      const panelistCountryId = panelist?.country_id
      const panelistId = panelist?.id || '6ed86053-0dfc-4795-a977-bf613083f4af'
      
      console.log('Fetching surveys for panelist country_id:', panelistCountryId)
      console.log('Panelist data:', panelist)
      
      if (!panelistCountryId) {
        console.log('No country_id found for panelist, cannot match surveys')
        setAvailableSurveys([])
        return
      }
      
      // Get completed survey IDs for this panelist
      const { data: completedSurveyIds, error: completedError } = await supabase
        .from('panelist_survey_participations')
        .select('survey_id')
        .eq('panelist_id', panelistId)
        .eq('status', 'completed')

      const completedIds = completedSurveyIds?.map(item => item.survey_id) || []
      console.log('Completed main survey IDs:', completedIds)
      
      // Query surveys by country_id - this is the simple approach
      const { data: surveysData, error: surveysError } = await supabase
        .from('surveys')
        .select('*')
        .eq('status', 'live')
        .eq('country_id', panelistCountryId)
        .not('id', 'in', `(${completedIds.length > 0 ? completedIds.map(id => `"${id}"`).join(',') : '""'})`)
        .order('created_at', { ascending: false })

      console.log('Surveys matching country_id (excluding completed):', surveysData)
      
      if (surveysError) {
        console.error('Error fetching surveys by country_id:', surveysError)
        setAvailableSurveys([])
        return
      }

      // Process the surveys data and calculate rewards
      const processedSurveys = (surveysData || []).map(survey => {
        let questionCount = 0
        let parsedQuestions: any[] = []
        
        if (survey.questions) {
          try {
            let questionsData = survey.questions
            
            if (typeof survey.questions === 'string') {
              questionsData = JSON.parse(survey.questions)
            }
            
            if (questionsData && questionsData.raw) {
              parsedQuestions = parseQuestions(questionsData.raw)
              questionCount = parsedQuestions.length
            }
          } catch (e) {
            console.error('Error parsing questions for survey:', survey.title, e)
          }
        }
        
        return {
          id: survey.id,
          title: survey.title || 'Survey',
          description: survey.description || 'Complete this survey to earn rewards',
          reward: parseFloat((questionCount * 0.25).toFixed(2)), // $0.25 per question
          duration: Math.max(questionCount * 0.5, 3), // Estimate 30 seconds per question, min 3 minutes
          category: survey.category || 'General',
          urgency: survey.priority || 'medium',
          question_count: questionCount,
          parsed_questions: parsedQuestions
        }
      })

      console.log('Processed available surveys:', processedSurveys)
      setAvailableSurveys(processedSurveys)
    } catch (error) {
      console.error('Error fetching available surveys:', error)
    }
  }

  const calculateProfileCompletion = () => {
    const totalProfiles = profilingSurveys.length + attributeProfiles.length
    if (totalProfiles === 0) return 0
    
    const completedProfilingSurveys = profilingSurveys.filter(survey => 
      completedSurveys.includes(survey.id)
    ).length
    
    const completedAttributeProfiles = attributeProfiles.filter(profile => 
      profile.is_completed
    ).length
    
    const totalCompleted = completedProfilingSurveys + completedAttributeProfiles
    return Math.round((totalCompleted / totalProfiles) * 100)
  }

  const fetchProfilingSurveys = async () => {
    try {
      console.log('Fetching profiling surveys...')
      const { data: surveysData, error: surveysError } = await supabase
        .from('profiling_surveys')
        .select('*')
        .eq('status', 'live')
        .order('created_at', { ascending: false })

      if (surveysError) {
        console.error('Error fetching profiling surveys:', surveysError)
        return
      }

      // Process the surveys data similar to the admin panel
      const processedSurveys = (surveysData || []).map(survey => {
        let parsedQuestions: any[] = []
        let questionCount = 0
        
        if (survey.questions) {
          try {
            let questionsData = survey.questions
            
            if (typeof survey.questions === 'string') {
              questionsData = JSON.parse(survey.questions)
            }
            
            if (questionsData && questionsData.raw) {
              parsedQuestions = parseQuestions(questionsData.raw)
              questionCount = parsedQuestions.length
            }
          } catch (e) {
            console.error('Error parsing questions for survey:', survey.name, e)
          }
        }
        
        return {
          ...survey,
          parsed_questions: parsedQuestions,
          question_count: questionCount,
          estimated_duration: Math.max(questionCount * 0.5, 3), // Estimate 30 seconds per question, min 3 minutes
          reward_amount: parseFloat((questionCount * 0.25).toFixed(2)) // Estimate $0.25 per question
        }
      })

      console.log('Processed profiling surveys:', processedSurveys)
      setProfilingSurveys(processedSurveys)
    } catch (error) {
      console.error('Error fetching profiling surveys:', error)
    }
  }

  const fetchAttributeProfiles = async (panelistInfo?: PanelistStats) => {
    try {
      const panelist = panelistInfo || panelistData
      const panelistId = panelist?.id || 'a1b2c3d4-e5f6-7890-abcd-123456789012'
      const countryId = panelist?.country_id || 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc' // Default to US

      console.log('Fetching attribute profiles for panelist:', panelistId, 'country:', countryId)
      
      // Query attribute profiles directly from database tables instead of using RPC
      console.log('Building attribute profiles from database tables...')
      
      // Check which profiles are completed for this panelist
      const { data: completedProfiles, error: completedError } = await supabase
        .from('panelist_profiles')
        .select('profiling_survey_id')
        .eq('panelist_id', panelistId)
        .eq('survey_type', 'attribute_profile')

      if (completedError) {
        console.error('Error fetching completed profiles:', completedError)
      }

      const completedProfileIds = completedProfiles?.map(p => p.profiling_survey_id) || []
      console.log('Completed profile IDs:', completedProfileIds)

      // Count distinct questions for each attribute type (not answer options)
      const [demoQuestions, geoQuestions, psychoQuestions] = await Promise.all([
        // Demographics distinct questions
        supabase
          .from('demoattributes')
          .select('questiontext')
          .eq('country_id', countryId),
        // Geographic distinct questions  
        supabase
          .from('geoattributes')
          .select('questiontext')
          .eq('country_id', countryId),
        // Psychographic distinct questions
        supabase
          .from('psychoattributes')
          .select('questiontext')
          .eq('country_id', countryId)
      ])

      // Count distinct questions by removing duplicates
      const demoCount = demoQuestions.data ? Array.from(new Set(demoQuestions.data.map(q => q.questiontext))).length : 0
      const geoCount = geoQuestions.data ? Array.from(new Set(geoQuestions.data.map(q => q.questiontext))).length : 0
      const psychoCount = psychoQuestions.data ? Array.from(new Set(psychoQuestions.data.map(q => q.questiontext))).length : 0

      console.log('Question counts:', {
        demo: demoCount,
        geo: geoCount, 
        psycho: psychoCount
      })

      // Generate consistent UUIDs for profile IDs based on country and type
      const generateProfileUUID = (profileType: string, countryId: string): string => {
        // Create deterministic UUIDs by combining a namespace with the profile type and country
        // This ensures the same profile type for the same country always gets the same UUID
        const namespace = 'attr-prof'
        const seed = `${namespace}-${profileType}-${countryId}`
        
        // Simple deterministic UUID generation based on the seed
        // Create a hash-like UUID by manipulating the country UUID
        const baseUuid = countryId
        const typeMap: { [key: string]: string } = {
          'basic': '1',
          'location': '2', 
          'personal': '3',
          'financial': '4'
        }
        
        // Replace the first character with our type identifier to make it unique
        const typeChar = typeMap[profileType] || '0'
        return baseUuid.substring(0, 7) + typeChar + baseUuid.substring(8)
      }

      const demoProfileId = generateProfileUUID('basic', countryId)
      const geoProfileId = generateProfileUUID('location', countryId)
      const psychoProfileId = generateProfileUUID('personal', countryId)
      const financialProfileId = generateProfileUUID('financial', countryId)

      // Create attribute profiles manually
      const attributeProfiles = [
        {
          profile_id: demoProfileId,
          profile_type: 'basic',
          profile_name: 'Basic Demographics Profile',
          description: 'Tell us about your demographics to get better survey matches',
          reward_amount: 3.00,
          estimated_duration_minutes: 5,
          is_completed: completedProfileIds.includes(demoProfileId),
          question_count: demoCount || 6
        },
        {
          profile_id: geoProfileId,
          profile_type: 'location',
          profile_name: 'Geographic Profile',
          description: 'Help us understand your geographic preferences and lifestyle',
          reward_amount: 2.50,
          estimated_duration_minutes: 4,
          is_completed: completedProfileIds.includes(geoProfileId),
          question_count: geoCount || 12
        },
        {
          profile_id: psychoProfileId,
          profile_type: 'personal',
          profile_name: 'Personal Interests Profile',
          description: 'Share your interests and personality traits for personalized surveys',
          reward_amount: 4.00,
          estimated_duration_minutes: 7,
          is_completed: completedProfileIds.includes(psychoProfileId),
          question_count: psychoCount || 8
        }
      ]

      console.log('Built attribute profiles from database:', attributeProfiles)
      setAttributeProfiles(attributeProfiles)

    } catch (error) {
      console.error('Error fetching attribute profiles:', error)
    }
  }

  const sortAnswerOptions = (questionText: string, options: string[]): string[] => {
    const lowerText = questionText.toLowerCase()
    
    // Sort income ranges
    if (lowerText.includes('income') || lowerText.includes('salary') || lowerText.includes('earn')) {
      return options.sort((a, b) => {
        // Extract numbers from income ranges for comparison
        const extractNumber = (str: string) => {
          const match = str.match(/\$?([\d,]+)/)
          return match ? parseInt(match[1].replace(/,/g, '')) : 0
        }
        
        const aNum = extractNumber(a)
        const bNum = extractNumber(b)
        
        // Handle "Under" prefix (should be first)
        if (a.toLowerCase().includes('under')) return -1
        if (b.toLowerCase().includes('under')) return 1
        
        // Handle "+" suffix (should be last)
        if (a.includes('+') && !b.includes('+')) return 1
        if (b.includes('+') && !a.includes('+')) return -1
        
        return aNum - bNum
      })
    }
    
    // Sort age ranges
    if (lowerText.includes('age') || lowerText.includes('old')) {
      return options.sort((a, b) => {
        const extractAge = (str: string) => {
          const match = str.match(/(\d+)/)
          return match ? parseInt(match[1]) : 0
        }
        
        const aAge = extractAge(a)
        const bAge = extractAge(b)
        
        return aAge - bAge
      })
    }
    
    // Sort education levels
    if (lowerText.includes('education') || lowerText.includes('degree') || lowerText.includes('school')) {
      const educationOrder = [
        'elementary', 'primary', 'middle', 'high school', 'secondary', 
        'some college', 'associate', 'bachelor', 'master', 'doctorate', 'phd'
      ]
      
      return options.sort((a, b) => {
        const aIndex = educationOrder.findIndex(level => a.toLowerCase().includes(level))
        const bIndex = educationOrder.findIndex(level => b.toLowerCase().includes(level))
        
        if (aIndex === -1 && bIndex === -1) return 0
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        
        return aIndex - bIndex
      })
    }
    
    // Sort geographic locations (states, countries, cities) alphabetically
    if (lowerText.includes('state') || lowerText.includes('country') || lowerText.includes('city') || 
        lowerText.includes('location') || lowerText.includes('region') || lowerText.includes('province') ||
        lowerText.includes('reside') || lowerText.includes('live') || lowerText.includes('born')) {
      return options.sort((a, b) => a.localeCompare(b))
    }
    
    // Default: return original order
    return options
  }

  const startAttributeProfile = async (profile: AttributeProfile) => {
    try {
      const countryId = panelistData?.country_id || 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
      
      // Query psychoattributes directly for personal interests profile
      let questionsData = null
      let error = null
      
      if (profile.profile_type === 'personal') {
        console.log('Fetching psychoattributes questions for country:', countryId)
        const { data, error: queryError } = await supabase
          .from('psychoattributes')
          .select('questiontext, field_name, value, question_type')
          .eq('country_id', countryId)
          .order('questiontext')
        
        if (queryError) {
          console.error('Error fetching psychoattributes:', queryError)
          error = queryError
        } else if (data && data.length > 0) {
          // Group by question text to create structured questions
          const questionGroups = data.reduce((acc: any, item: any) => {
            if (!acc[item.questiontext]) {
              acc[item.questiontext] = {
                question_text: item.questiontext,
                question_type: item.question_type || 'single_select_radio',
                answer_option: new Set(),
                field_name: item.field_name
              }
            }
            // Only add non-null, non-undefined, non-empty values and deduplicate
            if (item.value && item.value.trim() !== '') {
              acc[item.questiontext].answer_option.add(item.value.trim())
            }
            return acc
          }, {})
          
          questionsData = Object.values(questionGroups).map((q: any, index: number) => ({
            question_text: q.question_text,
            question_type: q.question_type,
            answer_option: JSON.stringify([...q.answer_option]), // Convert Set to Array
            question_order: index,
            question_number: String(index + 1),
            field_name: q.field_name
          }))
          
          console.log(`Found ${questionsData.length} psychoattributes questions:`, questionsData)
        } else {
          error = { message: 'No psychoattributes questions found for this country' }
        }
      } else if (profile.profile_type === 'basic') {
        // Query demoattributes directly for demographics profile
        console.log('Fetching demoattributes questions for country:', countryId)
        const { data, error: queryError } = await supabase
          .from('demoattributes')
          .select('questiontext, field_name, value, question_type')
          .eq('country_id', countryId)
          .order('questiontext')
        
        if (queryError) {
          console.error('Error fetching demoattributes:', queryError)
          error = queryError
        } else if (data && data.length > 0) {
          console.log('Raw demoattributes data:', data)
          
          // Group by question text
          const questionGroups = data.reduce((acc: any, item: any) => {
            if (!acc[item.questiontext]) {
              acc[item.questiontext] = {
                question_text: item.questiontext,
                question_type: item.question_type || 'single_select_radio',
                answer_option: new Set(),
                field_name: item.field_name
              }
            }
            // Only add non-null, non-undefined values and deduplicate
            if (item.value && item.value.trim() !== '') {
              acc[item.questiontext].answer_option.add(item.value.trim())
            }
            return acc
          }, {})
          
          console.log('Grouped question data:', questionGroups)
          
          questionsData = Object.values(questionGroups).map((q: any, index: number) => ({
            question_text: q.question_text,
            question_type: q.question_type,
            answer_option: JSON.stringify([...q.answer_option]), // Convert Set to Array
            question_order: index,
            question_number: String(index + 1),
            field_name: q.field_name
          }))
          
          console.log(`Found ${questionsData.length} demoattributes questions:`, questionsData)
        } else {
          error = { message: 'No demoattributes questions found for this country' }
        }
      } else if (profile.profile_type === 'location') {
        // Query geoattributes directly for geographic profile
        console.log('Fetching geoattributes questions for country:', countryId)
        const { data, error: queryError } = await supabase
          .from('geoattributes')
          .select('questiontext, field_name, value, question_type')
          .eq('country_id', countryId)
          .order('questiontext')
        
        if (queryError) {
          console.error('Error fetching geoattributes:', queryError)
          error = queryError
        } else if (data && data.length > 0) {
          // Group by question text
          const questionGroups = data.reduce((acc: any, item: any) => {
            if (!acc[item.questiontext]) {
              acc[item.questiontext] = {
                question_text: item.questiontext,
                question_type: item.question_type || 'single_select_radio',
                answer_option: new Set(),
                field_name: item.field_name
              }
            }
            // Only add non-null, non-undefined, non-empty values and deduplicate
            if (item.value && item.value.trim() !== '') {
              acc[item.questiontext].answer_option.add(item.value.trim())
            }
            return acc
          }, {})
          
          questionsData = Object.values(questionGroups).map((q: any, index: number) => ({
            question_text: q.question_text,
            question_type: q.question_type,
            answer_option: JSON.stringify([...q.answer_option]), // Convert Set to Array
            question_order: index,
            question_number: String(index + 1),
            field_name: q.field_name
          }))
          
          console.log(`Found ${questionsData.length} geoattributes questions:`, questionsData)
        } else {
          error = { message: 'No geoattributes questions found for this country' }
        }
      } else {
        error = { message: `Unknown profile type: ${profile.profile_type}` }
      }

      if (error) {
        console.error('Error fetching attribute questions:', error)
        showToastNotification(`Failed to load survey questions: ${error.message}`, 'error')
        return
      }

      if (!questionsData || questionsData.length === 0) {
        console.error('No questions found for profile type:', profile.profile_type)
        showToastNotification(`No questions available for ${profile.profile_name}. Please contact support.`, 'error')
        return
      }

      console.log(`Loaded ${questionsData.length} real questions for ${profile.profile_type} profile:`, questionsData)

      // Convert questions to the same format as profiling surveys
      const parsedQuestions = (questionsData || []).map((q: any, index: number) => {
        // Parse answer options if they're already JSON stringified, or use the array directly
        let answerOptions = []
        try {
          answerOptions = typeof q.answer_option === 'string' ? JSON.parse(q.answer_option) : q.answer_option
        } catch (e) {
          // If parsing fails, treat as array or empty array
          answerOptions = Array.isArray(q.answer_option) ? q.answer_option : []
        }
        
        // Sort answer options for better user experience
        const sortedOptions = answerOptions.length > 0 ? sortAnswerOptions(q.question_text, answerOptions) : []
        
        return {
          question_text: q.question_text,
          question_type: q.question_type,
          answer_option: JSON.stringify(sortedOptions),
          question_order: index,
          question_number: String(index + 1)
        }
      })

      // Create a survey object compatible with the modal
      const attributeSurvey: ProfilingSurvey = {
        id: profile.profile_id,
        name: profile.profile_name,
        description: profile.description,
        questions: null,
        is_active: true,
        status: 'active',
        created_at: new Date().toISOString(),
        question_count: parsedQuestions.length,
        estimated_duration: profile.estimated_duration_minutes,
        reward_amount: profile.reward_amount,
        parsed_questions: parsedQuestions
      }

      setActiveSurvey(attributeSurvey)
      setActiveSurveyType('attribute')
      setCurrentQuestionIndex(0)
      setSurveyResponses({})
      setShowSurveyModal(true)
    } catch (error) {
      console.error('Error starting attribute profile:', error)
      showToastNotification('Failed to load survey. Please try again.', 'error')
    }
  }

  const parseQuestions = (questionsText: string) => {
    if (!questionsText || !questionsText.trim()) return []
    
    return questionsText.split('\n\n').map((questionBlock: string, index: number) => {
      const lines = questionBlock.trim().split('\n')
      let question = ''
      let type = 'single_select_radio'
      let answers: string[] = []

      lines.forEach((line: string) => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'profile', label: 'My Profile', icon: User },
  ]

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-4 w-4 lg:h-6 lg:w-6 text-green-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-lg lg:text-2xl font-semibold text-gray-900">
                ${panelistData?.total_earnings?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Surveys Completed</p>
              <p className="text-lg lg:text-2xl font-semibold text-gray-900">
                {panelistData?.surveys_completed || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-4 w-4 lg:h-6 lg:w-6 text-purple-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Profile Complete</p>
              <p className="text-lg lg:text-2xl font-semibold text-gray-900">
                {panelistData?.profile_completion_percentage || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-4 w-4 lg:h-6 lg:w-6 text-orange-600" />
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Available Balance</p>
              <p className="text-lg lg:text-2xl font-semibold text-gray-900">
                ${panelistData?.available_balance?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Surveys */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
            <h2 className="text-lg font-medium text-gray-900">Available Surveys</h2>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search surveys..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-auto"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 lg:p-6">
          <div className="space-y-4">
            {availableSurveys.map((survey) => (
              <div key={survey.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{survey.title}</h3>
                      {survey.urgency === 'high' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                          High Priority
                        </span>
                      )}
                      {survey.urgency === 'medium' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 w-fit">
                          Medium Priority
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{survey.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {survey.duration} min
                      </span>
                      <span className="flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        {survey.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-center lg:text-right lg:ml-6">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      ${survey.reward.toFixed(2)}
                    </div>
                    <button 
                      onClick={() => startMainSurvey(survey)}
                      className="w-full lg:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Start Survey
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderRewards = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Reward Balance</h2>
        <div className="text-2xl lg:text-3xl font-bold text-green-600 mb-4">
          ${panelistData?.available_balance?.toFixed(2) || '0.00'}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
            <div className="text-center">
              <DollarSign className="h-6 lg:h-8 w-6 lg:w-8 mx-auto text-green-600 mb-2" />
              <div className="font-medium">PayPal</div>
              <div className="text-sm text-gray-600">Instant transfer</div>
            </div>
          </button>
          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
            <div className="text-center">
              <Gift className="h-6 lg:h-8 w-6 lg:w-8 mx-auto text-purple-600 mb-2" />
              <div className="font-medium">Gift Cards</div>
              <div className="text-sm text-gray-600">Amazon, iTunes, etc.</div>
            </div>
          </button>
          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
            <div className="text-center">
              <Plus className="h-6 lg:h-8 w-6 lg:w-8 mx-auto text-blue-600 mb-2" />
              <div className="font-medium">Bank Transfer</div>
              <div className="text-sm text-gray-600">Direct deposit</div>
            </div>
          </button>
        </div>
      </div>

      {/* Earnings History */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Earnings</h3>
        <div className="space-y-3">
          {earningsHistory.length > 0 ? (
            earningsHistory.map((earning) => (
              <div key={earning.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-gray-900 text-sm lg:text-base">{earning.description}</div>
                  <div className="text-xs lg:text-sm text-gray-600">{formatDate(earning.created_at)}</div>
                </div>
                <div className="text-green-600 font-semibold text-sm lg:text-base">
                  +${earning.amount.toFixed(2)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-8 lg:h-12 w-8 lg:w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-sm lg:text-base">No earnings yet. Complete surveys to start earning!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Completion</h2>
        <div className="mb-4">
          <div className="flex justify-between text-sm">
            <span>Profile Strength</span>
            <span>{calculateProfileCompletion()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${calculateProfileCompletion()}%` }}
            ></div>
          </div>
        </div>
        <p className="text-gray-600 mb-4">
          Complete your profile surveys to get matched with more high-paying surveys. 
          {(profilingSurveys.length + attributeProfiles.length) > 0 && (
            <span className="block mt-1 text-sm">
              {completedSurveys.length + attributeProfiles.filter(p => p.is_completed).length} of {profilingSurveys.length + attributeProfiles.length} profile surveys completed
            </span>
          )}
        </p>
      </div>

      {/* Profile Completion Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Completion</h3>
        <p className="text-gray-600 mb-6">Complete these profiles and surveys based on your demographics, location, and personal interests to earn rewards!</p>
        
        <div className="space-y-4">
          {attributeProfiles.length > 0 ? (
            attributeProfiles.map((profile) => {
              const isCompleted = profile.is_completed
              return (
                <div key={profile.profile_id} className={`border rounded-lg p-4 transition-colors ${
                  isCompleted 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{profile.profile_name}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                          isCompleted 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isCompleted ? 'Completed' : 'Attribute Profile'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{profile.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          ~{profile.estimated_duration_minutes} min
                        </span>
                        <span className="flex items-center">
                          <Target className="h-4 w-4 mr-1" />
                          {profile.question_count} questions
                        </span>
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Status: {isCompleted ? 'Completed' : 'Available'}
                        </span>
                      </div>
                    </div>
                    <div className="text-center lg:text-right lg:ml-6">
                      <div className={`text-2xl font-bold mb-2 ${
                        isCompleted ? 'text-green-600' : 'text-green-600'
                      }`}>
                        ${profile.reward_amount.toFixed(2)}
                      </div>
                      <button 
                        onClick={() => !isCompleted && startAttributeProfile(profile)}
                        disabled={isCompleted}
                        className={`w-full lg:w-auto px-4 py-2 rounded-lg transition-colors ${
                          isCompleted 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isCompleted ? 'Completed' : 'Start Profile'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No attribute profiles available at the moment.</p>
              <p className="text-sm">Check back later for new opportunities!</p>
            </div>
          )}
        </div>
        
        {/* Additional Profiling Surveys - Add proper spacing */}
        {profilingSurveys.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-4">Additional Profiling Surveys</h4>
            <div className="space-y-4">
              {profilingSurveys.map((survey) => {
                const isCompleted = completedSurveys.includes(survey.id)
                return (
                  <div key={survey.id} className={`border rounded-lg p-4 transition-colors ${
                    isCompleted 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{survey.name}</h4>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Profile Survey
                          </span>
                          {isCompleted && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{survey.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            ~{Math.round(survey.estimated_duration)} min
                          </span>
                          <span className="flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            {survey.question_count} questions
                          </span>
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            Status: {isCompleted ? 'Completed' : 'Available'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <div className={`text-2xl font-bold mb-2 ${
                          isCompleted ? 'text-green-600' : 'text-green-600'
                        }`}>
                          ${survey.reward_amount.toFixed(2)}
                        </div>
                        <button 
                          onClick={() => !isCompleted && startSurvey(survey)}
                          disabled={isCompleted}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            isCompleted 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isCompleted ? 'Completed' : 'Start Survey'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleFormChange('firstName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleFormChange('lastName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your last name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-1" />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={(e) => handleFormChange('mobile', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your phone number"
            />
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={savePersonalInfo}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
          <button 
            onClick={() => {
              // Reset form to original data
              setFormData({
                firstName: panelistData?.first_name || '',
                lastName: panelistData?.last_name || '',
                email: panelistData?.email || '',
                mobile: panelistData?.mobile || ''
              })
            }}
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Password Security */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          <Key className="h-5 w-5 inline mr-2" />
          Password & Security
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm your new password"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 rounded" defaultChecked />
            <div className="ml-3">
              <label className="block text-sm font-medium text-gray-700">Email Notifications</label>
              <p className="text-sm text-gray-600">Receive survey invitations and updates via email</p>
            </div>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 rounded" />
            <div className="ml-3">
              <label className="block text-sm font-medium text-gray-700">SMS Notifications</label>
              <p className="text-sm text-gray-600">Receive survey invitations via text message</p>
            </div>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 rounded" defaultChecked />
            <div className="ml-3">
              <label className="block text-sm font-medium text-gray-700">Marketing Communications</label>
              <p className="text-sm text-gray-600">Receive promotional offers and platform updates</p>
            </div>
          </div>
          <div className="flex items-start">
            <input type="checkbox" className="mt-1 rounded" defaultChecked />
            <div className="ml-3">
              <label className="block text-sm font-medium text-gray-700">Survey Reminders</label>
              <p className="text-sm text-gray-600">Get reminded about incomplete surveys</p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Save Preferences
          </button>
        </div>
      </div>

      {/* Account Management */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Account Management</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Download Your Data</h4>
            <p className="text-sm text-gray-600 mb-3">
              Get a copy of all your survey responses and account information
            </p>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Request Data Export
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Account Privacy</h4>
            <p className="text-sm text-gray-600 mb-3">
              Manage your privacy settings and data sharing preferences
            </p>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Privacy Settings
            </button>
          </div>
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
            <p className="text-sm text-red-700 mb-3">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button className="text-red-600 hover:text-red-700 text-sm font-medium">
              Delete My Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard()
      case 'rewards':
        return renderRewards()
      case 'profile':
        return renderProfile()
      case 'settings':
        return renderSettings()
      default:
        return renderDashboard()
    }
  }

  const renderSurveyModal = () => {
    if (!showSurveyModal || !activeSurvey) return null

    const currentQuestion = activeSurvey.parsed_questions[currentQuestionIndex]
    const answeredCount = Object.keys(surveyResponses).length
    const progress = (answeredCount / activeSurvey.parsed_questions.length) * 100

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{activeSurvey.name}</h3>
              <button 
                onClick={() => setShowSurveyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Question {currentQuestionIndex + 1} of {activeSurvey.parsed_questions.length}</span>
                <span>{Math.round(progress) || 0}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Question */}
            {currentQuestion && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  {currentQuestion.question_text}
                </h4>

                {/* Answer Options */}
                <div className="space-y-3">
                  {(() => {
                    try {
                      console.log('Current question data:', currentQuestion)
                      console.log('Answer option raw:', currentQuestion.answer_option)
                      console.log('Answer option type:', typeof currentQuestion.answer_option)
                      
                      let options = []
                      
                      // Handle different formats of answer_option
                      if (typeof currentQuestion.answer_option === 'string') {
                        try {
                          options = JSON.parse(currentQuestion.answer_option)
                        } catch (parseError) {
                          console.error('Failed to parse answer_option as JSON:', parseError)
                          console.log('Raw string value:', currentQuestion.answer_option)
                          // If it's a string but not JSON, try splitting by comma or newline
                          options = currentQuestion.answer_option.split(/[,\n]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0)
                        }
                      } else if (Array.isArray(currentQuestion.answer_option)) {
                        options = currentQuestion.answer_option
                      } else {
                        console.error('Unexpected answer_option format:', currentQuestion.answer_option)
                        options = []
                      }
                      
                      console.log('Parsed options:', options)
                      
                      if (!Array.isArray(options) || options.length === 0) {
                        console.error('No valid options found, falling back to text input')
                        throw new Error('No valid options')
                      }
                      
                      const currentAnswer = surveyResponses[currentQuestion.question_number]
                      
                      // Handle different question types
                      const questionType = currentQuestion.question_type || 'single_select_radio'
                      console.log('Question type:', questionType)
                      
                      if (questionType === 'user_input' || questionType === 'text_input' || questionType === 'open_text') {
                        // Text input field for user input questions
                        return (
                          <input
                            type="text"
                            placeholder="Enter your answer..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={currentAnswer || ''}
                            onChange={(e) => handleSurveyResponse(currentQuestion.question_number, e.target.value)}
                          />
                        )
                      } else if (questionType === 'textarea' || questionType === 'long_text') {
                        // Textarea for longer text responses
                        return (
                          <textarea
                            placeholder="Enter your answer..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                            value={currentAnswer || ''}
                            onChange={(e) => handleSurveyResponse(currentQuestion.question_number, e.target.value)}
                          />
                        )
                      } else if (questionType === 'multiple_select' || questionType === 'checkbox') {
                        // Multiple select checkboxes
                        const selectedAnswers = Array.isArray(currentAnswer) ? currentAnswer : []
                        return options.map((option: string, index: number) => (
                          <label key={index} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedAnswers.includes(option)}
                              onChange={(e) => {
                                const newAnswers = e.target.checked 
                                  ? [...selectedAnswers, option]
                                  : selectedAnswers.filter(a => a !== option)
                                handleSurveyResponse(currentQuestion.question_number, newAnswers)
                              }}
                              className="mr-3"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))
                      } else if (questionType === 'rating_scale') {
                        // Rating scale (1-5 or 1-10)
                        const scaleMax = options.length > 0 ? options.length : 5
                        return (
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">1</span>
                            <div className="flex space-x-2">
                              {Array.from({ length: scaleMax }, (_, i) => i + 1).map((rating) => (
                                <button
                                  key={rating}
                                  onClick={() => handleSurveyResponse(currentQuestion.question_number, rating.toString())}
                                  className={`w-10 h-10 rounded-full border-2 font-medium transition-colors ${
                                    currentAnswer === rating.toString()
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                                  }`}
                                >
                                  {rating}
                                </button>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">{scaleMax}</span>
                          </div>
                        )
                      } else if (questionType === 'single_select_dropdown') {
                        // Single select dropdown
                        return (
                          <select
                            value={currentAnswer || ''}
                            onChange={(e) => handleSurveyResponse(currentQuestion.question_number, e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select an option...</option>
                            {options.map((option: string, index: number) => (
                              <option key={index} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )
                      } else {
                        // Default: Single select radio buttons
                        return options.map((option: string, index: number) => (
                          <label key={index} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name={`question-${currentQuestion.question_number}`}
                              value={option}
                              checked={currentAnswer === option}
                              onChange={(e) => handleSurveyResponse(currentQuestion.question_number, e.target.value)}
                              className="mr-3"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))
                      }
                    } catch (e) {
                      // Fallback for questions without proper answer options - treat as text input
                      const currentAnswer = surveyResponses[currentQuestion.question_number] || ''
                      return (
                        <textarea
                          placeholder="Enter your answer..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={4}
                          value={currentAnswer}
                          onChange={(e) => handleSurveyResponse(currentQuestion.question_number, e.target.value)}
                        />
                      )
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={nextQuestion}
                disabled={!surveyResponses[currentQuestion?.question_number]}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentQuestionIndex === activeSurvey.parsed_questions.length - 1 ? 'Complete Survey' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎯 EARNLY DASHBOARD 🎯
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-gray-600">
                <Bell className="h-6 w-6" />
              </button>
              
              {/* User Profile Dropdown */}
              <div className="hidden sm:block relative user-dropdown">
                <button 
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {panelistData?.first_name?.[0]}{panelistData?.last_name?.[0]}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {panelistData?.first_name} {panelistData?.last_name}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        setActiveTab('settings')
                        setIsUserDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('profile')
                        setIsUserDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-gray-400 hover:text-gray-600 p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex flex-col lg:flex-row">
          {/* Mobile Navigation Overlay */}
          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
              <div className="bg-white w-64 h-full shadow-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg font-semibold text-gray-900">Menu</span>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleTabChange(item.id)
                          setIsMobileMenuOpen(false)
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === item.id
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </nav>
                  {/* Mobile User Info */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {panelistData?.first_name?.[0]}{panelistData?.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {panelistData?.first_name} {panelistData?.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${panelistData?.available_balance?.toFixed(2) || '0.00'} available
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 bg-white rounded-lg shadow p-6 mr-8">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 mt-4 lg:mt-0">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Survey Modal */}
      {renderSurveyModal()}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className={`flex items-center p-4 rounded-lg shadow-lg ${
            toastType === 'success' 
              ? 'bg-green-100 border border-green-200 text-green-800' 
              : 'bg-red-100 border border-red-200 text-red-800'
          }`}>
            {toastType === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span className="text-sm font-medium">{toastMessage}</span>
            <button 
              onClick={() => setShowToast(false)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

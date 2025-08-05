'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  Filter,
  Bot,
  Plus,
  Eye,
  Settings,
  Trash2,
  User,
  Target,
  Brain,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import PanelTabs from '../PanelTabs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Panelist {
  id: string
  first_name: string
  last_name: string
  email: string
  mobile: string
  is_verified: boolean
  created_at: string
  country: { country_name: string }[]
  panelist_profiles: Array<{
    id: string
    data: any
    completed_at: string
    profiling_survey_id: string
  }>
}

interface AITwin {
  id: string
  panelist_id: string
  name: string
  variation_label: string
  notes: string
  is_active: boolean
  created_at: string
  panelist: {
    first_name: string
    last_name: string
    email: string
  }
  ai_twin_profiles: Array<{
    id: string
    data: any
    source_panelist_profile_id: string
    source_variation_method: string
    completed_at: string
  }>
}

interface GenerationLog {
  id: string
  panelist_id: string
  total_twins_created: number
  method: string
  variation_range: any
  created_at: string
  created_by: string
}

// Predefined personality templates with richer personas
const PERSONALITY_TEMPLATES = [
  {
    id: 'optimist',
    label: 'Optimist',
    description: 'Positive outlook, likely to rate products favorably',
    variations: { optimism: '+20%', satisfaction: '+15%' },
    fullPersona: {
      psychology: 'Glass-half-full mentality, seeks positive experiences, trusting of brands',
      behavior: 'Likely to try new products, gives benefit of doubt, rates experiences higher',
      decisionMaking: 'Influenced by positive reviews, focuses on benefits over drawbacks',
      communication: 'Uses positive language, recommends products to others',
      lifestyle: 'Active social life, early adopter of trends, values experiences over material goods'
    }
  },
  {
    id: 'skeptic',
    label: 'Skeptic',
    description: 'Critical thinker, more discerning with ratings',
    variations: { trust: '-15%', satisfaction: '-10%' },
    fullPersona: {
      psychology: 'Analytical mindset, questions marketing claims, values evidence-based decisions',
      behavior: 'Researches thoroughly before purchasing, reads reviews critically, slower to adopt',
      decisionMaking: 'Focuses on cons and limitations, seeks third-party validation',
      communication: 'Uses cautious language, shares negative experiences as warnings',
      lifestyle: 'Methodical approach to life, values quality over quantity, budget-conscious'
    }
  },
  {
    id: 'budget_conscious',
    label: 'Budget-Conscious',
    description: 'Price-sensitive, value-focused decisions',
    variations: { price_sensitivity: '+25%', brand_loyalty: '-10%' },
    fullPersona: {
      psychology: 'Practical mindset, financial security-focused, anti-waste values',
      behavior: 'Compares prices extensively, uses coupons/deals, buys generic brands',
      decisionMaking: 'Price is primary factor, considers cost-per-use, delays gratification',
      communication: 'Shares money-saving tips, complains about high prices',
      lifestyle: 'Lives within means, DIY approach, values durability and functionality'
    }
  },
  {
    id: 'early_adopter',
    label: 'Early Adopter',
    description: 'Tech-savvy, interested in new products',
    variations: { innovation: '+30%', tech_comfort: '+20%' },
    fullPersona: {
      psychology: 'Curiosity-driven, status-conscious, innovation-seeking',
      behavior: 'First to try new products, follows tech trends, upgrades frequently',
      decisionMaking: 'Values cutting-edge features, willing to pay premium for innovation',
      communication: 'Shares tech discoveries, influences others\' tech choices',
      lifestyle: 'Digital-first approach, remote work friendly, urban preferences'
    }
  },
  {
    id: 'traditionalist',
    label: 'Traditionalist',
    description: 'Prefers established brands and methods',
    variations: { brand_loyalty: '+20%', innovation: '-15%' },
    fullPersona: {
      psychology: 'Security-seeking, risk-averse, values stability and familiarity',
      behavior: 'Sticks with known brands, resistant to change, values customer service',
      decisionMaking: 'Reputation and longevity matter, prefers proven solutions',
      communication: 'Values personal recommendations, trusts established sources',
      lifestyle: 'Routine-oriented, family-focused, community-minded, suburban/rural preferences'
    }
  }
]

// Question ID to question text mapping (this should ideally come from your survey schema)
const QUESTION_MAPPING = {
  '1': 'What is your primary motivation for participating in surveys?',
  '2': 'How far are you willing to drive for shopping/services?',
  '3': 'What is your typical daily commute distance?',
  '4': 'What type of building do you live in?',
  '5': 'Which region do you live in?',
  '6': 'Which state do you live in?',
  '7': 'What is your internet connection speed?',
  '8': 'What is your primary work arrangement?',
  '9': 'What is your ZIP code?',
  '10': 'How would you describe your area?',
  '11': 'What type of climate do you live in?',
  '12': 'What type of housing do you live in?',
  // Add more mappings as needed based on your actual survey questions
}

export default function AITwinsPage() {
  const [aiTwins, setAITwins] = useState<AITwin[]>([])
  const [panelists, setPanelists] = useState<Panelist[]>([])
  const [generationLogs, setGenerationLogs] = useState<GenerationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPanelist, setSelectedPanelist] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [creatingProgress, setCreatingProgress] = useState('')
  const [selectedTwin, setSelectedTwin] = useState<AITwin | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [generatingPersona, setGeneratingPersona] = useState(false)

  // Create twins form state
  const [twinCount, setTwinCount] = useState(3)
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(['optimist'])
  const [customVariations, setCustomVariations] = useState({
    income: 10,
    age: 5,
    optimism: 15
  })

  useEffect(() => {
    fetchData()
  }, [])

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
      await Promise.all([
        fetchAITwins(),
        fetchPanelists(),
        fetchGenerationLogs()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAITwins = async () => {
    const { data, error } = await supabase
      .from('ai_twins')
      .select(`
        *,
        panelist:panelists(
          first_name,
          last_name,
          email
        ),
        ai_twin_profiles(
          id,
          data,
          source_panelist_profile_id,
          source_variation_method,
          completed_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching AI twins:', error)
      return
    }

    setAITwins(data || [])
  }

  const fetchPanelists = async () => {
    // First, let's get all panelists to debug the issue
    const { data: allPanelists, error: allError } = await supabase
      .from('panelists')
      .select(`
        id,
        first_name,
        last_name,
        email,
        mobile,
        is_verified,
        created_at
      `)
      .order('created_at', { ascending: false })

    console.log('All panelists count:', allPanelists?.length)
    console.log('Verified panelists:', allPanelists?.filter(p => p.is_verified).length)

    // Now get panelists with profiles using a LEFT JOIN to be less restrictive
    const { data, error } = await supabase
      .from('panelists')
      .select(`
        id,
        first_name,
        last_name,
        email,
        mobile,
        is_verified,
        created_at,
        country(country_name),
        panelist_profiles(
          id,
          data,
          completed_at,
          profiling_survey_id
        )
      `)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching panelists:', error)
      return
    }

    console.log('Panelists with country/profiles query result:', data?.length)

    // Filter to only show panelists with completed profiles, but be more lenient
    const panelistsWithProfiles = (data || []).filter(p => {
      const hasProfiles = p.panelist_profiles && p.panelist_profiles.length > 0
      const hasCompletedProfile = hasProfiles && p.panelist_profiles.some(profile => 
        profile.completed_at || profile.data // Accept profiles with data even if completed_at is null
      )
      
      console.log(`Panelist ${p.first_name} ${p.last_name}:`, {
        hasProfiles,
        profileCount: p.panelist_profiles?.length || 0,
        hasCompletedProfile,
        profilesDetails: p.panelist_profiles?.map(prof => ({
          id: prof.id,
          hasData: !!prof.data,
          hasCompletedAt: !!prof.completed_at
        }))
      })
      
      return hasCompletedProfile
    })

    console.log('Final eligible panelists:', panelistsWithProfiles.length)
    setPanelists(panelistsWithProfiles)
  }

  const fetchGenerationLogs = async () => {
    const { data, error } = await supabase
      .from('ai_twin_generation_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching generation logs:', error)
      return
    }

    setGenerationLogs(data || [])
  }

  const generateTwins = async () => {
    if (!selectedPanelist) return

    try {
      setCreating(true)
      setCreatingProgress('Initializing...')

      const panelist = panelists.find(p => p.id === selectedPanelist)
      if (!panelist) throw new Error('Panelist not found')

      const completedProfile = panelist.panelist_profiles.find(p => p.completed_at)
      if (!completedProfile) throw new Error('No completed profile found')

      console.log('Profile data structure:', {
        profileId: completedProfile.id,
        dataType: typeof completedProfile.data,
        dataPreview: completedProfile.data
      })

      // Create twins with different personality variations
      const twinsToCreate = []
      
      for (let i = 0; i < twinCount; i++) {
        setCreatingProgress(`Creating twin ${i + 1} of ${twinCount}...`)
        
        const template = PERSONALITY_TEMPLATES[i % PERSONALITY_TEMPLATES.length]
        const twinName = `${panelist.first_name} ${panelist.last_name} - ${template.label} ${i + 1}`
        
        // Create the AI twin record
        const { data: twinData, error: twinError } = await supabase
          .from('ai_twins')
          .insert({
            panelist_id: selectedPanelist,
            name: twinName,
            variation_label: template.label,
            notes: template.description,
            is_active: true
          })
          .select()
          .single()

        if (twinError) throw twinError

        // Clone and modify the profile data
        setCreatingProgress(`Applying personality variations for twin ${i + 1}...`)
        const modifiedData = await applyPersonalityVariations(
          completedProfile.data,
          template,
          customVariations
        )

        console.log('Modified data for twin', i + 1, ':', {
          template: template.label,
          originalDataType: typeof completedProfile.data,
          modifiedDataType: typeof modifiedData,
          hasMetadata: !!modifiedData._twin_metadata
        })

        // Generate OpenAI persona description
        setCreatingProgress(`Generating AI persona for twin ${i + 1}...`)
        console.log('Generating OpenAI persona for twin:', i + 1)
        let generatedPersona = null
        try {
          const personaResponse = await fetch('/api/generate-persona', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              twinData: modifiedData,
              personalityTemplate: template,
              originalProfile: completedProfile.data
            }),
          })

          if (personaResponse.ok) {
            generatedPersona = await personaResponse.json()
            console.log('Generated persona for twin', i + 1, ':', generatedPersona)
            
            // Add the generated persona to the twin metadata
            if (modifiedData._twin_metadata) {
              modifiedData._twin_metadata.generated_persona = generatedPersona
            }
          } else {
            console.error('Failed to generate persona:', await personaResponse.text())
          }
        } catch (personaError) {
          console.error('Error generating persona:', personaError)
          // Continue without persona - don't fail the twin creation
        }

        // Create the AI twin profile
        setCreatingProgress(`Saving twin ${i + 1} profile...`)
        const { error: profileError } = await supabase
          .from('ai_twin_profiles')
          .insert({
            ai_twin_id: twinData.id,
            source_panelist_profile_id: completedProfile.id,
            data: modifiedData,
            source_variation_method: `Template: ${template.label} + Custom variations`,
            completed_at: new Date().toISOString()
          })

        if (profileError) throw profileError

        twinsToCreate.push(twinData)
      }

      // Log the generation
      setCreatingProgress('Logging generation activity...')
      await supabase
        .from('ai_twin_generation_log')
        .insert({
          panelist_id: selectedPanelist,
          total_twins_created: twinCount,
          method: 'Template-based with custom variations + OpenAI persona generation',
          variation_range: {
            templates: selectedTemplates,
            custom_variations: customVariations
          },
          created_by: 'admin' // In real app, get from auth context
        })

      // Refresh data and close modal
      setCreatingProgress('Refreshing data...')
      await fetchData()
      setShowCreateModal(false)
      setSelectedPanelist('')
      setTwinCount(3)
      setCreatingProgress('')
      
    } catch (error) {
      console.error('Error generating twins:', error)
      alert('Error generating twins: ' + error.message)
    } finally {
      setCreating(false)
      setCreatingProgress('')
    }
  }

  const applyPersonalityVariations = async (originalData: any, template: any, customVars: any) => {
    // Handle both string and object data
    let parsedData
    if (typeof originalData === 'string') {
      try {
        parsedData = JSON.parse(originalData)
      } catch (error) {
        console.error('Error parsing profile data:', error)
        parsedData = {}
      }
    } else {
      parsedData = originalData || {}
    }
    
    // Clone the parsed data
    const modifiedData = JSON.parse(JSON.stringify(parsedData))
    
    // Apply sophisticated personality-based modifications
    if (modifiedData && typeof modifiedData === 'object') {
      Object.keys(modifiedData).forEach(questionId => {
        const response = modifiedData[questionId]
        
        if (typeof response === 'string') {
          // Apply personality-driven changes based on response content and psychology
          modifiedData[questionId] = applyPersonalityToResponse(questionId, response, template)
        }
      })
      
      // Apply systematic personality changes based on template psychology
      applyPersonalitySystematicChanges(modifiedData, template, customVars)
    }
    
    // Create comprehensive twin metadata with persona description
    const finalData = {
      ...modifiedData,
      _twin_metadata: {
        template: template.id,
        variation_applied: template.variations,
        custom_variations: customVars,
        generated_at: new Date().toISOString(),
        original_data_type: typeof originalData,
        persona_profile: template.fullPersona,
        persona_summary: generatePersonaSummary(template, modifiedData)
      }
    }
    
    return finalData
  }

  const applyPersonalityToResponse = (questionId: string, response: string, template: any) => {
    const personality = template.id
    const questionText = QUESTION_MAPPING[questionId] || `Question ${questionId}`
    
    // Drive/commute distance questions (Q2, Q3)
    if (response.includes('drive') || response.includes('miles')) {
      switch (personality) {
        case 'budget_conscious':
          if (response.includes('31-50 miles') || response.includes('Moderate drive')) {
            return 'Short drive (under 2 miles) - saves gas money'
          }
          break
        case 'early_adopter':
          return 'Work from Home - modern work arrangement'
        case 'traditionalist':
          if (response.includes('Work from Home')) {
            return 'Moderate drive (2-10 miles) - prefers office presence'
          }
          break
        case 'optimist':
          return response + ' (enjoys the commute time)'
        case 'skeptic':
          return response + ' (necessary but inefficient)'
      }
    }
    
    // Internet speed (Q7)
    if (response.includes('Mbps') || questionText.toLowerCase().includes('internet')) {
      switch (personality) {
        case 'early_adopter':
          return 'High-speed (50+ Mbps) - essential for innovation'
        case 'budget_conscious':
          return 'Basic speed (5-25 Mbps) - adequate and affordable'
        case 'traditionalist':
          return 'Slow/Limited (under 5 Mbps) - sufficient for basic needs'
        case 'optimist':
          return response + ' (works perfectly for my needs)'
        case 'skeptic':
          return response + ' (acceptable despite provider issues)'
      }
    }
    
    // Work arrangement (Q8)
    if (questionText.toLowerCase().includes('work') || response.includes('Work from Home')) {
      switch (personality) {
        case 'early_adopter':
          return 'Work from Home - embraces digital collaboration'
        case 'traditionalist':
          return 'Office-based work - values in-person collaboration'
        case 'budget_conscious':
          return 'Work from Home - saves commute costs'
        case 'optimist':
          return response + ' (love the flexibility)'
        case 'skeptic':
          return response + ' (works but has limitations)'
      }
    }
    
    // Area type (Q10)
    if (response.includes('Rural') || response.includes('Urban') || response.includes('Suburban')) {
      switch (personality) {
        case 'early_adopter':
          return 'Urban Area - access to latest services and tech'
        case 'traditionalist':
          return 'Suburban Area - best of both worlds'
        case 'budget_conscious':
          return 'Rural Area - lower cost of living'
        case 'optimist':
          return response + ' (perfect community feel)'
        case 'skeptic':
          return response + ' (has pros and cons)'
      }
    }
    
    // Housing type (Q12)
    if (response.includes('home') || response.includes('apartment') || response.includes('condo')) {
      switch (personality) {
        case 'budget_conscious':
          return 'Apartment - cost-effective living'
        case 'traditionalist':
          return 'Single-family home - traditional family setting'
        case 'early_adopter':
          return 'Modern condo - smart home features'
        case 'optimist':
          return response + ' (absolutely love it here)'
        case 'skeptic':
          return response + ' (acceptable for current needs)'
      }
    }
    
    // Default: add personality-based qualifier
    switch (personality) {
      case 'optimist':
        return response + ' (great choice)'
      case 'skeptic':
        return response + ' (adequate option)'
      case 'budget_conscious':
        return response + ' (good value)'
      case 'early_adopter':
        return response + ' (cutting-edge option)'
      case 'traditionalist':
        return response + ' (reliable choice)'
      default:
        return response
    }
  }

  const applyPersonalitySystematicChanges = (data: any, template: any, customVars: any) => {
    const personality = template.id
    const questionKeys = Object.keys(data)
    const changeRate = customVars.optimism / 100 // Use optimism slider as general change rate
    const numToModify = Math.floor(questionKeys.length * changeRate)
    
    // Apply systematic changes based on personality psychology
    for (let i = 0; i < numToModify && i < questionKeys.length; i++) {
      const randomKey = questionKeys[Math.floor(Math.random() * questionKeys.length)]
      const currentValue = data[randomKey]
      
      if (typeof currentValue === 'string' && !currentValue.includes('(') && Math.random() < 0.4) {
        // Apply personality-consistent modifications
        switch (personality) {
          case 'optimist':
            if (!currentValue.includes('(')) {
              data[randomKey] = currentValue + ' (enthusiastic about this)'
            }
            break
          case 'skeptic':
            if (!currentValue.includes('(')) {
              data[randomKey] = currentValue + ' (with some reservations)'
            }
            break
          case 'budget_conscious':
            if (!currentValue.includes('(')) {
              data[randomKey] = currentValue + ' (budget-friendly option)'
            }
            break
          case 'early_adopter':
            if (!currentValue.includes('(')) {
              data[randomKey] = currentValue + ' (forward-thinking choice)'
            }
            break
          case 'traditionalist':
            if (!currentValue.includes('(')) {
              data[randomKey] = currentValue + ' (time-tested option)'
            }
            break
        }
      }
    }
  }

  const generatePersonaSummary = (template: any, modifiedData: any) => {
    const persona = template.fullPersona
    const responses = Object.keys(modifiedData).length
    
    return {
      name: template.label,
      core_psychology: persona.psychology,
      behavioral_traits: persona.behavior,
      decision_style: persona.decisionMaking,
      communication_style: persona.communication,
      lifestyle_preferences: persona.lifestyle,
      response_modifications: `Modified ${Math.floor(responses * 0.3)} out of ${responses} responses to reflect ${template.label} personality`,
      survey_behavior_prediction: generateSurveyBehaviorPrediction(template.id)
    }
  }

  const generateSurveyBehaviorPrediction = (personalityId: string) => {
    const predictions = {
      optimist: {
        response_style: 'Tends to rate experiences positively, gives benefit of doubt',
        completion_rate: 'High - enjoys sharing positive feedback',
        answer_length: 'Moderate to long - enthusiastic explanations',
        rating_bias: 'Skews 1-2 points higher than average'
      },
      skeptic: {
        response_style: 'Critical analysis, focuses on problems and limitations',
        completion_rate: 'Moderate - selective about which surveys to complete',
        answer_length: 'Long - detailed explanations of concerns',
        rating_bias: 'Skews 1-2 points lower than average'
      },
      budget_conscious: {
        response_style: 'Emphasizes value, cost considerations in all responses',
        completion_rate: 'High - motivated by rewards',
        answer_length: 'Short to moderate - efficient responses',
        rating_bias: 'Lower ratings for expensive options'
      },
      early_adopter: {
        response_style: 'Enthusiastic about new features, tech-focused responses',
        completion_rate: 'High - interested in innovation topics',
        answer_length: 'Long - detailed tech explanations',
        rating_bias: 'Higher ratings for innovative products'
      },
      traditionalist: {
        response_style: 'Values stability, proven solutions, familiar brands',
        completion_rate: 'Moderate - prefers shorter, simpler surveys',
        answer_length: 'Short - straightforward answers',
        rating_bias: 'Higher ratings for established brands'
      }
    }
    
    return predictions[personalityId] || {}
  }

  const generatePersonasForAllTwins = async () => {
    // Find all twins that don't have generated personas
    const twinsWithoutPersonas = aiTwins.filter(twin => 
      twin.ai_twin_profiles?.[0] && 
      !twin.ai_twin_profiles[0].data?._twin_metadata?.generated_persona
    )

    if (twinsWithoutPersonas.length === 0) {
      alert('All twins already have generated personas!')
      return
    }

    const confirmGeneration = confirm(
      `This will generate AI personas for ${twinsWithoutPersonas.length} twins. This may take a few minutes. Continue?`
    )

    if (!confirmGeneration) return

    try {
      setGeneratingPersona(true)
      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < twinsWithoutPersonas.length; i++) {
        const twin = twinsWithoutPersonas[i]
        setCreatingProgress(`Generating persona ${i + 1} of ${twinsWithoutPersonas.length} for ${twin.name}...`)
        
        try {
          await generatePersonaForExistingTwin(twin, true) // Skip state management for bulk operation
          successCount++
        } catch (error) {
          console.error(`Failed to generate persona for twin ${twin.name}:`, error)
          errorCount++
        }
        
        // Add a small delay to avoid overwhelming the API
        if (i < twinsWithoutPersonas.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      alert(`Bulk persona generation completed!\nSuccess: ${successCount}\nErrors: ${errorCount}`)
      
      // Refresh the data
      await fetchData()
      
    } catch (error) {
      console.error('Error in bulk persona generation:', error)
      alert('Error during bulk persona generation: ' + (error as Error).message)
    } finally {
      setGeneratingPersona(false)
      setCreatingProgress('')
    }
  }

  const generatePersonaForExistingTwin = async (twin: AITwin, skipStateManagement = false) => {
    if (!twin.ai_twin_profiles?.[0]) {
      throw new Error('No profile data available for this twin.')
    }

    try {
      if (!skipStateManagement) {
        setGeneratingPersona(true)
      }
      
      // Find the personality template that matches this twin
      const template = PERSONALITY_TEMPLATES.find(t => t.label === twin.variation_label) || PERSONALITY_TEMPLATES[0]
      
      // Get the twin's profile data
      const twinProfile = twin.ai_twin_profiles[0]
      
      // Find the source panelist profile for comparison
      const sourcePanelist = panelists.find(p => p.id === twin.panelist_id)
      const sourceProfile = sourcePanelist?.panelist_profiles?.find(
        profile => profile.id === twinProfile.source_panelist_profile_id
      )

      console.log('Generating retroactive persona for twin:', twin.name)
      
      // Call OpenAI to generate the persona
      const personaResponse = await fetch('/api/generate-persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          twinData: twinProfile.data,
          personalityTemplate: template,
          originalProfile: sourceProfile?.data || null
        }),
      })

      if (!personaResponse.ok) {
        throw new Error(`Failed to generate persona: ${await personaResponse.text()}`)
      }

      const generatedPersona = await personaResponse.json()
      console.log('Generated retroactive persona:', generatedPersona)
      
      // Update the twin's profile data with the new persona
      const updatedData = { ...twinProfile.data }
      if (!updatedData._twin_metadata) {
        updatedData._twin_metadata = {}
      }
      updatedData._twin_metadata.generated_persona = generatedPersona
      updatedData._twin_metadata.persona_generated_at = new Date().toISOString()
      updatedData._twin_metadata.persona_generation_type = 'retroactive'

      // Update the database
      const { error } = await supabase
        .from('ai_twin_profiles')
        .update({ data: updatedData })
        .eq('id', twinProfile.id)

      if (error) {
        throw error
      }

      // Update the local state to reflect the changes
      setSelectedTwin(prev => {
        if (!prev) return prev
        return {
          ...prev,
          ai_twin_profiles: prev.ai_twin_profiles.map(profile => 
            profile.id === twinProfile.id 
              ? { ...profile, data: updatedData }
              : profile
          )
        }
      })

      // Also update the main twins list
      setAITwins(prevTwins => 
        prevTwins.map(t => 
          t.id === twin.id 
            ? {
                ...t,
                ai_twin_profiles: t.ai_twin_profiles.map(profile => 
                  profile.id === twinProfile.id 
                    ? { ...profile, data: updatedData }
                    : profile
                )
              }
            : t
        )
      )

      if (!skipStateManagement) {
        alert('Persona generated successfully!')
      }
      
    } catch (error) {
      console.error('Error generating retroactive persona:', error)
      if (!skipStateManagement) {
        alert('Error generating persona: ' + (error as Error).message)
      }
      throw error // Re-throw for bulk operation error handling
    } finally {
      if (!skipStateManagement) {
        setGeneratingPersona(false)
      }
    }
  }

  const deactivateTwin = async (twinId: string) => {
    const { error } = await supabase
      .from('ai_twins')
      .update({ is_active: false })
      .eq('id', twinId)

    if (error) {
      console.error('Error deactivating twin:', error)
      return
    }

    await fetchAITwins()
  }

  const viewTwinProfile = (twin: AITwin) => {
    setSelectedTwin(twin)
    setShowProfileModal(true)
  }

  const compareWithOriginal = (originalData: any, twinData: any) => {
    const differences = []
    const original = typeof originalData === 'string' ? JSON.parse(originalData) : originalData
    const twin = typeof twinData === 'string' ? JSON.parse(twinData) : twinData

    // Compare each question response
    Object.keys(twin).forEach(questionId => {
      if (questionId === '_twin_metadata') return // Skip metadata
      
      const originalValue = original[questionId]
      const twinValue = twin[questionId]
      const questionText = QUESTION_MAPPING[questionId] || `Question ${questionId}`
      
      if (originalValue !== twinValue) {
        differences.push({
          questionId,
          questionText,
          original: originalValue,
          twin: twinValue,
          changed: true
        })
      } else {
        differences.push({
          questionId,
          questionText,
          original: originalValue,
          twin: twinValue,
          changed: false
        })
      }
    })

    return differences
  }

  const filteredTwins = aiTwins.filter(twin => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      twin.name?.toLowerCase().includes(searchLower) ||
      twin.variation_label?.toLowerCase().includes(searchLower) ||
      twin.panelist?.first_name?.toLowerCase().includes(searchLower) ||
      twin.panelist?.last_name?.toLowerCase().includes(searchLower)
    )
  })

  const eligiblePanelists = panelists.filter(p => 
    p.panelist_profiles && p.panelist_profiles.some(profile => profile.completed_at)
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Panel Administration</h1>
        <p className="text-gray-600">Manage AI digital twins for survey simulation</p>
      </div>

      <PanelTabs />

      <div className="space-y-6">
        {/* Bulk Progress Indicator */}
        {generatingPersona && creatingProgress && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
              <span className="text-sm font-medium text-emerald-700">{creatingProgress}</span>
            </div>
          </div>
        )}

        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Digital Twins</h2>
            <p className="text-gray-600">Create and manage synthetic panelist personas for survey simulation</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search twins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              />
            </div>
            {/* Show bulk persona generation if there are twins without personas */}
            {aiTwins.some(twin => !twin.ai_twin_profiles?.[0]?.data?._twin_metadata?.generated_persona) && (
              <button 
                onClick={generatePersonasForAllTwins}
                disabled={generatingPersona}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {generatingPersona && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <Brain className="h-4 w-4" />
                <span>{generatingPersona ? 'Generating...' : 'Generate Missing Personas'}</span>
              </button>
            )}
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              <span>Generate Twins</span>
            </button>
            <button 
              onClick={fetchData}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Bot className="h-4 w-4" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bot className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total AI Twins</p>
                <p className="text-2xl font-semibold text-gray-900">{aiTwins.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Twins</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {aiTwins.filter(t => t.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Brain className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With AI Personas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {aiTwins.filter(t => t.ai_twin_profiles?.[0]?.data?._twin_metadata?.generated_persona).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Source Panelists</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set(aiTwins.map(t => t.panelist_id)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Eligible Panelists</p>
                <p className="text-2xl font-semibold text-gray-900">{eligiblePanelists.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Generation Activity */}
        {generationLogs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Generation Activity</h3>
            <div className="space-y-3">
              {generationLogs.slice(0, 3).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Generated {log.total_twins_created} twins
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleDateString()} • Method: {log.method}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {log.total_twins_created} twins
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Twins Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">AI Digital Twins</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading AI twins...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Twin Identity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source Panelist
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Personality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profile Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTwins.map((twin) => (
                    <tr key={twin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Bot className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="ml-4">
                            <button 
                              onClick={() => viewTwinProfile(twin)}
                              className="text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors cursor-pointer"
                            >
                              {twin.name}
                            </button>
                            <div className="text-sm text-gray-500">
                              {twin.is_active ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {twin.panelist?.first_name} {twin.panelist?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {twin.panelist?.email}
                      </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {twin.variation_label}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {twin.notes}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-gray-900">
                            {twin.ai_twin_profiles?.length || 0} profiles
                          </span>
                          {twin.ai_twin_profiles?.[0]?.data?._twin_metadata?.generated_persona ? (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              <Brain className="h-3 w-3 mr-1" />
                              AI Persona
                            </span>
                          ) : (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              No Persona
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(twin.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => viewTwinProfile(twin)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {!twin.ai_twin_profiles?.[0]?.data?._twin_metadata?.generated_persona && (
                            <button 
                              onClick={() => generatePersonaForExistingTwin(twin)}
                              disabled={generatingPersona}
                              className="text-emerald-600 hover:text-emerald-900 disabled:opacity-50"
                              title="Generate AI Persona"
                            >
                              <Brain className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            className="text-gray-600 hover:text-gray-900"
                            title="Settings"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deactivateTwin(twin.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Deactivate"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Twins Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => handleModalClick(e, () => {
            setShowCreateModal(false)
            setCreatingProgress('')
          })}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Generate AI Twins</h3>
              <p className="text-sm text-gray-500">Create synthetic digital twins from panelist profiles</p>
              <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                ✨ Each twin will include an AI-generated persona description powered by OpenAI
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              {/* Progress indicator */}
              {creating && creatingProgress && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    <span className="text-sm font-medium text-purple-700">{creatingProgress}</span>
                  </div>
                </div>
              )}

              {/* Panelist Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Panelist
                </label>
                <select
                  value={selectedPanelist}
                  onChange={(e) => setSelectedPanelist(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a panelist...</option>
                  {eligiblePanelists.map((panelist) => (
                    <option key={panelist.id} value={panelist.id}>
                      {panelist.first_name} {panelist.last_name} ({panelist.email}) - {panelist.panelist_profiles?.length || 0} profiles
                    </option>
                  ))}
                </select>
              </div>

              {/* Twin Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Twins to Generate
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={twinCount}
                  onChange={(e) => setTwinCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Personality Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personality Templates
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PERSONALITY_TEMPLATES.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={template.id}
                          checked={selectedTemplates.includes(template.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTemplates([...selectedTemplates, template.id])
                            } else {
                              setSelectedTemplates(selectedTemplates.filter(t => t !== template.id))
                            }
                          }}
                          className="mr-2"
                        />
                        <label htmlFor={template.id} className="text-sm font-medium text-gray-900">
                          {template.label}
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Variations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Variation Ranges (%)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Income</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={customVariations.income}
                      onChange={(e) => setCustomVariations(prev => ({ ...prev, income: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-600">±{customVariations.income}%</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Age</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={customVariations.age}
                      onChange={(e) => setCustomVariations(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-600">±{customVariations.age}%</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Optimism</label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={customVariations.optimism}
                      onChange={(e) => setCustomVariations(prev => ({ ...prev, optimism: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-600">±{customVariations.optimism}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreatingProgress('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={generateTwins}
                disabled={!selectedPanelist || creating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {creating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{creating ? 'Generating twins & personas...' : 'Generate Twins'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Twin Profile Viewer Modal */}
      {showProfileModal && selectedTwin && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => handleModalClick(e, () => setShowProfileModal(false))}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTwin.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedTwin.variation_label} • Created {new Date(selectedTwin.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              {/* Twin Overview */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Bot className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">AI Twin</h4>
                        <p className="text-2xl font-bold text-purple-600">{selectedTwin.variation_label}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Source Panelist</h4>
                        <p className="text-lg font-semibold text-blue-600">
                          {selectedTwin.panelist?.first_name} {selectedTwin.panelist?.last_name}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Status</h4>
                        <p className="text-lg font-semibold text-green-600">
                          {selectedTwin.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personality Description */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Comprehensive Persona Profile</h4>
                {selectedTwin.ai_twin_profiles?.[0]?.data?._twin_metadata?.persona_profile ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 mb-2">🧠 Psychology</h5>
                        <p className="text-sm text-blue-800">
                          {selectedTwin.ai_twin_profiles[0].data._twin_metadata.persona_profile.psychology}
                        </p>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-4">
                        <h5 className="font-medium text-green-900 mb-2">⚡ Behavior Patterns</h5>
                        <p className="text-sm text-green-800">
                          {selectedTwin.ai_twin_profiles[0].data._twin_metadata.persona_profile.behavior}
                        </p>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h5 className="font-medium text-purple-900 mb-2">🎯 Decision Making</h5>
                        <p className="text-sm text-purple-800">
                          {selectedTwin.ai_twin_profiles[0].data._twin_metadata.persona_profile.decisionMaking}
                        </p>
                      </div>
                      
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h5 className="font-medium text-orange-900 mb-2">💬 Communication Style</h5>
                        <p className="text-sm text-orange-800">
                          {selectedTwin.ai_twin_profiles[0].data._twin_metadata.persona_profile.communication}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">🏠 Lifestyle Preferences</h5>
                      <p className="text-sm text-gray-700">
                        {selectedTwin.ai_twin_profiles[0].data._twin_metadata.persona_profile.lifestyle}
                      </p>
                    </div>

                    {/* Generated AI Persona Description */}
                    {selectedTwin.ai_twin_profiles[0].data._twin_metadata.generated_persona ? (
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                        <h5 className="font-medium text-emerald-900 mb-3 flex items-center">
                          <span className="mr-2">🤖</span>
                          AI-Generated Persona Description
                        </h5>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-emerald-800 leading-relaxed">
                              {selectedTwin.ai_twin_profiles[0].data._twin_metadata.generated_persona.persona_description}
                            </p>
                          </div>
                          
                          {selectedTwin.ai_twin_profiles[0].data._twin_metadata.generated_persona.key_traits && (
                            <div>
                              <h6 className="font-medium text-emerald-900 mb-2 text-sm">Key Personality Traits:</h6>
                              <div className="flex flex-wrap gap-2">
                                {selectedTwin.ai_twin_profiles[0].data._twin_metadata.generated_persona.key_traits.map((trait, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                    {trait}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {selectedTwin.ai_twin_profiles[0].data._twin_metadata.generated_persona.likely_behaviors && (
                            <div>
                              <h6 className="font-medium text-emerald-900 mb-2 text-sm">Likely Behaviors:</h6>
                              <ul className="list-disc list-inside text-sm text-emerald-700 space-y-1">
                                {selectedTwin.ai_twin_profiles[0].data._twin_metadata.generated_persona.likely_behaviors.map((behavior, index) => (
                                  <li key={index}>{behavior}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {selectedTwin.ai_twin_profiles[0].data._twin_metadata.generated_persona.decision_factors && (
                            <div>
                              <h6 className="font-medium text-emerald-900 mb-2 text-sm">Decision-Making Factors:</h6>
                              <ul className="list-disc list-inside text-sm text-emerald-700 space-y-1">
                                {selectedTwin.ai_twin_profiles[0].data._twin_metadata.generated_persona.decision_factors.map((factor, index) => (
                                  <li key={index}>{factor}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
                        <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                          <span className="mr-2">📝</span>
                          AI Persona Description
                        </h5>
                        <p className="text-sm text-gray-600 mb-3">
                          No AI-generated persona available for this twin. This feature was added after this twin was created.
                        </p>
                        <button 
                          onClick={() => generatePersonaForExistingTwin(selectedTwin)}
                          disabled={generatingPersona}
                          className="flex items-center space-x-2 text-sm px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingPersona && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                          <span>{generatingPersona ? 'Generating...' : 'Generate Persona Now'}</span>
                        </button>
                      </div>
                    )}

                    {/* Survey Behavior Prediction */}
                    {selectedTwin.ai_twin_profiles[0].data._twin_metadata.persona_summary?.survey_behavior_prediction && (
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <h5 className="font-medium text-indigo-900 mb-3">📊 Predicted Survey Behavior</h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-indigo-800">Response Style:</span>
                            <p className="text-indigo-700">
                              {selectedTwin.ai_twin_profiles[0].data._twin_metadata.persona_summary.survey_behavior_prediction.response_style}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-indigo-800">Completion Rate:</span>
                            <p className="text-indigo-700">
                              {selectedTwin.ai_twin_profiles[0].data._twin_metadata.persona_summary.survey_behavior_prediction.completion_rate}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-indigo-800">Answer Length:</span>
                            <p className="text-indigo-700">
                              {selectedTwin.ai_twin_profiles[0].data._twin_metadata.persona_summary.survey_behavior_prediction.answer_length}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-indigo-800">Rating Bias:</span>
                            <p className="text-indigo-700">
                              {selectedTwin.ai_twin_profiles[0].data._twin_metadata.persona_summary.survey_behavior_prediction.rating_bias}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedTwin.notes}</p>
                    {selectedTwin.ai_twin_profiles?.[0]?.data?._twin_metadata && (
                      <div className="mt-3 text-sm text-gray-600">
                        <strong>Variation Method:</strong> {selectedTwin.ai_twin_profiles[0].source_variation_method}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Data Comparison */}
              {selectedTwin.ai_twin_profiles?.[0] && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Profile Data Analysis</h4>
                  
                  {/* Generated Persona Summary */}
                  {selectedTwin.ai_twin_profiles[0].data?._twin_metadata?.persona_summary?.generated_persona && (
                    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                        <span className="mr-2">🤖</span>
                        Generated Digital Persona Summary
                      </h5>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {selectedTwin.ai_twin_profiles[0].data._twin_metadata.persona_summary.generated_persona}
                      </p>
                    </div>
                  )}
                  
                  {/* Get source panelist profile for comparison */}
                  {(() => {
                    const twinProfile = selectedTwin.ai_twin_profiles[0]
                    const sourceProfile = panelists
                      .find(p => p.id === selectedTwin.panelist_id)
                      ?.panelist_profiles?.find(profile => profile.id === twinProfile.source_panelist_profile_id)

                    if (!sourceProfile) {
                      return (
                        <div className="text-gray-500 text-center py-8">
                          Source profile data not available for comparison
                        </div>
                      )
                    }

                    const differences = compareWithOriginal(sourceProfile.data, twinProfile.data)
                    const changedItems = differences.filter(d => d.changed)
                    const unchangedItems = differences.filter(d => !d.changed)

                    return (
                      <div className="space-y-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">{changedItems.length}</div>
                            <div className="text-sm text-yellow-700">Modified Responses</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-600">{unchangedItems.length}</div>
                            <div className="text-sm text-gray-700">Unchanged Responses</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {Math.round((changedItems.length / differences.length) * 100)}%
                            </div>
                            <div className="text-sm text-purple-700">Variation Rate</div>
                          </div>
                        </div>

                        {/* Changed Responses */}
                        {changedItems.length > 0 && (
                          <div>
                            <h5 className="text-md font-medium text-gray-900 mb-3">
                              🔄 Modified Responses ({changedItems.length})
                            </h5>
                            <div className="space-y-3">
                              {changedItems.map((diff, index) => (
                                <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 mr-4">
                                      <div className="text-sm font-medium text-gray-900 mb-1">
                                        {diff.questionText || `Question ${diff.questionId}`}
                                      </div>
                                      {diff.questionText && (
                                        <div className="text-xs text-gray-500 mb-2">ID: {diff.questionId}</div>
                                      )}
                                      <div className="mt-2 space-y-1">
                                        <div className="text-sm">
                                          <span className="text-red-600 font-medium">Original:</span>{' '}
                                          <span className="text-gray-700">{diff.original}</span>
                                        </div>
                                        <div className="text-sm">
                                          <span className="text-green-600 font-medium">Twin:</span>{' '}
                                          <span className="text-gray-700">{diff.twin}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <Target className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Unchanged Responses (collapsed by default) */}
                        <details className="group">
                          <summary className="cursor-pointer text-md font-medium text-gray-900 mb-3 flex items-center">
                            <span>✅ Unchanged Responses ({unchangedItems.length})</span>
                            <svg className="w-4 h-4 ml-2 transform group-open:rotate-90 transition-transform">
                              <path fill="currentColor" d="M8 4l4 4-4 4z"/>
                            </svg>
                          </summary>
                          <div className="space-y-2 ml-4">
                            {unchangedItems.slice(0, 10).map((diff, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded">
                                <div className="text-sm">
                                  <span className="font-medium">
                                    {diff.questionText || `Question ${diff.questionId}`}:
                                  </span>{' '}
                                  <span className="text-gray-700">{diff.original}</span>
                                </div>
                                {diff.questionText && (
                                  <div className="text-xs text-gray-500 mt-1">ID: {diff.questionId}</div>
                                )}
                              </div>
                            ))}
                            {unchangedItems.length > 10 && (
                              <div className="text-sm text-gray-500 p-3">
                                ... and {unchangedItems.length - 10} more unchanged responses
                              </div>
                            )}
                          </div>
                        </details>

                        {/* Twin Metadata */}
                        {twinProfile.data._twin_metadata && (
                          <div>
                            <h5 className="text-md font-medium text-gray-900 mb-3">
                              🧬 Generation Metadata
                            </h5>
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                {JSON.stringify(twinProfile.data._twin_metadata, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  console.log('Twin Profile Data:', selectedTwin)
                  alert('Twin profile data logged to console')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

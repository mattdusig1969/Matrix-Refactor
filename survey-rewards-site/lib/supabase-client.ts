import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface Panelist {
  id: string
  email?: string
  mobile?: string
  first_name: string
  last_name: string
  language: string
  password_hash?: string
  country_id?: string
  is_verified?: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface PanelistEarnings {
  id: string
  panelist_id: string
  transaction_type: 'earning' | 'cashout' | 'bonus' | 'penalty'
  amount: number
  description: string
  source?: string // 'signup_bonus', 'survey_completion', 'profile_completion', etc.
  survey_id?: string
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  processed_at?: string
}

export interface PanelistSurveyParticipation {
  id: string
  panelist_id: string
  survey_id: string
  status: 'invited' | 'started' | 'completed' | 'screened_out' | 'quota_full'
  started_at?: string
  completed_at?: string
  responses?: any // JSON object with survey responses
  earnings_amount?: number
  created_at: string
}

export interface PanelistProfile {
  id: string
  panelist_id: string
  profiling_survey_id: string
  completed_at: string
  data: any // JSON object with profile data
}

// View type for calculated stats
export interface PanelistStats {
  id: string
  first_name: string
  last_name: string
  email?: string
  mobile?: string
  language: string
  created_at: string
  total_earnings: number
  total_cashouts: number
  available_balance: number
  surveys_completed: number
  profile_completion_percentage: number
}

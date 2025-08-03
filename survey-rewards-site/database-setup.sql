-- =====================================================
-- EARNLY SURVEY REWARDS PLATFORM - DATABASE SETUP
-- =====================================================
-- This script creates all necessary tables, policies, and 
-- modifications for the Earnly survey rewards platform
-- =====================================================

-- 1. CREATE PANELISTS TABLE
-- Stores user login credentials and basic personal information
CREATE TABLE public.panelists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Personal Information
  first_name text NOT NULL,
  last_name text NOT NULL,
  
  -- Login Credentials (either mobile OR email required)
  mobile text UNIQUE,
  email text UNIQUE,
  password_hash text NOT NULL,
  
  -- Location & Language
  country_id uuid REFERENCES country(id),
  language text,
  
  -- Account Status
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  last_login timestamp with time zone,
  
  -- Constraints
  CONSTRAINT check_contact_method CHECK (
    (mobile IS NOT NULL AND mobile != '') OR 
    (email IS NOT NULL AND email != '')
  )
);

-- Add indexes for performance
CREATE INDEX idx_panelists_mobile ON panelists(mobile) WHERE mobile IS NOT NULL;
CREATE INDEX idx_panelists_email ON panelists(email) WHERE email IS NOT NULL;
CREATE INDEX idx_panelists_country ON panelists(country_id);
CREATE INDEX idx_panelists_active ON panelists(is_active) WHERE is_active = true;

-- 2. CREATE PROFILING SURVEYS TABLE
-- Stores metadata for different types of profiling surveys
CREATE TABLE public.profiling_surveys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Survey Information
  name text NOT NULL,
  description text,
  reward_amount decimal(10,2) DEFAULT 0.00,
  estimated_duration_minutes integer,
  
  -- Survey Configuration
  questions jsonb, -- Store survey questions and structure
  targeting_criteria jsonb, -- Who should see this survey
  
  -- Status
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0
);

CREATE INDEX idx_profiling_surveys_active ON profiling_surveys(is_active) WHERE is_active = true;

-- 3. CREATE PANELIST PROFILES TABLE  
-- Stores completed profiling survey responses for each user
CREATE TABLE public.panelist_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Relationships
  panelist_id uuid NOT NULL REFERENCES panelists(id) ON DELETE CASCADE,
  profiling_survey_id uuid NOT NULL REFERENCES profiling_surveys(id),
  
  -- Response Data
  completed_at timestamp with time zone DEFAULT now(),
  data jsonb NOT NULL, -- Store all survey responses
  
  -- Metadata
  completion_time_seconds integer,
  ip_address inet,
  user_agent text,
  
  -- Prevent duplicate completions
  UNIQUE(panelist_id, profiling_survey_id)
);

CREATE INDEX idx_panelist_profiles_user ON panelist_profiles(panelist_id);
CREATE INDEX idx_panelist_profiles_survey ON panelist_profiles(profiling_survey_id);
CREATE INDEX idx_panelist_profiles_completed ON panelist_profiles(completed_at);

-- 4. CREATE PANELIST REWARDS TABLE
-- Track earnings, bonuses, and payouts
CREATE TABLE public.panelist_rewards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  
  -- User
  panelist_id uuid NOT NULL REFERENCES panelists(id) ON DELETE CASCADE,
  
  -- Reward Details
  reward_type text NOT NULL CHECK (reward_type IN ('survey_completion', 'profile_bonus', 'referral', 'signup_bonus')),
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  description text,
  
  -- Source Reference (what earned this reward)
  source_id uuid, -- Could reference survey_id, profiling_survey_id, etc.
  source_type text,
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at timestamp with time zone,
  payment_method text,
  payment_reference text
);

CREATE INDEX idx_panelist_rewards_user ON panelist_rewards(panelist_id);
CREATE INDEX idx_panelist_rewards_status ON panelist_rewards(status);
CREATE INDEX idx_panelist_rewards_type ON panelist_rewards(reward_type);

-- 5. MODIFY EXISTING COUNTRY TABLE
-- Add languages support for country-based language dropdown
ALTER TABLE country ADD COLUMN IF NOT EXISTS languages jsonb;

-- Update some sample countries with language data
UPDATE country SET languages = '["en"]'::jsonb WHERE name = 'United States';
UPDATE country SET languages = '["en", "fr"]'::jsonb WHERE name = 'Canada';
UPDATE country SET languages = '["en"]'::jsonb WHERE name = 'United Kingdom';
UPDATE country SET languages = '["en"]'::jsonb WHERE name = 'Australia';
UPDATE country SET languages = '["es"]'::jsonb WHERE name = 'Spain';
UPDATE country SET languages = '["es"]'::jsonb WHERE name = 'Mexico';
UPDATE country SET languages = '["fr"]'::jsonb WHERE name = 'France';
UPDATE country SET languages = '["de"]'::jsonb WHERE name = 'Germany';

-- 6. CREATE SURVEY ASSIGNMENTS TABLE
-- Link available surveys to qualified panelists
CREATE TABLE public.survey_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Relationships
  panelist_id uuid NOT NULL REFERENCES panelists(id) ON DELETE CASCADE,
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  
  -- Assignment Details
  assigned_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  
  -- Status Tracking
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'started', 'completed', 'disqualified', 'expired')),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  
  -- Prevent duplicate assignments
  UNIQUE(panelist_id, survey_id)
);

CREATE INDEX idx_survey_assignments_panelist ON survey_assignments(panelist_id);
CREATE INDEX idx_survey_assignments_survey ON survey_assignments(survey_id);
CREATE INDEX idx_survey_assignments_status ON survey_assignments(status);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE panelists ENABLE ROW LEVEL SECURITY;
ALTER TABLE panelist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE panelist_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_assignments ENABLE ROW LEVEL SECURITY;

-- PANELISTS TABLE POLICIES
-- Allow users to access and update only their own record
CREATE POLICY "Panelist can access own record" ON panelists
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role to manage all panelist records (for admin functions)
CREATE POLICY "Service role can manage panelists" ON panelists
  FOR ALL USING (auth.role() = 'service_role');

-- PANELIST_PROFILES TABLE POLICIES  
-- Allow users to access their own profile data
CREATE POLICY "Panelist can access own profiles" ON panelist_profiles
  FOR ALL USING (auth.uid() = panelist_id)
  WITH CHECK (auth.uid() = panelist_id);

-- Allow service role full access (for admin functions)
CREATE POLICY "Service role can manage profiles" ON panelist_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- PANELIST_REWARDS TABLE POLICIES
-- Allow users to view their own rewards
CREATE POLICY "Panelist can view own rewards" ON panelist_rewards
  FOR SELECT USING (auth.uid() = panelist_id);

-- Allow service role to manage rewards (for admin functions)
CREATE POLICY "Service role can manage rewards" ON panelist_rewards
  FOR ALL USING (auth.role() = 'service_role');

-- SURVEY_ASSIGNMENTS TABLE POLICIES
-- Allow users to view and update their own survey assignments
CREATE POLICY "Panelist can access own assignments" ON survey_assignments
  FOR ALL USING (auth.uid() = panelist_id)
  WITH CHECK (auth.uid() = panelist_id);

-- Allow service role to manage assignments (for admin functions)
CREATE POLICY "Service role can manage assignments" ON survey_assignments
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- SEED DATA - PROFILING SURVEYS
-- =====================================================

-- Insert initial profiling surveys that users can complete
INSERT INTO profiling_surveys (name, description, reward_amount, estimated_duration_minutes, questions) VALUES 

('Foundational Profile', 
 'Basic demographic and lifestyle information to improve survey matching',
 5.00,
 8,
 '{
   "sections": [
     {
       "title": "Demographics",
       "questions": [
         {"id": 1, "type": "single_select", "text": "What is your age range?", "options": ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]},
         {"id": 2, "type": "single_select", "text": "What is your employment status?", "options": ["Full-time employed", "Part-time employed", "Self-employed", "Unemployed", "Student", "Retired"]},
         {"id": 3, "type": "single_select", "text": "What is your annual household income?", "options": ["Under $25K", "$25K-$50K", "$50K-$75K", "$75K-$100K", "$100K-$150K", "Over $150K"]}
       ]
     }
   ]
 }'::jsonb),

('Behavioral Profile',
 'Shopping habits, brand preferences, and purchase decision factors',
 3.00,
 6,
 '{
   "sections": [
     {
       "title": "Shopping Behavior", 
       "questions": [
         {"id": 1, "type": "multi_select", "text": "How do you typically shop?", "options": ["Online", "In-store", "Mobile app", "Social media", "Catalog"]},
         {"id": 2, "type": "single_select", "text": "What influences your purchase decisions most?", "options": ["Price", "Quality", "Brand reputation", "Reviews", "Recommendations"]}
       ]
     }
   ]
 }'::jsonb),

('Lifestyle Profile',
 'Daily activities, interests, and media consumption habits',
 4.00,
 7,
 '{
   "sections": [
     {
       "title": "Interests & Activities",
       "questions": [
         {"id": 1, "type": "multi_select", "text": "What are your main interests?", "options": ["Sports", "Technology", "Travel", "Cooking", "Music", "Reading", "Gaming", "Fashion"]},
         {"id": 2, "type": "single_select", "text": "How many hours per day do you spend on social media?", "options": ["Less than 1 hour", "1-2 hours", "2-4 hours", "4+ hours"]}
       ]
     }
   ]
 }'::jsonb),

('Tech Savviness Profile',
 'Technology usage patterns and digital device preferences',
 2.50,
 5,
 '{
   "sections": [
     {
       "title": "Technology Usage",
       "questions": [
         {"id": 1, "type": "multi_select", "text": "Which devices do you use regularly?", "options": ["Smartphone", "Laptop", "Desktop", "Tablet", "Smart TV", "Gaming console"]},
         {"id": 2, "type": "single_select", "text": "How would you rate your tech savviness?", "options": ["Beginner", "Intermediate", "Advanced", "Expert"]}
       ]
     }
   ]
 }'::jsonb),

('Media Consumption Profile',
 'Entertainment preferences and content consumption habits',
 3.50,
 6,
 '{
   "sections": [
     {
       "title": "Entertainment & Media",
       "questions": [
         {"id": 1, "type": "multi_select", "text": "Which streaming services do you use?", "options": ["Netflix", "Amazon Prime", "Disney+", "Hulu", "HBO Max", "Apple TV+", "YouTube Premium"]},
         {"id": 2, "type": "single_select", "text": "How do you primarily discover new content?", "options": ["Platform recommendations", "Social media", "Friends/family", "Reviews", "Trending lists"]}
       ]
     }
   ]
 }'::jsonb);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_panelists_updated_at 
  BEFORE UPDATE ON panelists 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_profiling_surveys_updated_at 
  BEFORE UPDATE ON profiling_surveys 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to calculate panelist reward balance
CREATE OR REPLACE FUNCTION get_panelist_balance(panelist_uuid uuid)
RETURNS decimal(10,2) AS $$
  SELECT COALESCE(SUM(amount), 0.00)
  FROM panelist_rewards 
  WHERE panelist_id = panelist_uuid 
  AND status IN ('approved', 'paid');
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to get available surveys for a panelist based on their profile
CREATE OR REPLACE FUNCTION get_available_surveys_for_panelist(panelist_uuid uuid)
RETURNS TABLE(survey_id uuid, title text, description text, reward_amount decimal, estimated_duration integer) AS $$
BEGIN
  -- This is a placeholder function that would contain complex matching logic
  -- based on the panelist's profile data and survey targeting criteria
  RETURN QUERY
  SELECT s.id, s.title, s.audience_description, 10.00::decimal(10,2), 15
  FROM surveys s
  WHERE s.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM survey_assignments sa 
    WHERE sa.panelist_id = panelist_uuid 
    AND sa.survey_id = s.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant permissions on new tables
GRANT ALL ON panelists TO service_role;
GRANT ALL ON profiling_surveys TO service_role;
GRANT ALL ON panelist_profiles TO service_role;  
GRANT ALL ON panelist_rewards TO service_role;
GRANT ALL ON survey_assignments TO service_role;

GRANT SELECT, INSERT, UPDATE ON panelists TO authenticated;
GRANT SELECT ON profiling_surveys TO authenticated;
GRANT SELECT, INSERT, UPDATE ON panelist_profiles TO authenticated;
GRANT SELECT ON panelist_rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON survey_assignments TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Uncomment these to verify the setup after running the script:

-- SELECT 'Panelists table created' as status, count(*) as rows FROM panelists;
-- SELECT 'Profiling surveys created' as status, count(*) as rows FROM profiling_surveys;
-- SELECT 'All RLS policies created' as status, count(*) as policies 
--   FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'panelist%';

-- =====================================================
-- NOTES FOR IMPLEMENTATION
-- =====================================================

/*
NEXT STEPS FOR FRONTEND INTEGRATION:

1. AUTHENTICATION:
   - Implement Supabase Auth with custom claims
   - Create auth helpers for panelist sessions
   - Set up protected routes for dashboard

2. SURVEY MATCHING:
   - Build algorithm to match panelists to surveys based on:
     * Completed profiling data  
     * Survey targeting criteria
     * Geographic requirements
     * Demographic filters

3. REWARD SYSTEM:
   - Implement automatic reward creation on survey completion
   - Build payout processing (PayPal, gift cards, bank transfer)
   - Create reward dashboard and history tracking

4. ADMIN PANEL INTEGRATION:
   - Add "Panel" section to existing Matrix admin
   - Build panelist management interface
   - Create profiling survey builder
   - Implement reporting and analytics

5. API ENDPOINTS NEEDED:
   - /api/auth/register-panelist
   - /api/auth/login-panelist
   - /api/profile/complete-survey
   - /api/surveys/available
   - /api/rewards/balance
   - /api/rewards/request-payout

6. MOBILE OPTIMIZATION:
   - Implement Face ID/Touch ID login
   - Optimize survey forms for mobile
   - Add push notifications for new surveys
   - Progressive Web App (PWA) capabilities
*/

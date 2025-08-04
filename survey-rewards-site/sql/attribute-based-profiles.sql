-- =====================================================
-- ATTRIBUTE-BASED PROFILING SYSTEM
-- This is separate from the existing profiling_surveys system
-- Uses demoattributes, geoattributes, psychoattributes tables
-- =====================================================

-- 1. CREATE ATTRIBUTE_PROFILES TABLE
-- Stores the three main profile types based on attribute tables
CREATE TABLE IF NOT EXISTS public.attribute_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Profile Information
  profile_type text NOT NULL CHECK (profile_type IN ('basic', 'location', 'personal')),
  profile_name text NOT NULL, -- 'Basic Profile', 'Location Profile', 'Personal Profile'
  description text,
  reward_amount decimal(10,2) DEFAULT 2.50,
  estimated_duration_minutes integer DEFAULT 5,
  
  -- Mapping to attribute tables
  attribute_table text NOT NULL CHECK (attribute_table IN ('demoattributes', 'geoattributes', 'psychoattributes')),
  
  -- Status
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0
);

-- 2. CREATE PANELIST_ATTRIBUTE_RESPONSES TABLE
-- Stores panelist responses to attribute-based questions
CREATE TABLE IF NOT EXISTS public.panelist_attribute_responses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Relationships
  panelist_id uuid NOT NULL REFERENCES panelists(id) ON DELETE CASCADE,
  attribute_profile_id uuid NOT NULL REFERENCES attribute_profiles(id),
  
  -- Response Data - stores all answers for this profile type
  responses jsonb NOT NULL, -- {"age_range": "25-34", "income": "$50K-75K", ...}
  
  -- Completion tracking
  completed_at timestamp with time zone DEFAULT now(),
  completion_time_seconds integer,
  
  -- Prevent duplicate completions
  UNIQUE(panelist_id, attribute_profile_id)
);

-- 3. INSERT THE THREE MAIN PROFILE TYPES
INSERT INTO attribute_profiles (profile_type, profile_name, description, attribute_table, reward_amount, sort_order) VALUES
('basic', 'Basic Profile', 'Tell us about your demographics to get better survey matches', 'demoattributes', 3.00, 1),
('location', 'Location Profile', 'Help us understand your geographic preferences and lifestyle', 'geoattributes', 2.50, 2),
('personal', 'Personal Profile', 'Share your interests and personality traits for personalized surveys', 'psychoattributes', 4.00, 3)
ON CONFLICT DO NOTHING;

-- 4. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_attribute_profiles_type ON attribute_profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_attribute_profiles_active ON attribute_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_panelist_attr_responses_panelist ON panelist_attribute_responses(panelist_id);
CREATE INDEX IF NOT EXISTS idx_panelist_attr_responses_profile ON panelist_attribute_responses(attribute_profile_id);

-- 5. ENABLE RLS
ALTER TABLE attribute_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE panelist_attribute_responses ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES
-- Profile policies (read-only for users)
CREATE POLICY "Anyone can read active attribute profiles" ON attribute_profiles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage attribute profiles" ON attribute_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Response policies
CREATE POLICY "Panelists can manage own attribute responses" ON panelist_attribute_responses
  FOR ALL USING (auth.uid() = panelist_id) WITH CHECK (auth.uid() = panelist_id);

CREATE POLICY "Service role can manage attribute responses" ON panelist_attribute_responses
  FOR ALL USING (auth.role() = 'service_role');

-- 7. GRANT PERMISSIONS
GRANT SELECT ON attribute_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON panelist_attribute_responses TO authenticated;
GRANT ALL ON attribute_profiles TO service_role;
GRANT ALL ON panelist_attribute_responses TO service_role;

-- 8. CREATE HELPER FUNCTION TO GET AVAILABLE PROFILES FOR PANELIST
CREATE OR REPLACE FUNCTION get_available_attribute_profiles_for_panelist(panelist_uuid uuid, user_country_id uuid)
RETURNS TABLE(
  profile_id uuid,
  profile_type text,
  profile_name text,
  description text,
  reward_amount decimal,
  estimated_duration_minutes integer,
  is_completed boolean,
  question_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id as profile_id,
    ap.profile_type,
    ap.profile_name,
    ap.description,
    ap.reward_amount,
    ap.estimated_duration_minutes,
    (par.id IS NOT NULL) as is_completed,
    (
      CASE ap.attribute_table
        WHEN 'demoattributes' THEN (
          SELECT COUNT(DISTINCT field_name) 
          FROM demoattributes 
          WHERE country_id = user_country_id
        )
        WHEN 'geoattributes' THEN (
          SELECT COUNT(DISTINCT field_name) 
          FROM geoattributes 
          WHERE country_id = user_country_id
        )
        WHEN 'psychoattributes' THEN (
          SELECT COUNT(DISTINCT field_name) 
          FROM psychoattributes 
          WHERE country_id = user_country_id
        )
        ELSE 0
      END
    ) as question_count
  FROM attribute_profiles ap
  LEFT JOIN panelist_attribute_responses par ON ap.id = par.attribute_profile_id AND par.panelist_id = panelist_uuid
  WHERE ap.is_active = true
  ORDER BY ap.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. CREATE FUNCTION TO GET QUESTIONS FOR A SPECIFIC PROFILE TYPE
CREATE OR REPLACE FUNCTION get_attribute_questions_for_profile(profile_type_param text, user_country_id uuid)
RETURNS TABLE(
  field_name text,
  question_text text,
  question_type text,
  options text[]
) AS $$
DECLARE
  table_name text;
BEGIN
  -- Determine which table to query based on profile type
  SELECT attribute_table INTO table_name 
  FROM attribute_profiles 
  WHERE profile_type = profile_type_param AND is_active = true 
  LIMIT 1;
  
  IF table_name IS NULL THEN
    RETURN;
  END IF;
  
  -- Dynamic query based on table name
  IF table_name = 'demoattributes' THEN
    RETURN QUERY
    SELECT 
      d.field_name,
      COALESCE(d.questiontext, d.field_name) as question_text,
      COALESCE(d.question_type, 'single_select_radio') as question_type,
      array_agg(DISTINCT d.value ORDER BY d.value) as options
    FROM demoattributes d
    WHERE d.country_id = user_country_id
    GROUP BY d.field_name, d.questiontext, d.question_type
    ORDER BY d.field_name;
    
  ELSIF table_name = 'geoattributes' THEN
    RETURN QUERY
    SELECT 
      g.field_name,
      COALESCE(g.questiontext, g.field_name) as question_text,
      COALESCE(g.question_type, 'single_select_radio') as question_type,
      array_agg(DISTINCT g.value ORDER BY g.value) as options
    FROM geoattributes g
    WHERE g.country_id = user_country_id
    GROUP BY g.field_name, g.questiontext, g.question_type
    ORDER BY g.field_name;
    
  ELSIF table_name = 'psychoattributes' THEN
    RETURN QUERY
    SELECT 
      p.field_name,
      COALESCE(p.questiontext, p.field_name) as question_text,
      COALESCE(p.question_type, 'single_select_radio') as question_type,
      array_agg(DISTINCT p.value ORDER BY p.value) as options
    FROM psychoattributes p
    WHERE p.country_id = user_country_id
    GROUP BY p.field_name, p.questiontext, p.question_type
    ORDER BY p.field_name;
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. CREATE VIEW FOR PANELIST PROFILE COMPLETION STATUS
CREATE OR REPLACE VIEW panelist_attribute_profile_status AS
SELECT 
  p.id as panelist_id,
  p.first_name,
  p.last_name,
  p.country_id,
  
  -- Basic Profile Status
  (SELECT par.completed_at FROM panelist_attribute_responses par 
   JOIN attribute_profiles ap ON par.attribute_profile_id = ap.id 
   WHERE par.panelist_id = p.id AND ap.profile_type = 'basic') as basic_completed_at,
  
  -- Location Profile Status  
  (SELECT par.completed_at FROM panelist_attribute_responses par 
   JOIN attribute_profiles ap ON par.attribute_profile_id = ap.id 
   WHERE par.panelist_id = p.id AND ap.profile_type = 'location') as location_completed_at,
   
  -- Personal Profile Status
  (SELECT par.completed_at FROM panelist_attribute_responses par 
   JOIN attribute_profiles ap ON par.attribute_profile_id = ap.id 
   WHERE par.panelist_id = p.id AND ap.profile_type = 'personal') as personal_completed_at,
   
  -- Overall completion count
  (SELECT COUNT(*) FROM panelist_attribute_responses par 
   JOIN attribute_profiles ap ON par.attribute_profile_id = ap.id 
   WHERE par.panelist_id = p.id) as profiles_completed,
   
  -- Total reward earned from attribute profiles
  (SELECT COALESCE(SUM(ap.reward_amount), 0) FROM panelist_attribute_responses par 
   JOIN attribute_profiles ap ON par.attribute_profile_id = ap.id 
   WHERE par.panelist_id = p.id) as total_profile_rewards
   
FROM panelists p;

-- Grant permissions on view
GRANT SELECT ON panelist_attribute_profile_status TO authenticated;
GRANT SELECT ON panelist_attribute_profile_status TO service_role;

-- =====================================================
-- USAGE EXAMPLES & TESTING
-- =====================================================

/*
-- STEP 1: Find real country UUIDs from your data
SELECT DISTINCT country_id, 
  (SELECT country_name FROM country WHERE id = demoattributes.country_id) as country_name
FROM demoattributes;

-- STEP 2: Test with US country ID (from your CSV data)
-- US Country ID: a2b5820b-9ea7-4024-aa37-29aeae64dcfc
-- UK Country ID: 6f157020-0d0f-4713-a106-f33139d53dc3

-- Get questions for Basic Profile (US users)
SELECT * FROM get_attribute_questions_for_profile(
  'basic', 
  'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'::uuid
);

-- Get questions for Location Profile (US users)
SELECT * FROM get_attribute_questions_for_profile(
  'location', 
  'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'::uuid
);

-- Get questions for Basic Profile (UK users)
SELECT * FROM get_attribute_questions_for_profile(
  'basic', 
  '6f157020-0d0f-4713-a106-f33139d53dc3'::uuid
);

-- STEP 3: Create a test panelist (optional)
INSERT INTO panelists (first_name, last_name, email, country_id, password_hash)
VALUES ('Test', 'User', 'test@example.com', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'dummy-hash')
RETURNING id;

-- STEP 4: Test available profiles for a panelist (use real panelist UUID)
-- Replace 'your-panelist-uuid-here' with actual UUID from panelists table
/*
SELECT * FROM get_available_attribute_profiles_for_panelist(
  'your-panelist-uuid-here'::uuid, 
  'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'::uuid
);
*/

-- STEP 5: Check all existing panelists and their profile completion status
SELECT * FROM panelist_attribute_profile_status;

-- STEP 6: Example of submitting a completed profile (use real UUIDs)
/*
INSERT INTO panelist_attribute_responses (panelist_id, attribute_profile_id, responses)
VALUES (
  'your-panelist-uuid'::uuid, 
  (SELECT id FROM attribute_profiles WHERE profile_type = 'basic')::uuid, 
  '{"Age Range": "25-34", "Gender": "Male", "Employment Status": "Full-time"}'::jsonb
);
*/

-- QUICK TEST QUERIES TO RUN FIRST:
-- 1. Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('attribute_profiles', 'panelist_attribute_responses');

-- 2. Check profile types were inserted
SELECT * FROM attribute_profiles;

-- 3. Count questions by country and type
SELECT 
  'US Demographics' as profile_type,
  COUNT(DISTINCT field_name) as question_count
FROM demoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
UNION ALL
SELECT 
  'US Geographic' as profile_type,
  COUNT(DISTINCT field_name) as question_count
FROM geoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
UNION ALL
SELECT 
  'UK Demographics' as profile_type,
  COUNT(DISTINCT field_name) as question_count
FROM demoattributes 
WHERE country_id = '6f157020-0d0f-4713-a106-f33139d53dc3';
*/

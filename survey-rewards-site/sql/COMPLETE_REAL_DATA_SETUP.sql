-- COMPLETE SETUP: Database fix + Real attribute data functions
-- Run this ENTIRE file in your Supabase SQL editor to:
-- 1. Fix the attribute profile saving issue
-- 2. Connect to your REAL demoattributes, geoattributes, psychoattributes data

-- Enable UUID extension for generating proper UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PART 1: Fix the database schema for attribute profiles
-- ============================================================================

-- Step 1: Add the survey_type column (if not already added)
ALTER TABLE public.panelist_profiles 
ADD COLUMN IF NOT EXISTS survey_type VARCHAR(50) DEFAULT 'profiling_survey';

-- Step 2: Remove the foreign key constraint that's causing the issue
ALTER TABLE public.panelist_profiles 
DROP CONSTRAINT IF EXISTS panelist_profiles_profiling_survey_id_fkey;

-- Step 3: Update existing records to have the default survey_type
UPDATE public.panelist_profiles 
SET survey_type = 'profiling_survey' 
WHERE survey_type IS NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN public.panelist_profiles.survey_type IS 'Type of survey: profiling_survey (default) or attribute_profile';
COMMENT ON COLUMN public.panelist_profiles.profiling_survey_id IS 'Can be either a profiling_survey ID or an attribute_profile ID, depending on survey_type';

-- Step 5: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_panelist_profiles_survey_type ON public.panelist_profiles(survey_type);
CREATE INDEX IF NOT EXISTS idx_panelist_profiles_panelist_survey ON public.panelist_profiles(panelist_id, profiling_survey_id);

-- ============================================================================
-- PART 2: Create functions to use your REAL attribute data
-- ============================================================================

-- Drop existing functions if they exist (to handle return type changes)
DROP FUNCTION IF EXISTS get_available_attribute_profiles_for_panelist(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_attribute_questions_for_profile(TEXT, UUID) CASCADE;

-- Function to get available attribute profiles for a panelist
CREATE OR REPLACE FUNCTION get_available_attribute_profiles_for_panelist(
    panelist_uuid UUID,
    user_country_id UUID
)
RETURNS TABLE (
    profile_id TEXT,
    profile_type TEXT,
    profile_name TEXT,
    description TEXT,
    reward_amount DECIMAL,
    estimated_duration_minutes INTEGER,
    is_completed BOOLEAN,
    question_count INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
    demo_profile_uuid UUID;
    geo_profile_uuid UUID;
    psycho_profile_uuid UUID;
BEGIN
    -- Generate deterministic UUIDs based on country and profile type
    -- This ensures the same UUID is generated each time for the same country/type
    demo_profile_uuid := uuid_generate_v5(uuid_ns_oid(), 'demo-' || user_country_id::TEXT);
    geo_profile_uuid := uuid_generate_v5(uuid_ns_oid(), 'geo-' || user_country_id::TEXT);
    psycho_profile_uuid := uuid_generate_v5(uuid_ns_oid(), 'psycho-' || user_country_id::TEXT);

    RETURN QUERY
    SELECT 
        demo_profile_uuid::TEXT as profile_id,
        'basic'::TEXT as profile_type,
        'Basic Demographics Profile'::TEXT as profile_name,
        'Tell us about your demographics to get better survey matches'::TEXT as description,
        3.00::DECIMAL as reward_amount,
        5::INTEGER as estimated_duration_minutes,
        EXISTS(
            SELECT 1 FROM panelist_profiles pp 
            WHERE pp.panelist_id::TEXT = panelist_uuid::TEXT 
            AND pp.profiling_survey_id = demo_profile_uuid::TEXT
            AND pp.survey_type = 'attribute_profile'
        ) as is_completed,
        (SELECT COUNT(DISTINCT da.questiontext)::INTEGER FROM demoattributes da WHERE da.country_id = user_country_id) as question_count
    
    UNION ALL
    
    SELECT 
        geo_profile_uuid::TEXT as profile_id,
        'location'::TEXT as profile_type,
        'Geographic Profile'::TEXT as profile_name,
        'Help us understand your geographic preferences and lifestyle'::TEXT as description,
        2.50::DECIMAL as reward_amount,
        4::INTEGER as estimated_duration_minutes,
        EXISTS(
            SELECT 1 FROM panelist_profiles pp 
            WHERE pp.panelist_id::TEXT = panelist_uuid::TEXT 
            AND pp.profiling_survey_id = geo_profile_uuid::TEXT
            AND pp.survey_type = 'attribute_profile'
        ) as is_completed,
        (SELECT COUNT(DISTINCT ga.questiontext)::INTEGER FROM geoattributes ga WHERE ga.country_id = user_country_id) as question_count
    
    UNION ALL
    
    SELECT 
        psycho_profile_uuid::TEXT as profile_id,
        'personal'::TEXT as profile_type,
        'Personal Interests Profile'::TEXT as profile_name,
        'Share your interests and personality traits for personalized surveys'::TEXT as description,
        4.00::DECIMAL as reward_amount,
        7::INTEGER as estimated_duration_minutes,
        EXISTS(
            SELECT 1 FROM panelist_profiles pp 
            WHERE pp.panelist_id::TEXT = panelist_uuid::TEXT 
            AND pp.profiling_survey_id = psycho_profile_uuid::TEXT
            AND pp.survey_type = 'attribute_profile'
        ) as is_completed,
        (SELECT COUNT(DISTINCT pa.questiontext)::INTEGER FROM psychoattributes pa WHERE pa.country_id = user_country_id) as question_count;
END;
$$;

-- Function to get actual questions for each profile type
CREATE OR REPLACE FUNCTION get_attribute_questions_for_profile(
    profile_type_param TEXT,
    user_country_id UUID
)
RETURNS TABLE (
    question_text TEXT,
    question_type TEXT,
    options TEXT[]
) 
LANGUAGE plpgsql
AS $$
BEGIN
    IF profile_type_param = 'basic' THEN
        -- Return demographics questions from demoattributes table
        -- Group by question text and collect all answer options
        RETURN QUERY
        SELECT 
            da.questiontext::TEXT as question_text,
            CASE 
                WHEN da.question_type = 'single_select_radio' THEN 'single_select_radio'
                WHEN da.question_type = 'multiple_select' THEN 'multiple_select'
                WHEN da.question_type = 'user_input' THEN 'user_input'
                ELSE 'single_select_radio'
            END::TEXT as question_type,
            array_agg(da.value ORDER BY da.value) as options
        FROM demoattributes da 
        WHERE da.country_id = user_country_id
        GROUP BY da.questiontext, da.question_type
        ORDER BY MIN(da.id);
        
    ELSIF profile_type_param = 'location' THEN
        -- Return geographic questions from geoattributes table
        -- Group by question text and collect all answer options
        RETURN QUERY
        SELECT 
            ga.questiontext::TEXT as question_text,
            CASE 
                WHEN ga.question_type = 'single_select_radio' THEN 'single_select_radio'
                WHEN ga.question_type = 'multiple_select' THEN 'multiple_select'
                WHEN ga.question_type = 'user_input' THEN 'user_input'
                ELSE 'single_select_radio'
            END::TEXT as question_type,
            array_agg(ga.value ORDER BY ga.value) as options
        FROM geoattributes ga 
        WHERE ga.country_id = user_country_id
        GROUP BY ga.questiontext, ga.question_type
        ORDER BY MIN(ga.id);
        
    ELSIF profile_type_param = 'personal' THEN
        -- Return psychographic questions from psychoattributes table
        -- Group by question text and collect all answer options
        RETURN QUERY
        SELECT 
            pa.questiontext::TEXT as question_text,
            CASE 
                WHEN pa.question_type = 'single_select_radio' THEN 'single_select_radio'
                WHEN pa.question_type = 'multiple_select' THEN 'multiple_select'
                WHEN pa.question_type = 'user_input' THEN 'user_input'
                ELSE 'single_select_radio'
            END::TEXT as question_type,
            array_agg(pa.value ORDER BY pa.value) as options
        FROM psychoattributes pa 
        WHERE pa.country_id = user_country_id
        GROUP BY pa.questiontext, pa.question_type
        ORDER BY MIN(pa.id);
    END IF;
END;
$$;

-- ============================================================================
-- VERIFICATION: Check if your attribute tables have data
-- ============================================================================

-- Check demoattributes
SELECT 'demoattributes' as table_name, country_id, COUNT(DISTINCT questiontext) as question_count 
FROM demoattributes 
GROUP BY country_id;

-- Check geoattributes  
SELECT 'geoattributes' as table_name, country_id, COUNT(DISTINCT questiontext) as question_count 
FROM geoattributes 
GROUP BY country_id;

-- Check psychoattributes
SELECT 'psychoattributes' as table_name, country_id, COUNT(DISTINCT questiontext) as question_count 
FROM psychoattributes 
GROUP BY country_id;

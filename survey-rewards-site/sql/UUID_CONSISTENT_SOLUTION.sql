-- Clean solution using UUID consistently throughout

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop and recreate the function with UUID consistency
DROP FUNCTION IF EXISTS get_available_attribute_profiles_for_panelist(UUID, UUID) CASCADE;

-- Function to get available attribute profiles for a panelist
CREATE OR REPLACE FUNCTION get_available_attribute_profiles_for_panelist(
    panelist_uuid UUID,
    user_country_id UUID
)
RETURNS TABLE (
    profile_id UUID,
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
    demo_profile_uuid := uuid_generate_v5(uuid_ns_oid(), 'demo-' || user_country_id::TEXT);
    geo_profile_uuid := uuid_generate_v5(uuid_ns_oid(), 'geo-' || user_country_id::TEXT);
    psycho_profile_uuid := uuid_generate_v5(uuid_ns_oid(), 'psycho-' || user_country_id::TEXT);

    RETURN QUERY
    SELECT 
        demo_profile_uuid as profile_id,
        'basic'::TEXT as profile_type,
        'Basic Demographics Profile'::TEXT as profile_name,
        'Tell us about your demographics to get better survey matches'::TEXT as description,
        3.00::DECIMAL as reward_amount,
        5::INTEGER as estimated_duration_minutes,
        EXISTS(
            SELECT 1 FROM panelist_profiles pp 
            WHERE pp.panelist_id = panelist_uuid 
            AND pp.profiling_survey_id = demo_profile_uuid::TEXT
            AND pp.survey_type = 'attribute_profile'
        ) as is_completed,
        COALESCE((SELECT COUNT(DISTINCT da.questiontext)::INTEGER FROM demoattributes da WHERE da.country_id = user_country_id), 0) as question_count
    
    UNION ALL
    
    SELECT 
        geo_profile_uuid as profile_id,
        'location'::TEXT as profile_type,
        'Geographic Profile'::TEXT as profile_name,
        'Help us understand your geographic preferences and lifestyle'::TEXT as description,
        2.50::DECIMAL as reward_amount,
        4::INTEGER as estimated_duration_minutes,
        EXISTS(
            SELECT 1 FROM panelist_profiles pp 
            WHERE pp.panelist_id = panelist_uuid 
            AND pp.profiling_survey_id = geo_profile_uuid::TEXT
            AND pp.survey_type = 'attribute_profile'
        ) as is_completed,
        COALESCE((SELECT COUNT(DISTINCT ga.questiontext)::INTEGER FROM geoattributes ga WHERE ga.country_id = user_country_id), 0) as question_count
    
    UNION ALL
    
    SELECT 
        psycho_profile_uuid as profile_id,
        'personal'::TEXT as profile_type,
        'Personal Interests Profile'::TEXT as profile_name,
        'Share your interests and personality traits for personalized surveys'::TEXT as description,
        4.00::DECIMAL as reward_amount,
        7::INTEGER as estimated_duration_minutes,
        EXISTS(
            SELECT 1 FROM panelist_profiles pp 
            WHERE pp.panelist_id = panelist_uuid 
            AND pp.profiling_survey_id = psycho_profile_uuid::TEXT
            AND pp.survey_type = 'attribute_profile'
        ) as is_completed,
        COALESCE((SELECT COUNT(DISTINCT pa.questiontext)::INTEGER FROM psychoattributes pa WHERE pa.country_id = user_country_id), 0) as question_count;
END;
$$;

-- Test the function
SELECT * FROM get_available_attribute_profiles_for_panelist(
    'a1b2c3d4-e5f6-7890-abcd-123456789012'::UUID,
    'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'::UUID
);

-- Also create the questions function with UUID consistency
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
        RETURN QUERY
        SELECT 
            da.questiontext::TEXT as question_text,
            COALESCE(da.question_type, 'single_select_radio')::TEXT as question_type,
            array_agg(da.value ORDER BY da.value) as options
        FROM demoattributes da 
        WHERE da.country_id = user_country_id
        GROUP BY da.questiontext, da.question_type
        ORDER BY MIN(da.id);
        
    ELSIF profile_type_param = 'location' THEN
        RETURN QUERY
        SELECT 
            ga.questiontext::TEXT as question_text,
            COALESCE(ga.question_type, 'single_select_radio')::TEXT as question_type,
            array_agg(ga.value ORDER BY ga.value) as options
        FROM geoattributes ga 
        WHERE ga.country_id = user_country_id
        GROUP BY ga.questiontext, ga.question_type
        ORDER BY MIN(ga.id);
        
    ELSIF profile_type_param = 'personal' THEN
        RETURN QUERY
        SELECT 
            pa.questiontext::TEXT as question_text,
            COALESCE(pa.question_type, 'single_select_radio')::TEXT as question_type,
            array_agg(pa.value ORDER BY pa.value) as options
        FROM psychoattributes pa 
        WHERE pa.country_id = user_country_id
        GROUP BY pa.questiontext, pa.question_type
        ORDER BY MIN(pa.id);
    END IF;
END;
$$;

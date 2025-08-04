-- Create database functions to use your REAL attribute data
-- This replaces the mock data with actual questions from your tables

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
BEGIN
    RETURN QUERY
    SELECT 
        'demo-profile-' || user_country_id::TEXT as profile_id,
        'basic'::TEXT as profile_type,
        'Basic Demographics Profile'::TEXT as profile_name,
        'Tell us about your demographics to get better survey matches'::TEXT as description,
        3.00::DECIMAL as reward_amount,
        5::INTEGER as estimated_duration_minutes,
        EXISTS(
            SELECT 1 FROM panelist_profiles pp 
            WHERE pp.panelist_id = panelist_uuid 
            AND pp.profiling_survey_id = 'demo-profile-' || user_country_id::TEXT
            AND pp.survey_type = 'attribute_profile'
        ) as is_completed,
        (SELECT COUNT(*)::INTEGER FROM demoattributes WHERE country_id = user_country_id) as question_count
    
    UNION ALL
    
    SELECT 
        'geo-profile-' || user_country_id::TEXT as profile_id,
        'location'::TEXT as profile_type,
        'Geographic Profile'::TEXT as profile_name,
        'Help us understand your geographic preferences and lifestyle'::TEXT as description,
        2.50::DECIMAL as reward_amount,
        4::INTEGER as estimated_duration_minutes,
        EXISTS(
            SELECT 1 FROM panelist_profiles pp 
            WHERE pp.panelist_id = panelist_uuid 
            AND pp.profiling_survey_id = 'geo-profile-' || user_country_id::TEXT
            AND pp.survey_type = 'attribute_profile'
        ) as is_completed,
        (SELECT COUNT(*)::INTEGER FROM geoattributes WHERE country_id = user_country_id) as question_count
    
    UNION ALL
    
    SELECT 
        'psycho-profile-' || user_country_id::TEXT as profile_id,
        'personal'::TEXT as profile_type,
        'Personal Interests Profile'::TEXT as profile_name,
        'Share your interests and personality traits for personalized surveys'::TEXT as description,
        4.00::DECIMAL as reward_amount,
        7::INTEGER as estimated_duration_minutes,
        EXISTS(
            SELECT 1 FROM panelist_profiles pp 
            WHERE pp.panelist_id = panelist_uuid 
            AND pp.profiling_survey_id = 'psycho-profile-' || user_country_id::TEXT
            AND pp.survey_type = 'attribute_profile'
        ) as is_completed,
        (SELECT COUNT(*)::INTEGER FROM psychoattributes WHERE country_id = user_country_id) as question_count;
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
        -- Return demographics questions
        RETURN QUERY
        SELECT 
            da.question_text::TEXT,
            CASE 
                WHEN da.questiontype = 'single_select' THEN 'single_select_radio'
                WHEN da.questiontype = 'multiple_select' THEN 'multiple_select'
                WHEN da.questiontype = 'text_input' THEN 'user_input'
                ELSE 'single_select_radio'
            END::TEXT as question_type,
            string_to_array(da.answer_option, '|') as options
        FROM demoattributes da 
        WHERE da.country_id = user_country_id
        ORDER BY da.id;
        
    ELSIF profile_type_param = 'location' THEN
        -- Return geographic questions
        RETURN QUERY
        SELECT 
            ga.question_text::TEXT,
            CASE 
                WHEN ga.questiontype = 'single_select' THEN 'single_select_radio'
                WHEN ga.questiontype = 'multiple_select' THEN 'multiple_select'
                WHEN ga.questiontype = 'text_input' THEN 'user_input'
                ELSE 'single_select_radio'
            END::TEXT as question_type,
            string_to_array(ga.answer_option, '|') as options
        FROM geoattributes ga 
        WHERE ga.country_id = user_country_id
        ORDER BY ga.id;
        
    ELSIF profile_type_param = 'personal' THEN
        -- Return psychographic questions
        RETURN QUERY
        SELECT 
            pa.question_text::TEXT,
            CASE 
                WHEN pa.questiontype = 'single_select' THEN 'single_select_radio'
                WHEN pa.questiontype = 'multiple_select' THEN 'multiple_select'
                WHEN pa.questiontype = 'text_input' THEN 'user_input'
                ELSE 'single_select_radio'
            END::TEXT as question_type,
            string_to_array(pa.answer_option, '|') as options
        FROM psychoattributes pa 
        WHERE pa.country_id = user_country_id
        ORDER BY pa.id;
    END IF;
END;
$$;

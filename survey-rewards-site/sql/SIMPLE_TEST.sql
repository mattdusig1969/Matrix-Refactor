-- Simplified test to isolate the issue

-- First, let's check what tables exist and their structure
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%attributes';

-- Check the actual structure of geoattributes
\d geoattributes;

-- Test a simple count query to see if geoattributes works
SELECT COUNT(DISTINCT questiontext) as geo_question_count 
FROM geoattributes 
WHERE country_id::TEXT = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'::TEXT;

-- Test if the table exists and has data
SELECT COUNT(*) as total_rows FROM geoattributes;

-- Check if demoattributes exists
SELECT COUNT(*) as demo_total_rows FROM demoattributes;

-- Simple function test without the problematic EXISTS clauses
CREATE OR REPLACE FUNCTION test_simple_profiles(
    user_country_id UUID
)
RETURNS TABLE (
    profile_type TEXT,
    question_count INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'basic'::TEXT as profile_type,
        COALESCE((SELECT COUNT(DISTINCT da.questiontext)::INTEGER FROM demoattributes da WHERE da.country_id::TEXT = user_country_id::TEXT), 0) as question_count
    
    UNION ALL
    
    SELECT 
        'location'::TEXT as profile_type,
        COALESCE((SELECT COUNT(DISTINCT ga.questiontext)::INTEGER FROM geoattributes ga WHERE ga.country_id::TEXT = user_country_id::TEXT), 0) as question_count
    
    UNION ALL
    
    SELECT 
        'personal'::TEXT as profile_type,
        COALESCE((SELECT COUNT(DISTINCT pa.questiontext)::INTEGER FROM psychoattributes pa WHERE pa.country_id::TEXT = user_country_id::TEXT), 0) as question_count;
END;
$$;

-- Test the simple function
SELECT * FROM test_simple_profiles('a2b5820b-9ea7-4024-aa37-29aeae64dcfc'::UUID);

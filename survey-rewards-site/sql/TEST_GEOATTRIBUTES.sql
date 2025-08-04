-- Simple test to check geoattributes table structure and data
-- Run this in Supabase SQL editor to debug the issue

-- First, check if the table exists and what columns it has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'geoattributes';

-- Check the first few rows to see the actual column names and data
SELECT * FROM geoattributes LIMIT 5;

-- Count distinct questions for US
SELECT COUNT(DISTINCT questiontext) as question_count 
FROM geoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc';

-- Show all distinct questions for US
SELECT DISTINCT questiontext, question_type 
FROM geoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
ORDER BY questiontext;

-- Test the actual function call
SELECT * FROM get_available_attribute_profiles_for_panelist(
    'a1b2c3d4-e5f6-7890-abcd-123456789012'::UUID,
    'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'::UUID
);

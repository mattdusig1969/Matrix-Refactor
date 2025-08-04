-- Detailed diagnostic queries to find the issue

-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('demoattributes', 'geoattributes', 'psychoattributes');

-- 2. Check geoattributes table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'geoattributes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if geoattributes has any data at all
SELECT COUNT(*) as total_rows FROM geoattributes;

-- 4. Check if geoattributes has data for US specifically
SELECT COUNT(*) as us_rows 
FROM geoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc';

-- 5. Check what country_ids exist in geoattributes
SELECT DISTINCT country_id, COUNT(*) as row_count
FROM geoattributes 
GROUP BY country_id;

-- 6. If there's data, show first few rows to see structure
SELECT * FROM geoattributes LIMIT 5;

-- 7. Test the function call directly
SELECT * FROM get_available_attribute_profiles_for_panelist(
    'a1b2c3d4-e5f6-7890-abcd-123456789012'::UUID,
    'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'::UUID
);

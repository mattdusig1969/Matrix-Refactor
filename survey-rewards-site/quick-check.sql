-- Quick check script - paste this in Supabase SQL Editor
-- 1. Check panelist_stats view structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'panelist_stats' 
ORDER BY ordinal_position;

-- 2. Check sample panelist data with country info
SELECT 
  ps.id,
  ps.first_name,
  ps.last_name,
  ps.country_id,
  c.country_name
FROM panelist_stats ps
LEFT JOIN country c ON ps.country_id = c.id
LIMIT 3;

-- 3. Check if we have any countries in the country table
SELECT * FROM country LIMIT 5;

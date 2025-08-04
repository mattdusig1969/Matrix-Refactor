-- Check current panelist_stats table structure and data
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'panelist_stats' 
ORDER BY ordinal_position;

-- Check current panelist data 
SELECT * FROM panelist_stats LIMIT 5;

-- Check country table data
SELECT * FROM country LIMIT 10;

-- Check if panelist_stats has country_id field
SELECT country_id FROM panelist_stats LIMIT 1;

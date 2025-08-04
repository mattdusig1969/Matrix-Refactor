-- Check surveys with country targeting
SELECT 
  id,
  title,
  country_id,
  status,
  created_at
FROM surveys 
WHERE status = 'live'
AND country_id IS NOT NULL
LIMIT 10;

-- Check if any surveys have country_id set at all
SELECT 
  COUNT(*) as total_surveys,
  COUNT(country_id) as surveys_with_country,
  COUNT(CASE WHEN status = 'live' THEN 1 END) as live_surveys,
  COUNT(CASE WHEN status = 'live' AND country_id IS NOT NULL THEN 1 END) as live_surveys_with_country
FROM surveys;

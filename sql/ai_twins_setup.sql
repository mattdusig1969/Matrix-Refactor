-- AI Twins System Setup and Seed Data
-- Run this after creating the main tables to add some test data

-- Insert sample personality templates as a reference
-- Note: These are stored in the application code, but this shows the structure

-- Sample data: Create some AI twins from existing panelists
-- This assumes you have panelists with IDs and completed profiles

-- Example: Create AI twins for testing
-- Replace the UUIDs with actual panelist IDs from your database

/*
-- First, check for panelists with completed profiles
SELECT p.id, p.first_name, p.last_name, p.email, 
       COUNT(pp.id) as profile_count
FROM panelists p
LEFT JOIN panelist_profiles pp ON p.id = pp.panelist_id 
WHERE p.is_verified = true 
  AND pp.completed_at IS NOT NULL
GROUP BY p.id, p.first_name, p.last_name, p.email
HAVING COUNT(pp.id) > 0;

-- Example: Generate AI twins for a specific panelist
-- Replace 'YOUR_PANELIST_ID' with an actual panelist ID

INSERT INTO ai_twins (panelist_id, name, variation_label, notes, is_active)
VALUES 
  ('YOUR_PANELIST_ID', 'John Doe - Optimist', 'Optimist', 'Positive outlook, likely to rate products favorably', true),
  ('YOUR_PANELIST_ID', 'John Doe - Skeptic', 'Skeptic', 'Critical thinker, more discerning with ratings', true),
  ('YOUR_PANELIST_ID', 'John Doe - Budget-Conscious', 'Budget-Conscious', 'Price-sensitive, value-focused decisions', true);

-- Create corresponding profiles for the twins
-- This would typically be done through the application logic
-- but here's an example of what the structure looks like

INSERT INTO ai_twin_profiles (ai_twin_id, source_panelist_profile_id, data, source_variation_method)
VALUES 
  ('TWIN_ID_1', 'SOURCE_PROFILE_ID', 
   '{"responses": {"q1": 8, "q2": "satisfied", "income": 65000}, "_twin_metadata": {"template": "optimist", "generated_at": "2025-08-04T23:45:00Z"}}',
   'Template: Optimist + Custom variations'),
  ('TWIN_ID_2', 'SOURCE_PROFILE_ID',
   '{"responses": {"q1": 6, "q2": "neutral", "income": 62000}, "_twin_metadata": {"template": "skeptic", "generated_at": "2025-08-04T23:45:00Z"}}',
   'Template: Skeptic + Custom variations');
*/

-- Queries for monitoring and reporting

-- 1. Count of twins per panelist
SELECT 
  p.first_name || ' ' || p.last_name as panelist_name,
  p.email,
  COUNT(at.id) as twin_count,
  COUNT(CASE WHEN at.is_active THEN 1 END) as active_twins
FROM panelists p
LEFT JOIN ai_twins at ON p.id = at.panelist_id
GROUP BY p.id, p.first_name, p.last_name, p.email
HAVING COUNT(at.id) > 0
ORDER BY twin_count DESC;

-- 2. Twin generation activity over time
SELECT 
  DATE(created_at) as generation_date,
  COUNT(*) as twins_created,
  COUNT(DISTINCT panelist_id) as unique_panelists
FROM ai_twins
GROUP BY DATE(created_at)
ORDER BY generation_date DESC;

-- 3. Personality template distribution
SELECT 
  variation_label,
  COUNT(*) as count,
  COUNT(CASE WHEN is_active THEN 1 END) as active_count
FROM ai_twins
GROUP BY variation_label
ORDER BY count DESC;

-- 4. Twins with their source panelist information
SELECT 
  at.name as twin_name,
  at.variation_label,
  at.is_active,
  p.first_name || ' ' || p.last_name as source_panelist,
  p.email as source_email,
  COUNT(atp.id) as profile_count,
  at.created_at
FROM ai_twins at
JOIN panelists p ON at.panelist_id = p.id
LEFT JOIN ai_twin_profiles atp ON at.id = atp.ai_twin_id
GROUP BY at.id, at.name, at.variation_label, at.is_active, p.first_name, p.last_name, p.email, at.created_at
ORDER BY at.created_at DESC;

-- 5. Generation log analysis
SELECT 
  DATE(created_at) as date,
  SUM(total_twins_created) as total_generated,
  COUNT(*) as generation_sessions,
  AVG(total_twins_created::numeric) as avg_per_session,
  array_agg(DISTINCT method) as methods_used
FROM ai_twin_generation_log
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Maintenance queries

-- 6. Deactivate twins older than 6 months
/*
UPDATE ai_twins 
SET is_active = false 
WHERE created_at < NOW() - INTERVAL '6 months'
  AND is_active = true;
*/

-- 7. Clean up inactive twins and their profiles (use with caution)
/*
DELETE FROM ai_twin_profiles 
WHERE ai_twin_id IN (
  SELECT id FROM ai_twins WHERE is_active = false AND created_at < NOW() - INTERVAL '1 year'
);

DELETE FROM ai_twins 
WHERE is_active = false AND created_at < NOW() - INTERVAL '1 year';
*/

-- Performance indexes (if needed)
CREATE INDEX IF NOT EXISTS idx_ai_twins_panelist_active ON ai_twins(panelist_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_twin_profiles_twin_id ON ai_twin_profiles(ai_twin_id);
CREATE INDEX IF NOT EXISTS idx_generation_log_created_at ON ai_twin_generation_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_twins_variation_label ON ai_twins(variation_label);

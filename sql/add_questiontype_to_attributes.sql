-- Add question_type field to all attribute tables and update existing records
-- This will standardize question types across demoattributes, geoattributes, and psychoattributes

-- =============================================================================
-- ADD QUESTION_TYPE COLUMN TO ALL ATTRIBUTE TABLES
-- =============================================================================

-- Add question_type to demoattributes
ALTER TABLE public.demoattributes 
ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'single_select_radio';

-- Add question_type to geoattributes
ALTER TABLE public.geoattributes 
ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'single_select_radio';

-- Add question_type to psychoattributes
ALTER TABLE public.psychoattributes 
ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'single_select_radio';

-- =============================================================================
-- UPDATE EXISTING RECORDS
-- =============================================================================

-- Update all existing demoattributes records to single_select_radio
UPDATE public.demoattributes 
SET question_type = 'single_select_radio' 
WHERE question_type IS NULL OR question_type = '';

-- Update all existing geoattributes records to single_select_radio
UPDATE public.geoattributes 
SET question_type = 'single_select_radio' 
WHERE question_type IS NULL OR question_type = '';

-- Update all existing psychoattributes records to single_select_radio
UPDATE public.psychoattributes 
SET question_type = 'single_select_radio' 
WHERE question_type IS NULL OR question_type = '';

-- =============================================================================
-- SET SPECIFIC QUESTION TYPES FOR SPECIAL CASES
-- =============================================================================

-- Set zip code to text input (we'll add this record separately)
-- This is for future use when we add the zip code question

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check demoattributes question_type distribution
SELECT 
    'demoattributes' as table_name,
    question_type,
    COUNT(*) as count
FROM public.demoattributes 
GROUP BY question_type
ORDER BY question_type;

-- Check geoattributes question_type distribution
SELECT 
    'geoattributes' as table_name,
    question_type,
    COUNT(*) as count
FROM public.geoattributes 
GROUP BY question_type
ORDER BY question_type;

-- Check psychoattributes question_type distribution
SELECT 
    'psychoattributes' as table_name,
    question_type,
    COUNT(*) as count
FROM public.psychoattributes 
GROUP BY question_type
ORDER BY question_type;

-- Show all tables with their new structure
SELECT 
    'demoattributes' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'demoattributes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'geoattributes' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'geoattributes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'psychoattributes' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'psychoattributes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- VALIDATION REPORT
-- =============================================================================

-- Show record counts and question_type distribution
SELECT 
    'SUMMARY REPORT' as section,
    '' as table_name,
    '' as question_type,
    '' as count
UNION ALL
SELECT 
    '',
    'demoattributes',
    COALESCE(question_type, 'NULL'),
    COUNT(*)::text
FROM public.demoattributes 
GROUP BY question_type
UNION ALL
SELECT 
    '',
    'geoattributes',
    COALESCE(question_type, 'NULL'),
    COUNT(*)::text
FROM public.geoattributes 
GROUP BY question_type
UNION ALL
SELECT 
    '',
    'psychoattributes',
    COALESCE(question_type, 'NULL'),
    COUNT(*)::text
FROM public.psychoattributes 
GROUP BY question_type
ORDER BY section DESC, table_name, question_type;

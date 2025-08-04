-- Add questiontype field to geoattributes table and update existing records
-- This will standardize the question type tracking across all attribute tables

-- Add the questiontype column to geoattributes table
ALTER TABLE public.geoattributes 
ADD COLUMN questiontype text;

-- Update all existing records to have 'single_select_radio' as the default question type
UPDATE public.geoattributes 
SET questiontype = 'single_select_radio' 
WHERE questiontype IS NULL;

-- Also add questiontype to demoattributes if it doesn't exist
ALTER TABLE public.demoattributes 
ADD COLUMN IF NOT EXISTS questiontype text;

-- Update all existing demoattributes records
UPDATE public.demoattributes 
SET questiontype = 'single_select_radio' 
WHERE questiontype IS NULL;

-- Also add questiontype to psychoattributes if it doesn't exist
ALTER TABLE public.psychoattributes 
ADD COLUMN IF NOT EXISTS questiontype text;

-- Update all existing psychoattributes records
UPDATE public.psychoattributes 
SET questiontype = 'single_select_radio' 
WHERE questiontype IS NULL;

-- Now add the zip code entry to geoattributes with text_input type
INSERT INTO public.geoattributes (field_name, value, questiontext, questiontype, country_id) VALUES
('zip_code', 'user_input', 'What is your zip code?', 'text_input', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Verification queries to check the updates
SELECT 'demoattributes' as table_name, 
       questiontype, 
       COUNT(*) as record_count 
FROM public.demoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
GROUP BY questiontype

UNION ALL

SELECT 'geoattributes' as table_name, 
       questiontype, 
       COUNT(*) as record_count 
FROM public.geoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
GROUP BY questiontype

UNION ALL

SELECT 'psychoattributes' as table_name, 
       questiontype, 
       COUNT(*) as record_count 
FROM public.psychoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
GROUP BY questiontype;

-- Show the new zip code entry
SELECT * FROM public.geoattributes 
WHERE field_name = 'zip_code' 
AND country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc';

-- Show table structure to confirm the new column
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('demoattributes', 'geoattributes', 'psychoattributes') 
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

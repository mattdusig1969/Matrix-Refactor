-- Fix the profiling_survey_id column to accept text values instead of strict UUID
-- This allows us to use custom profile IDs for attribute profiles

-- Step 1: Drop any existing foreign key constraints
ALTER TABLE public.panelist_profiles 
DROP CONSTRAINT IF EXISTS panelist_profiles_profiling_survey_id_fkey;

-- Step 2: Change the column type to TEXT to accept any string format
ALTER TABLE public.panelist_profiles 
ALTER COLUMN profiling_survey_id TYPE TEXT;

-- Step 3: Update the column comment
COMMENT ON COLUMN public.panelist_profiles.profiling_survey_id IS 'Can be either a profiling_survey UUID or an attribute_profile identifier, depending on survey_type';

-- Step 4: Ensure the survey_type column exists
ALTER TABLE public.panelist_profiles 
ADD COLUMN IF NOT EXISTS survey_type VARCHAR(50) DEFAULT 'profiling_survey';

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_panelist_profiles_survey_type ON public.panelist_profiles(survey_type);
CREATE INDEX IF NOT EXISTS idx_panelist_profiles_panelist_survey ON public.panelist_profiles(panelist_id, profiling_survey_id);

-- Step 6: Verify the changes
SELECT column_name, data_type, character_maximum_length, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'panelist_profiles' 
AND column_name IN ('profiling_survey_id', 'survey_type');

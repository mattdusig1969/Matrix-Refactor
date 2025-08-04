-- COMPLETE FIX for attribute profiles
-- Run this in your Supabase SQL editor

-- Step 1: Add the survey_type column (if not already added)
ALTER TABLE public.panelist_profiles 
ADD COLUMN IF NOT EXISTS survey_type VARCHAR(50) DEFAULT 'profiling_survey';

-- Step 2: Remove the foreign key constraint that's causing the issue
ALTER TABLE public.panelist_profiles 
DROP CONSTRAINT IF EXISTS panelist_profiles_profiling_survey_id_fkey;

-- Step 3: Update existing records to have the default survey_type
UPDATE public.panelist_profiles 
SET survey_type = 'profiling_survey' 
WHERE survey_type IS NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN public.panelist_profiles.survey_type IS 'Type of survey: profiling_survey (default) or attribute_profile';
COMMENT ON COLUMN public.panelist_profiles.profiling_survey_id IS 'Can be either a profiling_survey ID or an attribute_profile ID, depending on survey_type';

-- Step 5: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_panelist_profiles_survey_type ON public.panelist_profiles(survey_type);
CREATE INDEX IF NOT EXISTS idx_panelist_profiles_panelist_survey ON public.panelist_profiles(panelist_id, profiling_survey_id);

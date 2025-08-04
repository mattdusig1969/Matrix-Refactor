-- Option 1: Remove the foreign key constraint for profiling_survey_id
-- This allows us to store attribute profile IDs that don't exist in profiling_surveys table

-- First, let's drop the existing foreign key constraint
ALTER TABLE public.panelist_profiles 
DROP CONSTRAINT panelist_profiles_profiling_survey_id_fkey;

-- Make the profiling_survey_id column allow any UUID (not just ones from profiling_surveys)
-- This is more flexible for storing both profiling survey IDs and attribute profile IDs

-- Add a comment to explain the new usage
COMMENT ON COLUMN public.panelist_profiles.profiling_survey_id IS 'Can be either a profiling_survey ID or an attribute_profile ID, depending on survey_type';

-- You can run this SQL in your Supabase SQL editor
-- Go to https://supabase.com/dashboard -> Your Project -> SQL Editor
-- Copy and paste this SQL and click "Run"

-- Add survey_type column to panelist_profiles table
ALTER TABLE public.panelist_profiles 
ADD COLUMN survey_type VARCHAR(50) DEFAULT 'profiling_survey';

-- Add a comment to document the column
COMMENT ON COLUMN public.panelist_profiles.survey_type IS 'Type of survey: profiling_survey (default) or attribute_profile';

-- Update existing records to have the default value
UPDATE public.panelist_profiles 
SET survey_type = 'profiling_survey' 
WHERE survey_type IS NULL;

-- Create an index for better performance on survey_type queries
CREATE INDEX IF NOT EXISTS idx_panelist_profiles_survey_type ON public.panelist_profiles(survey_type);

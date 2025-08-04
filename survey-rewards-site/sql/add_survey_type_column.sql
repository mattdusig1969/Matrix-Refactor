-- Add survey_type column to panelist_profiles table
-- This will help distinguish between regular profiling surveys and attribute profiles

ALTER TABLE public.panelist_profiles 
ADD COLUMN survey_type VARCHAR(50) DEFAULT 'profiling_survey';

-- Add a comment to document the column
COMMENT ON COLUMN public.panelist_profiles.survey_type IS 'Type of survey: profiling_survey (default) or attribute_profile';

-- Update existing records to have the default value
UPDATE public.panelist_profiles 
SET survey_type = 'profiling_survey' 
WHERE survey_type IS NULL;

-- Create an index for better performance on survey_type queries
CREATE INDEX idx_panelist_profiles_survey_type ON public.panelist_profiles(survey_type);

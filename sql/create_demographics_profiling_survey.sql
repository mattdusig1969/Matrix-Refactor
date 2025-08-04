-- Create Demographics Profiling Survey
-- This survey will collect all demographic information for persona building
-- Country ID: a2b5820b-9ea7-4024-aa37-29aeae64dcfc

-- Insert the Demographics Profiling Survey
INSERT INTO public.profiling_surveys (name, description, questions, is_active, status, created_at) VALUES (
'Basic Demographics Profile',
'Help us understand your background by completing this short demographic survey. This information helps us match you with relevant surveys and opportunities.',
'{
  "raw": "Q: What is your age?
Type: single_select_radio
A: 18-24
A: 25-34
A: 35-44
A: 45-54
A: 55-64
A: 65+

Q: What is your gender?
Type: single_select_radio
A: Male
A: Female
A: Non-binary
A: Prefer not to say

Q: What is your ethnicity?
Type: single_select_radio
A: White/Caucasian
A: Black/African American
A: Hispanic/Latino
A: Asian
A: Native American
A: Pacific Islander
A: Mixed/Multiracial
A: Other
A: Prefer not to say

Q: What is your annual household income?
Type: single_select_radio
A: Under $25,000
A: $25,000 - $49,999
A: $50,000 - $74,999
A: $75,000 - $99,999
A: $100,000 - $149,999
A: $150,000 - $199,999
A: $200,000+
A: Prefer not to say

Q: What is your highest level of education?
Type: single_select_radio
A: Less than high school
A: High school diploma/GED
A: Some college
A: Associate degree
A: Bachelor''s degree
A: Master''s degree
A: Doctoral degree
A: Professional degree

Q: What is your current employment status?
Type: single_select_radio
A: Employed full-time
A: Employed part-time
A: Self-employed
A: Unemployed
A: Student
A: Retired
A: Homemaker
A: Unable to work

Q: What is your marital status?
Type: single_select_radio
A: Single
A: Married
A: Divorced
A: Widowed
A: Separated
A: Domestic partnership
A: Prefer not to say

Q: How many people live in your household?
Type: single_select_radio
A: 1
A: 2
A: 3
A: 4
A: 5
A: 6+

Q: Do you have children under 18 living in your household?
Type: single_select_radio
A: No children
A: 1 child
A: 2 children
A: 3 children
A: 4+ children"
}',
true,
'live',
NOW()
);

-- Get the survey ID for reference
DO $$
DECLARE
    survey_id UUID;
BEGIN
    SELECT id INTO survey_id 
    FROM public.profiling_surveys 
    WHERE name = 'Basic Demographics Profile' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    RAISE NOTICE 'Created Demographics Profiling Survey with ID: %', survey_id;
END $$;

-- Verification query to check the survey was created
SELECT 
    id,
    name,
    description,
    status,
    is_active,
    created_at
FROM public.profiling_surveys 
WHERE name = 'Basic Demographics Profile'
ORDER BY created_at DESC;

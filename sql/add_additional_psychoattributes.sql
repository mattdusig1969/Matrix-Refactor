-- Add additional psychographic attributes to complement existing data
-- Country ID: a2b5820b-9ea7-4024-aa37-29aeae64dcfc
-- Avoiding duplicates with existing Media Consumption, Technology Adoption, Social Media Usage, 
-- Lifestyle, Personal Values, and Shopping Behavior data

-- =============================================================================
-- ADD RISK TOLERANCE
-- =============================================================================

INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('risk_tolerance', 'Conservative', 'How would you describe your approach to risk?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('risk_tolerance', 'Moderate', 'How would you describe your approach to risk?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('risk_tolerance', 'Adventurous', 'How would you describe your approach to risk?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('risk_tolerance', 'High-risk taker', 'How would you describe your approach to risk?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio');

-- =============================================================================
-- ADD DECISION MAKING STYLE
-- =============================================================================

INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('decision_making', 'Make quick decisions', 'How do you typically make important decisions?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('decision_making', 'Research thoroughly first', 'How do you typically make important decisions?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('decision_making', 'Ask others for opinions', 'How do you typically make important decisions?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('decision_making', 'Take time to think it over', 'How do you typically make important decisions?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('decision_making', 'Go with gut instinct', 'How do you typically make important decisions?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio');

-- =============================================================================
-- ADD COMMUNICATION PREFERENCE
-- =============================================================================

INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('communication_preference', 'Face-to-face conversation', 'What is your preferred way to communicate?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('communication_preference', 'Phone calls', 'What is your preferred way to communicate?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('communication_preference', 'Text messaging', 'What is your preferred way to communicate?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('communication_preference', 'Email', 'What is your preferred way to communicate?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('communication_preference', 'Video calls', 'What is your preferred way to communicate?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('communication_preference', 'Written notes/messages', 'What is your preferred way to communicate?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio');

-- =============================================================================
-- ADD WORK-LIFE BALANCE PRIORITY
-- =============================================================================

INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('work_life_balance', 'Work-focused', 'How do you prioritize work-life balance?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('work_life_balance', 'Balanced approach', 'How do you prioritize work-life balance?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('work_life_balance', 'Life-focused', 'How do you prioritize work-life balance?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('work_life_balance', 'Flexible/situational', 'How do you prioritize work-life balance?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio');

-- =============================================================================
-- ADD LEARNING STYLE
-- =============================================================================

INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('learning_style', 'Visual learner (charts, diagrams)', 'How do you prefer to learn new things?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('learning_style', 'Hands-on experience', 'How do you prefer to learn new things?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('learning_style', 'Reading and research', 'How do you prefer to learn new things?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('learning_style', 'Group discussion', 'How do you prefer to learn new things?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('learning_style', 'Audio/listening', 'How do you prefer to learn new things?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio');

-- =============================================================================
-- ADD PLANNING APPROACH
-- =============================================================================

INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('planning_approach', 'Detailed planner', 'How do you approach planning activities?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('planning_approach', 'General/outline planner', 'How do you approach planning activities?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('planning_approach', 'Spontaneous', 'How do you approach planning activities?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('planning_approach', 'Go with the flow', 'How do you approach planning activities?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('planning_approach', 'Plan only when necessary', 'How do you approach planning activities?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio');

-- =============================================================================
-- ADD STRESS MANAGEMENT
-- =============================================================================

INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('stress_management', 'Exercise/physical activity', 'How do you typically manage stress?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('stress_management', 'Social activities/talking', 'How do you typically manage stress?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('stress_management', 'Alone time/solitude', 'How do you typically manage stress?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('stress_management', 'Problem-solving/action', 'How do you typically manage stress?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('stress_management', 'Relaxation/meditation', 'How do you typically manage stress?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('stress_management', 'Hobbies/creative activities', 'How do you typically manage stress?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio');

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check new records added
SELECT 
    field_name,
    COUNT(*) as value_count,
    question_type
FROM public.psychoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
AND field_name IN ('risk_tolerance', 'decision_making', 'communication_preference', 
                   'work_life_balance', 'learning_style', 'planning_approach', 'stress_management')
GROUP BY field_name, question_type
ORDER BY field_name;

-- Show total count by question type for all psychoattributes
SELECT 
    question_type,
    COUNT(*) as total_count
FROM public.psychoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
GROUP BY question_type
ORDER BY question_type;

-- Show all existing field types to ensure no overlap
SELECT DISTINCT 
    field_name,
    questiontext,
    COUNT(*) as option_count
FROM public.psychoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
GROUP BY field_name, questiontext
ORDER BY field_name;

-- Summary of new additions
SELECT 
    'NEW PSYCHOATTRIBUTES ADDED' as section,
    '' as field_name,
    '' as count
UNION ALL
SELECT 
    '',
    field_name,
    COUNT(*)::text
FROM public.psychoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
AND field_name IN ('risk_tolerance', 'decision_making', 'communication_preference', 
                   'work_life_balance', 'learning_style', 'planning_approach', 'stress_management')
GROUP BY field_name
ORDER BY section DESC, field_name;

-- Populate Profiling Attributes Tables
-- Country ID: a2b5820b-9ea7-4024-aa37-29aeae64dcfc

-- =============================================================================
-- DEMOGRAPHIC ATTRIBUTES
-- =============================================================================

-- Age Demographics
INSERT INTO public.demoattributes (field_name, value, questiontext, country_id) VALUES
('age', '18-24', 'What is your age?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('age', '25-34', 'What is your age?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('age', '35-44', 'What is your age?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('age', '45-54', 'What is your age?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('age', '55-64', 'What is your age?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('age', '65+', 'What is your age?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Gender (expanding the existing one)
INSERT INTO public.demoattributes (field_name, value, questiontext, country_id) VALUES
('gender', 'Male', 'What is your gender?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('gender', 'Female', 'What is your gender?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('gender', 'Non-binary', 'What is your gender?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('gender', 'Prefer not to say', 'What is your gender?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Ethnicity
INSERT INTO public.demoattributes (field_name, value, questiontext, country_id) VALUES
('ethnicity', 'White/Caucasian', 'What is your ethnicity?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('ethnicity', 'Black/African American', 'What is your ethnicity?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('ethnicity', 'Hispanic/Latino', 'What is your ethnicity?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('ethnicity', 'Asian', 'What is your ethnicity?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('ethnicity', 'Native American', 'What is your ethnicity?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('ethnicity', 'Pacific Islander', 'What is your ethnicity?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('ethnicity', 'Mixed/Multiracial', 'What is your ethnicity?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('ethnicity', 'Other', 'What is your ethnicity?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('ethnicity', 'Prefer not to say', 'What is your ethnicity?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Household Income
INSERT INTO public.demoattributes (field_name, value, questiontext, country_id) VALUES
('income', 'Under $25,000', 'What is your annual household income?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('income', '$25,000 - $49,999', 'What is your annual household income?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('income', '$50,000 - $74,999', 'What is your annual household income?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('income', '$75,000 - $99,999', 'What is your annual household income?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('income', '$100,000 - $149,999', 'What is your annual household income?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('income', '$150,000 - $199,999', 'What is your annual household income?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('income', '$200,000+', 'What is your annual household income?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('income', 'Prefer not to say', 'What is your annual household income?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Education Level
INSERT INTO public.demoattributes (field_name, value, questiontext, country_id) VALUES
('education', 'Less than high school', 'What is your highest level of education?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('education', 'High school diploma/GED', 'What is your highest level of education?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('education', 'Some college', 'What is your highest level of education?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('education', 'Associate degree', 'What is your highest level of education?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('education', 'Bachelor''s degree', 'What is your highest level of education?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('education', 'Master''s degree', 'What is your highest level of education?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('education', 'Doctoral degree', 'What is your highest level of education?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('education', 'Professional degree', 'What is your highest level of education?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Employment Status
INSERT INTO public.demoattributes (field_name, value, questiontext, country_id) VALUES
('employment', 'Employed full-time', 'What is your current employment status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('employment', 'Employed part-time', 'What is your current employment status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('employment', 'Self-employed', 'What is your current employment status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('employment', 'Unemployed', 'What is your current employment status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('employment', 'Student', 'What is your current employment status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('employment', 'Retired', 'What is your current employment status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('employment', 'Homemaker', 'What is your current employment status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('employment', 'Unable to work', 'What is your current employment status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Marital Status
INSERT INTO public.demoattributes (field_name, value, questiontext, country_id) VALUES
('marital_status', 'Single', 'What is your marital status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('marital_status', 'Married', 'What is your marital status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('marital_status', 'Divorced', 'What is your marital status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('marital_status', 'Widowed', 'What is your marital status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('marital_status', 'Separated', 'What is your marital status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('marital_status', 'Domestic partnership', 'What is your marital status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('marital_status', 'Prefer not to say', 'What is your marital status?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Household Size
INSERT INTO public.demoattributes (field_name, value, questiontext, country_id) VALUES
('household_size', '1', 'How many people live in your household?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('household_size', '2', 'How many people live in your household?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('household_size', '3', 'How many people live in your household?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('household_size', '4', 'How many people live in your household?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('household_size', '5', 'How many people live in your household?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('household_size', '6+', 'How many people live in your household?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Children in Household
INSERT INTO public.demoattributes (field_name, value, questiontext, country_id) VALUES
('children', 'No children', 'Do you have children under 18 living in your household?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('children', '1 child', 'Do you have children under 18 living in your household?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('children', '2 children', 'Do you have children under 18 living in your household?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('children', '3 children', 'Do you have children under 18 living in your household?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('children', '4+ children', 'Do you have children under 18 living in your household?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- =============================================================================
-- GEOGRAPHIC ATTRIBUTES
-- =============================================================================

-- Region/State (US example - adjust for your country)
INSERT INTO public.geoattributes (field_name, value, questiontext, country_id) VALUES
('region', 'Northeast', 'Which region do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('region', 'Southeast', 'Which region do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('region', 'Midwest', 'Which region do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('region', 'Southwest', 'Which region do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('region', 'West', 'Which region do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('region', 'Mountain', 'Which region do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('region', 'Pacific', 'Which region do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Area Type
INSERT INTO public.geoattributes (field_name, value, questiontext, country_id) VALUES
('area_type', 'Urban', 'How would you describe the area where you live?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('area_type', 'Suburban', 'How would you describe the area where you live?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('area_type', 'Rural', 'How would you describe the area where you live?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- City Size
INSERT INTO public.geoattributes (field_name, value, questiontext, country_id) VALUES
('city_size', 'Major metropolitan area (1M+ people)', 'What size city/town do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('city_size', 'Large city (250K-1M people)', 'What size city/town do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('city_size', 'Medium city (50K-250K people)', 'What size city/town do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('city_size', 'Small city (10K-50K people)', 'What size city/town do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('city_size', 'Town (2.5K-10K people)', 'What size city/town do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('city_size', 'Rural area (under 2.5K people)', 'What size city/town do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Climate Zone
INSERT INTO public.geoattributes (field_name, value, questiontext, country_id) VALUES
('climate', 'Tropical', 'What type of climate do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('climate', 'Subtropical', 'What type of climate do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('climate', 'Temperate', 'What type of climate do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('climate', 'Continental', 'What type of climate do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('climate', 'Arid/Desert', 'What type of climate do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('climate', 'Mediterranean', 'What type of climate do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Housing Type
INSERT INTO public.geoattributes (field_name, value, questiontext, country_id) VALUES
('housing_type', 'Single-family house', 'What type of housing do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('housing_type', 'Apartment/Condo', 'What type of housing do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('housing_type', 'Townhouse', 'What type of housing do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('housing_type', 'Mobile home', 'What type of housing do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('housing_type', 'Duplex', 'What type of housing do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('housing_type', 'Other', 'What type of housing do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Home Ownership
INSERT INTO public.geoattributes (field_name, value, questiontext, country_id) VALUES
('home_ownership', 'Own', 'Do you own or rent your home?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('home_ownership', 'Rent', 'Do you own or rent your home?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('home_ownership', 'Live with family/friends', 'Do you own or rent your home?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('home_ownership', 'Other', 'Do you own or rent your home?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- =============================================================================
-- PSYCHOGRAPHIC ATTRIBUTES
-- =============================================================================

-- Personality Traits (Big Five)
INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id) VALUES
('openness', 'Very open to new experiences', 'How open are you to new experiences?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('openness', 'Moderately open', 'How open are you to new experiences?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('openness', 'Somewhat traditional', 'How open are you to new experiences?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('openness', 'Prefer familiar experiences', 'How open are you to new experiences?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Risk Tolerance
INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id) VALUES
('risk_tolerance', 'High risk taker', 'How would you describe your approach to risk?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('risk_tolerance', 'Moderate risk taker', 'How would you describe your approach to risk?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('risk_tolerance', 'Risk averse', 'How would you describe your approach to risk?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('risk_tolerance', 'Very conservative', 'How would you describe your approach to risk?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Values (from existing psychographic survey)
INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id) VALUES
('general_outlook', 'Very optimistic', 'Which statement best describes your general outlook on life?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('general_outlook', 'Somewhat optimistic', 'Which statement best describes your general outlook on life?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('general_outlook', 'Balanced', 'Which statement best describes your general outlook on life?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('general_outlook', 'Somewhat pessimistic', 'Which statement best describes your general outlook on life?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('general_outlook', 'Very pessimistic', 'Which statement best describes your general outlook on life?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Life Priorities
INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id) VALUES
('life_priority', 'Family and relationships', 'What is most important to you in life?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('life_priority', 'Career and achievement', 'What is most important to you in life?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('life_priority', 'Financial security', 'What is most important to you in life?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('life_priority', 'Health and wellness', 'What is most important to you in life?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('life_priority', 'Personal growth', 'What is most important to you in life?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('life_priority', 'Having fun and enjoyment', 'What is most important to you in life?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('life_priority', 'Helping others', 'What is most important to you in life?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Environmental Consciousness
INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id) VALUES
('environmental_attitude', 'Very environmentally conscious', 'How would you describe your environmental attitudes?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('environmental_attitude', 'Moderately environmentally conscious', 'How would you describe your environmental attitudes?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('environmental_attitude', 'Somewhat environmentally conscious', 'How would you describe your environmental attitudes?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('environmental_attitude', 'Not very environmentally conscious', 'How would you describe your environmental attitudes?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Technology Adoption
INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id) VALUES
('tech_adoption', 'Early adopter', 'How do you approach new technology?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('tech_adoption', 'Early majority', 'How do you approach new technology?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('tech_adoption', 'Late majority', 'How do you approach new technology?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('tech_adoption', 'Laggard', 'How do you approach new technology?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Shopping Behavior
INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id) VALUES
('shopping_style', 'Impulse buyer', 'How would you describe your shopping behavior?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('shopping_style', 'Careful researcher', 'How would you describe your shopping behavior?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('shopping_style', 'Bargain hunter', 'How would you describe your shopping behavior?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('shopping_style', 'Brand loyal', 'How would you describe your shopping behavior?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('shopping_style', 'Quality focused', 'How would you describe your shopping behavior?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('shopping_style', 'Convenience focused', 'How would you describe your shopping behavior?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Social Media Usage
INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id) VALUES
('social_media_usage', 'Very active user', 'How would you describe your social media usage?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('social_media_usage', 'Moderate user', 'How would you describe your social media usage?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('social_media_usage', 'Light user', 'How would you describe your social media usage?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('social_media_usage', 'Non-user', 'How would you describe your social media usage?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Work-Life Balance Priority
INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id) VALUES
('work_life_balance', 'Work is priority', 'How important is work-life balance to you?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('work_life_balance', 'Work and life equally important', 'How important is work-life balance to you?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('work_life_balance', 'Life is priority', 'How important is work-life balance to you?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('work_life_balance', 'Flexible approach', 'How important is work-life balance to you?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Financial Attitudes
INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id) VALUES
('financial_attitude', 'Big spender', 'How would you describe your financial approach?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('financial_attitude', 'Balanced spender/saver', 'How would you describe your financial approach?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('financial_attitude', 'Conservative saver', 'How would you describe your financial approach?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('financial_attitude', 'Frugal', 'How would you describe your financial approach?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- Health & Wellness Attitudes
INSERT INTO public.psychoattributes (field_name, value, questiontext, country_id) VALUES
('health_consciousness', 'Very health conscious', 'How important is health and wellness to you?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('health_consciousness', 'Moderately health conscious', 'How important is health and wellness to you?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('health_consciousness', 'Somewhat health conscious', 'How important is health and wellness to you?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'),
('health_consciousness', 'Not very health conscious', 'How important is health and wellness to you?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc');

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check record counts
SELECT 'demoattributes' as table_name, COUNT(*) as record_count 
FROM public.demoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
UNION ALL
SELECT 'geoattributes' as table_name, COUNT(*) as record_count 
FROM public.geoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
UNION ALL
SELECT 'psychoattributes' as table_name, COUNT(*) as record_count 
FROM public.psychoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc';

-- Check field distribution
SELECT 'demoattributes' as table_name, field_name, COUNT(*) as value_count
FROM public.demoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
GROUP BY field_name
ORDER BY field_name;

SELECT 'geoattributes' as table_name, field_name, COUNT(*) as value_count
FROM public.geoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
GROUP BY field_name
ORDER BY field_name;

SELECT 'psychoattributes' as table_name, field_name, COUNT(*) as value_count
FROM public.psychoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
GROUP BY field_name
ORDER BY field_name;

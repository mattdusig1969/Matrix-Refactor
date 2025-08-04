-- Add additional geographic attributes to complement existing data
-- Country ID: a2b5820b-9ea7-4024-aa37-29aeae64dcfc
-- Avoiding duplicates with existing State, Census Region, Area Type, and Transportation data

-- =============================================================================
-- ADD ZIP CODE (TEXT INPUT)
-- =============================================================================

INSERT INTO public.geoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('zip_code', 'user_input', 'What is your ZIP code?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'user_input');

-- =============================================================================
-- ADD HOUSING CHARACTERISTICS
-- =============================================================================

-- Housing Type
INSERT INTO public.geoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('housing_type', 'Single-family house', 'What type of housing do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('housing_type', 'Apartment/Condo', 'What type of housing do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('housing_type', 'Townhouse', 'What type of housing do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('housing_type', 'Mobile home', 'What type of housing do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('housing_type', 'Duplex', 'What type of housing do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('housing_type', 'Other', 'What type of housing do you live in?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio');

-- Home Ownership
INSERT INTO public.geoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('home_ownership', 'Own', 'Do you own or rent your home?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('home_ownership', 'Rent', 'Do you own or rent your home?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('home_ownership', 'Live with family/friends', 'Do you own or rent your home?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('home_ownership', 'Other', 'Do you own or rent your home?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio');

-- =============================================================================
-- ADD ENVIRONMENTAL/CLIMATE PREFERENCES
-- =============================================================================

-- Climate Zone
INSERT INTO public.geoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('climate_preference', 'Tropical/Warm year-round', 'What type of climate do you prefer?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('climate_preference', 'Subtropical/Hot summers, mild winters', 'What type of climate do you prefer?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('climate_preference', 'Temperate/Four distinct seasons', 'What type of climate do you prefer?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('climate_preference', 'Continental/Cold winters, warm summers', 'What type of climate do you prefer?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('climate_preference', 'Arid/Desert/Dry climate', 'What type of climate do you prefer?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('climate_preference', 'Mediterranean/Dry summers, mild winters', 'What type of climate do you prefer?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('climate_preference', 'Cool/Cold year-round', 'What type of climate do you prefer?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio');

-- =============================================================================
-- ADD LIFESTYLE/CONVENIENCE FACTORS
-- =============================================================================

-- Distance to Work/School
INSERT INTO public.geoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('commute_distance', 'Work from home', 'How far do you typically commute to work/school?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('commute_distance', 'Less than 5 miles', 'How far do you typically commute to work/school?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('commute_distance', '5-15 miles', 'How far do you typically commute to work/school?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('commute_distance', '16-30 miles', 'How far do you typically commute to work/school?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('commute_distance', '31-50 miles', 'How far do you typically commute to work/school?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('commute_distance', 'More than 50 miles', 'How far do you typically commute to work/school?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio');

-- Proximity to Shopping/Services
INSERT INTO public.geoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('shopping_proximity', 'Walking distance (under 0.5 miles)', 'How close are you to major shopping/services?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('shopping_proximity', 'Short drive (0.5-2 miles)', 'How close are you to major shopping/services?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('shopping_proximity', 'Moderate drive (2-10 miles)', 'How close are you to major shopping/services?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('shopping_proximity', 'Long drive (10-25 miles)', 'How close are you to major shopping/services?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('shopping_proximity', 'Very remote (25+ miles)', 'How close are you to major shopping/services?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio');

-- =============================================================================
-- ADD TECHNOLOGY/INFRASTRUCTURE
-- =============================================================================

-- Internet Speed/Quality
INSERT INTO public.geoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('internet_quality', 'High-speed fiber (100+ Mbps)', 'What is the quality of internet service in your area?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('internet_quality', 'High-speed cable/DSL (25-100 Mbps)', 'What is the quality of internet service in your area?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('internet_quality', 'Moderate speed (10-25 Mbps)', 'What is the quality of internet service in your area?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('internet_quality', 'Basic speed (5-10 Mbps)', 'What is the quality of internet service in your area?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('internet_quality', 'Slow/Limited (under 5 Mbps)', 'What is the quality of internet service in your area?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('internet_quality', 'Unreliable/Poor service', 'What is the quality of internet service in your area?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio');

-- =============================================================================
-- ADD NEIGHBORHOOD CHARACTERISTICS
-- =============================================================================

-- Neighborhood Age/Development
INSERT INTO public.geoattributes (field_name, value, questiontext, country_id, question_type) VALUES
('neighborhood_age', 'New development (built 2010+)', 'How would you describe your neighborhood?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('neighborhood_age', 'Recent development (built 1990-2010)', 'How would you describe your neighborhood?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('neighborhood_age', 'Established (built 1970-1990)', 'How would you describe your neighborhood?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('neighborhood_age', 'Mature (built 1950-1970)', 'How would you describe your neighborhood?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('neighborhood_age', 'Historic/Older (built before 1950)', 'How would you describe your neighborhood?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio'),
('neighborhood_age', 'Mixed ages', 'How would you describe your neighborhood?', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc', 'single_select_radio');

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check new records added
SELECT 
    field_name,
    COUNT(*) as value_count,
    question_type
FROM public.geoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
AND field_name IN ('zip_code', 'housing_type', 'home_ownership', 'climate_preference', 
                   'commute_distance', 'shopping_proximity', 'internet_quality', 'neighborhood_age')
GROUP BY field_name, question_type
ORDER BY field_name;

-- Show total count by question type
SELECT 
    question_type,
    COUNT(*) as total_count
FROM public.geoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
GROUP BY question_type
ORDER BY question_type;

-- Show all field types for reference
SELECT DISTINCT 
    field_name,
    questiontext,
    question_type
FROM public.geoattributes 
WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
ORDER BY field_name;

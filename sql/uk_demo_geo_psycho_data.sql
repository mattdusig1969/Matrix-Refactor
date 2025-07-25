-- SQL statements to populate demographic data for the United Kingdom
-- Following the same format as the US geoattributes data

DO $$ 
DECLARE uk_country_id UUID;
BEGIN
    SELECT id INTO uk_country_id FROM country WHERE country_name = 'United Kingdom';

    -- Age Groups
    INSERT INTO demoattributes (country_id, field_name, value, questiontext)
    VALUES
    (uk_country_id, 'Age', '18-24', 'What is your age group?'),
    (uk_country_id, 'Age', '25-34', 'What is your age group?'),
    (uk_country_id, 'Age', '35-44', 'What is your age group?'),
    (uk_country_id, 'Age', '45-54', 'What is your age group?'),
    (uk_country_id, 'Age', '55-64', 'What is your age group?'),
    (uk_country_id, 'Age', '65+', 'What is your age group?');

    -- Gender
    INSERT INTO demoattributes (country_id, field_name, value, questiontext)
    VALUES
    (uk_country_id, 'Gender', 'Male', 'What is your gender?'),
    (uk_country_id, 'Gender', 'Female', 'What is your gender?'),
    (uk_country_id, 'Gender', 'Non-binary', 'What is your gender?'),
    (uk_country_id, 'Gender', 'Prefer not to say', 'What is your gender?');

    -- Income (British Pounds)
    INSERT INTO demoattributes (country_id, field_name, value, questiontext)
    VALUES
    (uk_country_id, 'Income', 'Under £20,000', 'What is your annual household income?'),
    (uk_country_id, 'Income', '£20,000-£29,999', 'What is your annual household income?'),
    (uk_country_id, 'Income', '£30,000-£39,999', 'What is your annual household income?'),
    (uk_country_id, 'Income', '£40,000-£49,999', 'What is your annual household income?'),
    (uk_country_id, 'Income', '£50,000-£74,999', 'What is your annual household income?'),
    (uk_country_id, 'Income', '£75,000-£99,999', 'What is your annual household income?'),
    (uk_country_id, 'Income', '£100,000+', 'What is your annual household income?');

    -- Education
    INSERT INTO demoattributes (country_id, field_name, value, questiontext)
    VALUES
    (uk_country_id, 'Education', 'No formal qualifications', 'What is your highest level of education?'),
    (uk_country_id, 'Education', 'GCSE/O-levels', 'What is your highest level of education?'),
    (uk_country_id, 'Education', 'A-levels/Higher', 'What is your highest level of education?'),
    (uk_country_id, 'Education', 'Vocational/Trade qualification', 'What is your highest level of education?'),
    (uk_country_id, 'Education', 'Bachelor''s degree', 'What is your highest level of education?'),
    (uk_country_id, 'Education', 'Master''s degree', 'What is your highest level of education?'),
    (uk_country_id, 'Education', 'Doctorate/PhD', 'What is your highest level of education?');

    -- Employment Status
    INSERT INTO demoattributes (country_id, field_name, value, questiontext)
    VALUES
    (uk_country_id, 'Employment', 'Full-time employed', 'What is your current employment status?'),
    (uk_country_id, 'Employment', 'Part-time employed', 'What is your current employment status?'),
    (uk_country_id, 'Employment', 'Self-employed', 'What is your current employment status?'),
    (uk_country_id, 'Employment', 'Unemployed', 'What is your current employment status?'),
    (uk_country_id, 'Employment', 'Student', 'What is your current employment status?'),
    (uk_country_id, 'Employment', 'Retired', 'What is your current employment status?'),
    (uk_country_id, 'Employment', 'Homemaker', 'What is your current employment status?'),
    (uk_country_id, 'Employment', 'Unable to work', 'What is your current employment status?');

    -- Marital Status
    INSERT INTO demoattributes (country_id, field_name, value, questiontext)
    VALUES
    (uk_country_id, 'Marital Status', 'Single', 'What is your marital status?'),
    (uk_country_id, 'Marital Status', 'Married', 'What is your marital status?'),
    (uk_country_id, 'Marital Status', 'Civil partnership', 'What is your marital status?'),
    (uk_country_id, 'Marital Status', 'Divorced', 'What is your marital status?'),
    (uk_country_id, 'Marital Status', 'Widowed', 'What is your marital status?'),
    (uk_country_id, 'Marital Status', 'Separated', 'What is your marital status?');

    -- Household Size
    INSERT INTO demoattributes (country_id, field_name, value, questiontext)
    VALUES
    (uk_country_id, 'Household Size', '1 person', 'How many people live in your household?'),
    (uk_country_id, 'Household Size', '2 people', 'How many people live in your household?'),
    (uk_country_id, 'Household Size', '3 people', 'How many people live in your household?'),
    (uk_country_id, 'Household Size', '4 people', 'How many people live in your household?'),
    (uk_country_id, 'Household Size', '5+ people', 'How many people live in your household?');

    -- Children in Household
    INSERT INTO demoattributes (country_id, field_name, value, questiontext)
    VALUES
    (uk_country_id, 'Children', 'No children', 'How many children under 18 live in your household?'),
    (uk_country_id, 'Children', '1 child', 'How many children under 18 live in your household?'),
    (uk_country_id, 'Children', '2 children', 'How many children under 18 live in your household?'),
    (uk_country_id, 'Children', '3+ children', 'How many children under 18 live in your household?');

END $$;
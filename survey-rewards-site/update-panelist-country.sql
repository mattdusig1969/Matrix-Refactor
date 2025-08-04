-- Migration script to add country_id to panelist_stats and populate data

-- Step 1: Add country_id column to panelist_stats if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'panelist_stats' AND column_name = 'country_id'
    ) THEN
        ALTER TABLE panelist_stats ADD COLUMN country_id UUID;
        ALTER TABLE panelist_stats ADD CONSTRAINT fk_panelist_country 
            FOREIGN KEY (country_id) REFERENCES country(id);
    END IF;
END $$;

-- Step 2: Insert common countries if they don't exist
INSERT INTO country (country_name) VALUES 
    ('United States'),
    ('Canada'),
    ('United Kingdom'),
    ('Australia'),
    ('Germany'),
    ('France'),
    ('Spain'),
    ('Italy'),
    ('Netherlands'),
    ('Sweden')
ON CONFLICT (country_name) DO NOTHING;

-- Step 3: Update existing panelist records to map country text to country_id
-- This assumes panelists have a 'country' text field that we need to map to country_id

-- Map common country variations to the country table
UPDATE panelist_stats SET country_id = (
    SELECT id FROM country WHERE country_name = 'United States'
) WHERE country IN ('US', 'USA', 'United States', 'America');

UPDATE panelist_stats SET country_id = (
    SELECT id FROM country WHERE country_name = 'Canada'
) WHERE country IN ('CA', 'CAN', 'Canada');

UPDATE panelist_stats SET country_id = (
    SELECT id FROM country WHERE country_name = 'United Kingdom'
) WHERE country IN ('UK', 'GB', 'United Kingdom', 'Great Britain', 'England');

UPDATE panelist_stats SET country_id = (
    SELECT id FROM country WHERE country_name = 'Australia'
) WHERE country IN ('AU', 'AUS', 'Australia');

-- Add more mappings as needed for other countries

-- Step 4: Set a default country_id for any remaining null values (optional)
-- UPDATE panelist_stats SET country_id = (
--     SELECT id FROM country WHERE country_name = 'United States'
-- ) WHERE country_id IS NULL;

-- Step 5: Check the results
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.country as old_country,
    c.country_name as new_country,
    p.country_id
FROM panelist_stats p
LEFT JOIN country c ON p.country_id = c.id
LIMIT 10;

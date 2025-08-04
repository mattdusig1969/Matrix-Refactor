-- Earnly Survey Rewards Platform Database Setup
-- This script sets up the additional tables needed for the Earnly platform

-- Create panelist_earnings table for tracking all financial transactions
CREATE TABLE IF NOT EXISTS panelist_earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    panelist_id UUID NOT NULL REFERENCES panelists(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earning', 'cashout', 'bonus', 'penalty')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    source VARCHAR(50), -- 'survey_completion', 'signup_bonus', 'referral', 'profile_completion', etc.
    survey_id UUID, -- Optional reference to specific survey
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for panelist_earnings table
CREATE INDEX IF NOT EXISTS idx_panelist_earnings_panelist_id ON panelist_earnings(panelist_id);
CREATE INDEX IF NOT EXISTS idx_panelist_earnings_transaction_type ON panelist_earnings(transaction_type);
CREATE INDEX IF NOT EXISTS idx_panelist_earnings_created_at ON panelist_earnings(created_at);

-- Create panelist_survey_participations table to track survey completions
CREATE TABLE IF NOT EXISTS panelist_survey_participations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    panelist_id UUID NOT NULL REFERENCES panelists(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL, -- References surveys table
    status VARCHAR(20) NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'started', 'completed', 'screened_out', 'quota_full')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    responses JSONB, -- Store survey responses
    earnings_amount DECIMAL(10,2), -- Amount earned for this survey
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure panelist can only participate once per survey
    UNIQUE(panelist_id, survey_id)
);

-- Create indexes for panelist_survey_participations table
CREATE INDEX IF NOT EXISTS idx_panelist_survey_panelist_id ON panelist_survey_participations(panelist_id);
CREATE INDEX IF NOT EXISTS idx_panelist_survey_survey_id ON panelist_survey_participations(survey_id);
CREATE INDEX IF NOT EXISTS idx_panelist_survey_status ON panelist_survey_participations(status);

-- View to calculate current panelist balances and stats
CREATE OR REPLACE VIEW panelist_stats AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.mobile,
    p.language,
    p.created_at,
    
    -- Calculate total earnings (all positive transactions)
    COALESCE(SUM(CASE WHEN e.transaction_type IN ('earning', 'bonus') THEN e.amount ELSE 0 END), 0) as total_earnings,
    
    -- Calculate total cashouts (all negative transactions)
    COALESCE(SUM(CASE WHEN e.transaction_type = 'cashout' THEN e.amount ELSE 0 END), 0) as total_cashouts,
    
    -- Calculate available balance (earnings - cashouts)
    COALESCE(SUM(CASE 
        WHEN e.transaction_type IN ('earning', 'bonus') THEN e.amount 
        WHEN e.transaction_type = 'cashout' THEN -e.amount 
        ELSE 0 
    END), 0) as available_balance,
    
    -- Count surveys completed
    COUNT(DISTINCT ps.survey_id) FILTER (WHERE ps.status = 'completed') as surveys_completed,
    
    -- Calculate profile completion percentage
    CASE 
        WHEN pp.panelist_id IS NOT NULL THEN 100
        ELSE 25  -- Basic registration = 25%
    END as profile_completion_percentage

FROM panelists p
LEFT JOIN panelist_earnings e ON p.id = e.panelist_id AND e.status = 'completed'
LEFT JOIN panelist_survey_participations ps ON p.id = ps.panelist_id
LEFT JOIN panelist_profiles pp ON p.id = pp.panelist_id
GROUP BY p.id, p.first_name, p.last_name, p.email, p.mobile, p.language, p.created_at, pp.panelist_id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_panelists_email ON panelists(email);
CREATE INDEX IF NOT EXISTS idx_panelists_mobile ON panelists(mobile);
CREATE INDEX IF NOT EXISTS idx_panelists_created_at ON panelists(created_at);

-- Row Level Security (RLS) Policies
-- Enable RLS on new tables
ALTER TABLE panelist_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE panelist_survey_participations ENABLE ROW LEVEL SECURITY;

-- Policies for panelists table (assuming it already has RLS enabled)
-- Allow anyone to insert new panelists (for registration)
DROP POLICY IF EXISTS "Allow panelist registration" ON panelists;
CREATE POLICY "Allow panelist registration" ON panelists
    FOR INSERT 
    WITH CHECK (true);

-- Allow panelists to read their own data
DROP POLICY IF EXISTS "Panelists can read own data" ON panelists;
CREATE POLICY "Panelists can read own data" ON panelists
    FOR SELECT 
    USING (true); -- For now, allow reading all panelist data (adjust based on your auth system)

-- Allow panelists to update their own data
DROP POLICY IF EXISTS "Panelists can update own data" ON panelists;
CREATE POLICY "Panelists can update own data" ON panelists
    FOR UPDATE 
    USING (true) -- For now, allow updates (adjust based on your auth system)
    WITH CHECK (true);

-- Policies for panelist_earnings table
-- Allow anyone to insert earnings (for signup bonuses, survey completions, etc.)
DROP POLICY IF EXISTS "Allow earnings insertion" ON panelist_earnings;
CREATE POLICY "Allow earnings insertion" ON panelist_earnings
    FOR INSERT 
    WITH CHECK (true);

-- Allow reading earnings data
DROP POLICY IF EXISTS "Allow earnings reading" ON panelist_earnings;
CREATE POLICY "Allow earnings reading" ON panelist_earnings
    FOR SELECT 
    USING (true);

-- Policies for panelist_survey_participations table
-- Allow anyone to insert survey participations
DROP POLICY IF EXISTS "Allow survey participation insertion" ON panelist_survey_participations;
CREATE POLICY "Allow survey participation insertion" ON panelist_survey_participations
    FOR INSERT 
    WITH CHECK (true);

-- Allow reading survey participation data
DROP POLICY IF EXISTS "Allow survey participation reading" ON panelist_survey_participations;
CREATE POLICY "Allow survey participation reading" ON panelist_survey_participations
    FOR SELECT 
    USING (true);

-- Add some sample earnings categories/sources for reference
COMMENT ON COLUMN panelist_earnings.source IS 'Possible values: signup_bonus, survey_completion, profile_completion, referral_bonus, daily_checkin, loyalty_bonus, etc.';
COMMENT ON COLUMN panelist_earnings.transaction_type IS 'earning: money earned, cashout: money withdrawn, bonus: special bonuses, penalty: deductions';

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON panelist_earnings TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON panelist_survey_participations TO your_app_user;
-- GRANT SELECT ON panelist_stats TO your_app_user;

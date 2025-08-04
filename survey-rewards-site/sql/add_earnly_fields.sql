-- Add missing fields to existing panelists table
ALTER TABLE panelists 
ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS available_balance DECIMAL(10,2) DEFAULT 0.00;

-- Create panelist_rewards table if it doesn't exist
CREATE TABLE IF NOT EXISTS panelist_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panelist_id UUID NOT NULL REFERENCES panelists(id) ON DELETE CASCADE,
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('cash', 'points', 'gift_card')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_panelist_rewards_panelist_id ON panelist_rewards(panelist_id);
CREATE INDEX IF NOT EXISTS idx_panelist_rewards_status ON panelist_rewards(status);

-- Update the panelists table to make country field work with text instead of country_id
ALTER TABLE panelists 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Create panel_profiling_surveys table if it doesn't exist (renamed to match existing pattern)
CREATE TABLE IF NOT EXISTS panel_profiling_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panelist_id UUID NOT NULL REFERENCES panelists(id) ON DELETE CASCADE,
    survey_data JSONB NOT NULL,
    completion_status VARCHAR(20) NOT NULL DEFAULT 'started' CHECK (completion_status IN ('started', 'completed')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for profiling surveys
CREATE INDEX IF NOT EXISTS idx_panel_profiling_surveys_panelist_id ON panel_profiling_surveys(panelist_id);

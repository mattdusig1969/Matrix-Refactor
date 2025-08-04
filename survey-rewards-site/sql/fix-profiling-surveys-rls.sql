-- Add RLS policy for profiling_surveys to allow anonymous read access
-- This will allow the Earnly dashboard to read profiling surveys

-- Enable RLS if not already enabled
ALTER TABLE profiling_surveys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to profiling surveys" ON profiling_surveys;
DROP POLICY IF EXISTS "Allow anonymous read access to profiling surveys" ON profiling_surveys;

-- Create policy to allow anonymous users to read profiling surveys
CREATE POLICY "Allow anonymous read access to profiling surveys" 
ON profiling_surveys FOR SELECT 
TO anon 
USING (true);

-- Also allow authenticated users to read profiling surveys
CREATE POLICY "Allow authenticated read access to profiling surveys" 
ON profiling_surveys FOR SELECT 
TO authenticated 
USING (true);

-- Grant permissions to anon role
GRANT SELECT ON profiling_surveys TO anon;
GRANT SELECT ON profiling_surveys TO authenticated;

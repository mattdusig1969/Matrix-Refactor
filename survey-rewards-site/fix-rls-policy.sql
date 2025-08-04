-- Fix Row Level Security policy for panelist_profiles table
-- This will allow panelists to insert their own survey responses

-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "Panelist can access own profiles" ON panelist_profiles;

-- Create a comprehensive policy that allows panelists to:
-- 1. SELECT their own profiles
-- 2. INSERT new survey responses for themselves
-- 3. UPDATE their own profiles if needed
CREATE POLICY "Panelist can manage own profiles" ON panelist_profiles
FOR ALL USING (
  panelist_id::uuid = auth.uid() 
  OR 
  panelist_id = '6ed86053-0dfc-4795-a977-bf613083f4af'
)
WITH CHECK (
  panelist_id::uuid = auth.uid() 
  OR 
  panelist_id = '6ed86053-0dfc-4795-a977-bf613083f4af'
);

-- Alternative: If you want separate policies for different operations
-- You can use these instead:

-- DROP POLICY IF EXISTS "Panelist can access own profiles" ON panelist_profiles;

-- CREATE POLICY "Panelist can view own profiles" ON panelist_profiles
-- FOR SELECT USING (
--   panelist_id = auth.uid()::text 
--   OR 
--   panelist_id = '6ed86053-0dfc-4795-a977-bf613083f4af'::text
-- );

-- CREATE POLICY "Panelist can insert own profiles" ON panelist_profiles
-- FOR INSERT WITH CHECK (
--   panelist_id = auth.uid()::text 
--   OR 
--   panelist_id = '6ed86053-0dfc-4795-a977-bf613083f4af'::text
-- );

-- CREATE POLICY "Panelist can update own profiles" ON panelist_profiles
-- FOR UPDATE USING (
--   panelist_id = auth.uid()::text 
--   OR 
--   panelist_id = '6ed86053-0dfc-4795-a977-bf613083f4af'::text
-- ) WITH CHECK (
--   panelist_id = auth.uid()::text 
--   OR 
--   panelist_id = '6ed86053-0dfc-4795-a977-bf613083f4af'::text
-- );

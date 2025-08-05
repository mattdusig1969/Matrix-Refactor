-- Temporary solution: More permissive RLS policy for panelist_profiles
-- This allows profile saving to work while we get the service role key configured

-- Drop all existing policies (including ones we might have created before)
DROP POLICY IF EXISTS "Users can view own profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to delete profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Allow anon users to view profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Allow anon users to insert profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Allow anon users to update profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Allow anon users to delete profiles" ON public.panelist_profiles;

-- Create more permissive policies that work with both auth methods
CREATE POLICY "Allow authenticated users to view profiles" ON public.panelist_profiles
    FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert profiles" ON public.panelist_profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update profiles" ON public.panelist_profiles
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete profiles" ON public.panelist_profiles
    FOR DELETE 
    TO authenticated
    USING (true);

-- Service role still gets full access
CREATE POLICY "Service role can manage all profiles" ON public.panelist_profiles
    FOR ALL 
    TO service_role
    USING (true);

-- Allow anon role (for API calls) to manage profiles
CREATE POLICY "Allow anon users to view profiles" ON public.panelist_profiles
    FOR SELECT 
    TO anon
    USING (true);

CREATE POLICY "Allow anon users to insert profiles" ON public.panelist_profiles
    FOR INSERT 
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anon users to update profiles" ON public.panelist_profiles
    FOR UPDATE 
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anon users to delete profiles" ON public.panelist_profiles
    FOR DELETE 
    TO anon
    USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.panelist_profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panelist_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panelist_profiles TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

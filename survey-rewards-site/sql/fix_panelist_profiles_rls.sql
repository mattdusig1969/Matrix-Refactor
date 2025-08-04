-- Fix RLS policy for panelist_profiles table to allow users to manage their own profiles

-- Drop existing policies
DROP POLICY IF EXISTS "Panelist can access own profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Panelist can manage own profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.panelist_profiles;

-- Create comprehensive policies for panelist_profiles
-- Allow authenticated users to select their own profiles
CREATE POLICY "Users can view own profiles" ON public.panelist_profiles
    FOR SELECT 
    USING (auth.uid() = panelist_id::uuid);

-- Allow authenticated users to insert their own profiles
CREATE POLICY "Users can insert own profiles" ON public.panelist_profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = panelist_id::uuid);

-- Allow authenticated users to update their own profiles
CREATE POLICY "Users can update own profiles" ON public.panelist_profiles
    FOR UPDATE 
    USING (auth.uid() = panelist_id::uuid)
    WITH CHECK (auth.uid() = panelist_id::uuid);

-- Allow authenticated users to delete their own profiles
CREATE POLICY "Users can delete own profiles" ON public.panelist_profiles
    FOR DELETE 
    USING (auth.uid() = panelist_id::uuid);

-- Allow service role full access
CREATE POLICY "Service role can manage all profiles" ON public.panelist_profiles
    FOR ALL 
    USING (auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE public.panelist_profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panelist_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Fix RLS policies to work with our fallback authentication system
-- This creates more permissive policies that allow authenticated users to manage profiles

-- Drop existing policies on panelist_profiles
DROP POLICY IF EXISTS "Users can view own profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Panelist can access own profiles" ON public.panelist_profiles;
DROP POLICY IF EXISTS "Panelist can manage own profiles" ON public.panelist_profiles;

-- Create more flexible policies that work with our authentication system
-- Allow any authenticated connection to insert/update profiles for valid panelist IDs
CREATE POLICY "Allow profile management for valid panelists" ON public.panelist_profiles
    FOR ALL
    USING (
        -- Allow if the panelist_id exists in the panelists table
        EXISTS (
            SELECT 1 FROM public.panelists 
            WHERE id = panelist_profiles.panelist_id
        )
    )
    WITH CHECK (
        -- Same check for inserts/updates
        EXISTS (
            SELECT 1 FROM public.panelists 
            WHERE id = panelist_profiles.panelist_id
        )
    );

-- Allow service role full access
CREATE POLICY "Service role full access" ON public.panelist_profiles
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE public.panelist_profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panelist_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panelist_profiles TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Also ensure the API key has access to read panelists table for validation
GRANT SELECT ON public.panelists TO authenticated;
GRANT SELECT ON public.panelists TO anon;

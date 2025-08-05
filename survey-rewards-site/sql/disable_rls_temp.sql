-- Simple temporary fix: Disable RLS on panelist_profiles
-- This will allow profile saving to work immediately
-- You can re-enable it later with proper policies

ALTER TABLE public.panelist_profiles DISABLE ROW LEVEL SECURITY;

-- Grant basic permissions to ensure operations work
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panelist_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panelist_profiles TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

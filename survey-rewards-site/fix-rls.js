const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // We'll need this for admin operations
)

async function fixRLSPolicies() {
  console.log('Fixing RLS policies for panelist_profiles...')
  
  const sqlCommands = [
    // Drop existing policies
    `DROP POLICY IF EXISTS "Users can view own profiles" ON public.panelist_profiles;`,
    `DROP POLICY IF EXISTS "Users can insert own profiles" ON public.panelist_profiles;`,
    `DROP POLICY IF EXISTS "Users can update own profiles" ON public.panelist_profiles;`,
    `DROP POLICY IF EXISTS "Users can delete own profiles" ON public.panelist_profiles;`,
    `DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.panelist_profiles;`,
    `DROP POLICY IF EXISTS "Panelist can access own profiles" ON public.panelist_profiles;`,
    `DROP POLICY IF EXISTS "Panelist can manage own profiles" ON public.panelist_profiles;`,
    
    // Create more flexible policy
    `CREATE POLICY "Allow profile management for valid panelists" ON public.panelist_profiles
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.panelists 
          WHERE id = panelist_profiles.panelist_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.panelists 
          WHERE id = panelist_profiles.panelist_id
        )
      );`,
    
    // Service role access
    `CREATE POLICY "Service role full access" ON public.panelist_profiles
      FOR ALL 
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');`,
    
    // Enable RLS
    `ALTER TABLE public.panelist_profiles ENABLE ROW LEVEL SECURITY;`
  ]
  
  for (const sql of sqlCommands) {
    try {
      console.log('Executing:', sql.substring(0, 50) + '...')
      const { data, error } = await supabase.rpc('exec_sql', { sql_text: sql })
      if (error) {
        console.error('Error executing SQL:', error)
      } else {
        console.log('Success')
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }
  
  console.log('RLS policy update complete')
}

fixRLSPolicies()

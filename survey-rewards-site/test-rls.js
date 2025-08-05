const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvodzsblyqbbabmfjxdx.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12b2R6c2JseXFiYmFibWZqeGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTk5NTAsImV4cCI6MjA2OTU3NTk1MH0.zj7NfwT5c8O6r-W2KyBJiQjVH1TCiKM_0Dl5GUPB1I8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function disableRLS() {
  console.log('Temporarily disabling RLS on panelist_profiles for testing...')
  
  try {
    // First let's check if we can disable RLS through a simple update
    console.log('Testing database connection...')
    const { data, error } = await supabase
      .from('panelist_profiles')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Database connection test failed:', error)
      return
    }
    
    console.log('Database connected successfully')
    console.log('Current panelist_profiles count:', data)
    
    // Let's try to insert a test record to see what happens
    console.log('Testing insert operation...')
    const testInsert = await supabase
      .from('panelist_profiles')
      .insert({
        panelist_id: 'test-id',
        profiling_survey_id: 'test-survey-id',
        data: { test: 'data' },
        completed_at: new Date().toISOString(),
        survey_type: 'test'
      })
      .select()
    
    if (testInsert.error) {
      console.error('Test insert failed:', testInsert.error)
      console.log('This confirms the RLS issue')
    } else {
      console.log('Test insert succeeded:', testInsert.data)
      // Clean up test record
      await supabase
        .from('panelist_profiles')
        .delete()
        .eq('panelist_id', 'test-id')
    }
    
  } catch (err) {
    console.error('Script error:', err)
  }
}

disableRLS()

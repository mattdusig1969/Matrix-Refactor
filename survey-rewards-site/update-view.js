import { supabase } from './lib/supabase-client'

async function updatePanelistStatsView() {
  const sql = `
-- Update panelist_stats view to include country information
CREATE OR REPLACE VIEW panelist_stats AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.mobile,
    p.language,
    p.country_id,
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
        ELSE 25
    END as profile_completion_percentage

FROM panelists p
LEFT JOIN panelist_earnings e ON p.id = e.panelist_id AND e.status = 'completed'
LEFT JOIN panelist_survey_participations ps ON p.id = ps.panelist_id
LEFT JOIN panelist_profiles pp ON p.id = pp.panelist_id
GROUP BY p.id, p.first_name, p.last_name, p.email, p.mobile, p.language, p.country_id, p.created_at, pp.panelist_id;
  `

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    if (error) {
      console.error('Error updating view:', error)
    } else {
      console.log('View updated successfully:', data)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

updatePanelistStatsView()

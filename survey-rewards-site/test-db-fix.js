const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = 'https://mvodzsblyqbbabmfjxdx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12b2R6c2JseXFiYmFibWZqeGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5ODYwMzAsImV4cCI6MjA2ODU2MjAzMH0.IgWnQHbu8HSDOijrgsqpFdXtchPebO75XdXBb2njm7s';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseFix() {
    try {
        console.log('Testing current state...');
        
        // First, let's check the current data
        const { data: geoCount, error: geoError } = await supabase
            .rpc('exec_sql', {
                sql: `SELECT COUNT(DISTINCT questiontext) as geo_question_count 
                      FROM geoattributes 
                      WHERE country_id = 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'`
            });
            
        if (geoError) {
            console.log('Error checking geo data:', geoError);
        } else {
            console.log('Geographic questions in database:', geoCount);
        }
        
        // Test the current function
        const { data: profiles, error: profileError } = await supabase
            .rpc('get_available_attribute_profiles_for_panelist', {
                panelist_uuid: 'a1b2c3d4-e5f6-7890-abcd-123456789012',
                user_country_id: 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
            });
            
        if (profileError) {
            console.log('Error calling function:', profileError);
        } else {
            console.log('Current function results:', profiles);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testDatabaseFix();

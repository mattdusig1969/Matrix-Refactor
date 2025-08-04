const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Use service role key for admin operations
const supabaseUrl = 'https://mvodzsblyqbbabmfjxdx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12b2R6c2JseXFiYmFibWZqeGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5ODYwMzAsImV4cCI6MjA2ODU2MjAzMH0.IgWnQHbu8HSDOijrgsqpFdXtchPebO75XdXBb2njm7s';
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDatabaseFix() {
    try {
        console.log('Applying database fix...');
        
        // Read the SQL file
        const sqlContent = fs.readFileSync('./sql/UUID_CONSISTENT_SOLUTION.sql', 'utf8');
        
        // Split the SQL into individual statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt && !stmt.startsWith('--'));
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement) {
                console.log(`Executing statement ${i + 1}/${statements.length}...`);
                console.log('Statement:', statement.substring(0, 100) + '...');
                
                const { data, error } = await supabase.rpc('exec_sql_raw', {
                    query: statement
                });
                
                if (error) {
                    console.error(`Error in statement ${i + 1}:`, error);
                } else {
                    console.log(`Statement ${i + 1} executed successfully`);
                }
            }
        }
        
        console.log('Database fix applied. Testing...');
        
        // Test the function
        const { data: profiles, error: testError } = await supabase
            .rpc('get_available_attribute_profiles_for_panelist', {
                panelist_uuid: 'a1b2c3d4-e5f6-7890-abcd-123456789012',
                user_country_id: 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc'
            });
            
        if (testError) {
            console.log('Test failed:', testError);
        } else {
            console.log('SUCCESS! Function results:', profiles);
            const geoProfile = profiles.find(p => p.profile_type === 'location');
            console.log('Geographic Profile question count:', geoProfile?.question_count);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

applyDatabaseFix();

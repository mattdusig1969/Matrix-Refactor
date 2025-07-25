const { createClient } = require('@supabase/supabase-js');

// Create a test user for development
async function createTestUser() {
  const supabaseAdmin = createClient(
    'https://mvodzsblyqbbabmfjxdx.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12b2R6c2JseXFiYmFibWZqeGR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjk4NjAzMCwiZXhwIjoyMDY4NTYyMDMwfQ.hdb4e1NS6Kci3YQLm1Py7vubVx65t485_5G6ffOOIZc'
  );

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const testUser = existingUsers.users?.find(u => u.email === 'test@matrix.com');
    
    if (testUser) {
      console.log('✅ Test user already exists:', testUser.email);
      return;
    }

    // Create test user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'test@matrix.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User',
      },
      app_metadata: {
        role: 'admin',
        permissions: ['/simulator', '/admin/users'],
      },
    });

    if (error) {
      console.error('❌ Error creating test user:', error);
      return;
    }

    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@matrix.com');
    console.log('🔑 Password: password123');

    // Also insert into users table if it exists
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: data.user.id,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@matrix.com',
        role: 'admin'
      }]);

    if (insertError) {
      console.log('⚠️  Note: Could not insert into users table (may not exist):', insertError.message);
    } else {
      console.log('✅ User also added to users table');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestUser();

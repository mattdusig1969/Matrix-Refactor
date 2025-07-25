import { createClient } from '@supabase/supabase-js';
import UserAdminClient from './user-admin-client';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        <p className="text-red-500">Error fetching users: {error.message}</p>
      </div>
    );
  }

  return <UserAdminClient initialUsers={users} />;
}
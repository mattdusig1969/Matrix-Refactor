import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Check for server-side variables (used in API routes)
  const serverUrl = process.env.SUPABASE_URL || null;
  const serverServiceKeyExists = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check for client-side variables (public, used in components)
  const clientUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  const clientAnonKeyExists = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return NextResponse.json({
    message: "Vercel Environment Variable Check",
    server_variables: {
      SUPABASE_URL: serverUrl,
      SUPABASE_SERVICE_ROLE_KEY_EXISTS: serverServiceKeyExists,
    },
    client_variables: {
      NEXT_PUBLIC_SUPABASE_URL: clientUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_EXISTS: clientAnonKeyExists,
    }
  });
}
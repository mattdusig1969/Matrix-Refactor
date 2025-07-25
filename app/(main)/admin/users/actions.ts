"use server";

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function createUser(formData) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true, // Automatically confirm the user's email
    user_metadata: {
      first_name: formData.firstName,
      last_name: formData.lastName,
    },
    app_metadata: {
      role: formData.role,
      permissions: formData.permissions, // This will store the allowed navigation paths
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  // Revalidate the path to refresh the user list on the page
  revalidatePath('/admin/users');
  return { success: true, message: 'User created successfully.' };
}

export async function updateUser(userId, formData) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Only include password if it's provided
  const updateData: any = {
    user_metadata: {
      first_name: formData.firstName,
      last_name: formData.lastName,
    },
    app_metadata: {
      role: formData.role,
      permissions: formData.permissions,
    },
  };
  if (formData.password) {
    updateData.password = formData.password;
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: 'User updated successfully.' };
}

export async function deleteUser(userId) {
  if (!userId) {
    return { success: false, message: 'User ID is required.' };
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true, message: 'User deleted successfully.' };
}
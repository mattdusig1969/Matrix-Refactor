"use client";

import { useState, useEffect } from 'react';
import { createUser, deleteUser, updateUser } from './actions';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

const navItems = [
    { label: "Dashboard", href: "/simulator" },
    { label: "Clients", href: "/simulator/clients" },
    { label: "Surveys", href: "/simulator/surveys" },
    { label: "Reports", href: "/simulator/reports" },
    { label: "Admin", href: "/admin/users" },
];
const userRoles = ['admin', 'editor', 'viewer'];

function NewUserModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'viewer', permissions: [] });
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData({
          firstName: initialData.user_metadata?.first_name || '',
          lastName: initialData.user_metadata?.last_name || '',
          email: initialData.email || '',
          password: '',
          role: initialData.app_metadata?.role || 'viewer',
          permissions: initialData.app_metadata?.permissions || [],
        });
      } else {
        setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'viewer', permissions: [] });
      }
    }
  }, [initialData, isOpen, isEditing]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handlePermissionChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({ ...prev, permissions: checked ? [...prev.permissions, value] : prev.permissions.filter(p => p !== value) }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, initialData?.id);
  };

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")}>
      <div className={cn("bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl transform transition-all", isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0")}>
        <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Edit User' : 'Add New User'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" className="p-2 border rounded" required />
            <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" className="p-2 border rounded" required />
          </div>
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className="w-full p-2 border rounded" required disabled={isEditing} />
          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEditing ? "New Password (optional)" : "Password"} className="w-full p-2 border rounded" required={!isEditing} />
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded">{userRoles.map(role => <option key={role} value={role}>{role}</option>)}</select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Permissions</label>
            <div className="mt-2 p-4 border rounded-md grid grid-cols-2 gap-2">
              {navItems.map(item => (<label key={item.href} className="flex items-center gap-2"><input type="checkbox" value={item.href} onChange={handlePermissionChange} checked={formData.permissions.includes(item.href)} />{item.label}</label>))}
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save User</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserManagementTable({ users, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-lg border"><table className="min-w-full bg-white"><thead className="bg-gray-50"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th><th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-gray-200">{users.map((user) => (<tr key={user.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.user_metadata?.first_name} {user.user_metadata?.last_name}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.app_metadata?.role || 'N/A'}</td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4"><button onClick={() => onEdit(user)} className="text-indigo-600 hover:text-indigo-900">Edit</button><button onClick={() => onDelete(user.id)} className="text-red-600 hover:text-red-900">Delete</button></td></tr>))}</tbody></table></div>
  );
}

export default function UserAdminClient({ initialUsers }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const handleOpenModalForEdit = (user) => { setEditingUser(user); setIsModalOpen(true); };
  const handleOpenModalForCreate = () => { setEditingUser(null); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingUser(null); };
  const handleSaveUser = async (formData, userId) => {
    const result = await (userId ? updateUser(userId, formData) : createUser(formData));
    if (result.success) { toast.success(result.message); handleCloseModal(); } else { toast.error(result.message); }
  };
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const result = await deleteUser(userId);
      toast[result.success ? 'success' : 'error'](result.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold">User Management</h1><button onClick={handleOpenModalForCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow">+ Add User</button></div>
      <UserManagementTable users={initialUsers} onEdit={handleOpenModalForEdit} onDelete={handleDeleteUser} />
      <NewUserModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveUser} initialData={editingUser} />
    </div>
  );
}
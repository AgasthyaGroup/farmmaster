'use client';

import { useEffect, useState } from 'react';
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react';

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
  status: boolean;
}

const getRoleDisplayName = (roleName: string) => {
  if (roleName === 'SUPER_ADMIN') return 'SUPERADMIN';
  if (roleName === 'FARM_ADMIN') return 'ADMIN';
  return roleName;
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ name: '', description: '', permissions: '' });

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        const orderedRoles = [...result.data].sort((a, b) => {
          const priority = (name: string) => {
            if (name === 'SUPER_ADMIN') return 0;
            if (name === 'FARM_ADMIN') return 1;
            return 2;
          };
          return priority(a.name) - priority(b.name);
        });
        setRoles(orderedRoles);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to fetch roles' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch roles' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreateOrUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: form.name,
        description: form.description,
        permissions: form.permissions
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      };
      const res = await fetch(editingRoleId ? `/api/roles/${editingRoleId}` : '/api/roles', {
        method: editingRoleId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        setMessage({
          type: 'success',
          text: editingRoleId ? 'Role updated successfully' : 'Role added successfully',
        });
        setForm({ name: '', description: '', permissions: '' });
        setEditingRoleId(null);
        setShowForm(false);
        await fetchRoles();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save role' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save role' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRoleId(role._id);
    setForm({
      name: role.name,
      description: role.description || '',
      permissions: (role.permissions || []).join(', '),
    });
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) {
      setMessage({ type: 'error', text: 'System roles cannot be deleted' });
      return;
    }
    const confirmed = window.confirm(`Delete role ${role.name}?`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/roles/${role._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Role deleted successfully' });
        await fetchRoles();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete role' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete role' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Role Management</h1>
          <p className="text-slate-500 font-bold tracking-tight">Create and manage role definitions.</p>
        </div>
        <button
          onClick={() => {
            setEditingRoleId(null);
            setForm({ name: '', description: '', permissions: '' });
            setShowForm((prev) => !prev);
          }}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          Add New Role
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateOrUpdateRole} className="bg-white border border-slate-200 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Role name (e.g. VETERINARY)"
            required
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold"
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Role description (optional)"
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold md:col-span-2"
          />
          <input
            value={form.permissions}
            onChange={(e) => setForm({ ...form, permissions: e.target.value })}
            placeholder="Permissions (comma separated)"
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold md:col-span-3"
          />
          <button
            type="submit"
            disabled={submitting}
            className="md:col-span-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3 text-sm"
          >
            {submitting ? 'Saving...' : editingRoleId ? 'Update Role' : 'Save Role'}
          </button>
        </form>
      )}

      {message.text && (
        <div className={`rounded-xl px-4 py-3 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase">Role</th>
                <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase">Description</th>
                <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase">Permissions</th>
                <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role._id} className="border-t border-slate-100">
                  <td className="px-5 py-3 text-sm font-bold text-slate-900">{getRoleDisplayName(role.name)}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{role.description || '-'}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {(role.permissions || []).length > 0 ? role.permissions.join(', ') : '-'}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${role.status ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {role.status ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 disabled:opacity-50"
                        disabled={role.isSystem}
                        title={role.isSystem ? 'System roles cannot be deleted' : 'Delete role'}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr className="border-t border-slate-100">
                  <td colSpan={5} className="px-5 py-8 text-center text-sm font-semibold text-slate-500">
                    No roles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

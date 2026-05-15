'use client';

import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

interface Department {
  _id: string;
  name: string;
  status: boolean;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/departments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setDepartments(result.data);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to fetch departments' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch departments' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(editingId ? `/api/departments/${editingId}` : '/api/departments', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: editingId ? 'Department updated successfully' : 'Department created successfully' });
        setName('');
        setEditingId(null);
        setShowForm(false);
        await fetchDepartments();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save department' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save department' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (department: Department) => {
    setEditingId(department._id);
    setName(department.name);
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const handleDelete = async (department: Department) => {
    const confirmed = window.confirm(`Delete department ${department.name}?`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/departments/${department._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Department deleted successfully' });
        await fetchDepartments();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete department' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete department' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Departments</h1>
          <p className="text-slate-500 font-bold tracking-tight">Create, view, edit, and delete departments.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setName('');
            setShowForm((prev) => !prev);
          }}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          Create New Department
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Department name"
            required
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold md:col-span-2"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3 text-sm"
          >
            {submitting ? 'Saving...' : editingId ? 'Update Department' : 'Save Department'}
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
                <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase">Department</th>
                <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((department) => (
                <tr key={department._id} className="border-t border-slate-100">
                  <td className="px-5 py-3 text-sm font-bold text-slate-900">{department.name}</td>
                  <td className="px-5 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${department.status ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {department.status ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(department)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(department)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr className="border-t border-slate-100">
                  <td colSpan={3} className="px-5 py-8 text-center text-sm font-semibold text-slate-500">
                    No departments found
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

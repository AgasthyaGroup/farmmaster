'use client';

import { useEffect, useState } from 'react';
import { 
  UserPlus, 
  Mail, 
  Tractor, 
  X, 
  Loader2, 
  CheckCircle2, 
  Lock,
  ShieldCheck,
  Pencil,
  Trash2
} from 'lucide-react';

interface User {
  _id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'FARM_ADMIN' | 'INCHARGE';
  status: boolean;
  farmId?: { _id: string; name: string };
}

interface Farm {
  _id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ 
    userId: '',
    name: '', 
    email: '', 
    department: '',
    phone: '', 
    password: '', 
    role: 'FARM_ADMIN', 
    farmId: '' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [usersRes, farmsRes] = await Promise.all([
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/farms', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const usersResult = await usersRes.json();
      const farmsResult = await farmsRes.json();
      
      if (usersResult.success) setUsers(usersResult.data);
      if (farmsResult.success) setFarms(farmsResult.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const payload =
        editingUserId
          ? {
              name: newUser.name,
              userId: newUser.userId,
              email: newUser.email,
              department: newUser.department,
              phone: newUser.phone,
              role: newUser.role,
              farmId: newUser.role === 'SUPER_ADMIN' ? null : newUser.farmId,
            }
          : newUser;

      const res = await fetch(editingUserId ? `/api/users/${editingUserId}` : '/api/users', {
        method: editingUserId ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setMessage({
          type: 'success',
          text: editingUserId ? 'User updated successfully' : 'User created successfully',
        });
        setNewUser({ userId: '', name: '', email: '', department: '', phone: '', password: '', role: 'FARM_ADMIN', farmId: '' });
        setEditingUserId(null);
        await fetchData();
        setTimeout(() => setShowModal(false), 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user._id);
    setNewUser({
      name: user.name,
      userId: user.userId,
      email: user.email,
      department: user.department || '',
      phone: user.phone || '',
      password: '',
      role: user.role,
      farmId: user.role === 'SUPER_ADMIN' ? '' : (user.farmId?._id || ''),
    });
    setMessage({ type: '', text: '' });
    setShowModal(true);
  };

  const handleDeleteUser = async (id: string) => {
    const shouldDelete = window.confirm('Are you sure you want to disable this user?');
    if (!shouldDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        await fetchData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to disable user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disable user' });
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">User Management</h1>
          <p className="text-slate-500 font-bold tracking-tight">Identity management and administrative tier provisioning.</p>
        </div>
        <button 
          onClick={() => {
            setEditingUserId(null);
            setNewUser({ userId: '', name: '', email: '', department: '', phone: '', password: '', role: 'FARM_ADMIN', farmId: '' });
            setMessage({ type: '', text: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-4 bg-slate-900 hover:bg-slate-800 text-white px-10 py-5 rounded-[28px] font-black transition-all duration-300 shadow-2xl shadow-slate-900/20 active:scale-95 uppercase tracking-widest text-xs"
        >
          <UserPlus className="w-6 h-6" />
          Add New User
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">S.No</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">User ID</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{user.userId}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider border ${user.status ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {user.status ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" onClick={() => setShowModal(false)} />
          
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 w-full max-w-4xl relative z-10 shadow-3xl animate-in slide-in-from-bottom-32 duration-700">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-8">
                <div className="w-14 h-14 bg-slate-900 rounded-[20px] flex items-center justify-center shadow-3xl shadow-slate-900/40">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingUserId ? 'Edit User' : 'Add New User'}</h2>
                   <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-[0.3em] font-black">Authorized Credential Registry</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-300 hover:text-slate-900 transition-all transform hover:rotate-90 duration-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {message.text && (
              <div className={`mb-6 p-4 rounded-[20px] flex items-center gap-3 shadow-sm border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                {message.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                <p className="font-black text-sm">{message.text}</p>
              </div>
            )}

            <form onSubmit={handleSubmitUser} className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">User ID</label>
                  <input
                    required
                    value={newUser.userId}
                    onChange={(e) => setNewUser({...newUser, userId: e.target.value})}
                    placeholder="Enter user id"
                    className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Name</label>
                  <input
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="Enter full name"
                    className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Department</label>
                  <input
                    required
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                    placeholder="Enter department"
                    className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Mobile (Optional)</label>
                  <input
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    placeholder="+91..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Email</label>
                <div className="relative">
                   <Mail className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                   <input
                     type="email"
                     required
                     value={newUser.email}
                     onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                     placeholder="admin@enterprise.com"
                     className="w-full bg-slate-50 border border-slate-100 rounded-[16px] pl-11 pr-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                   />
                </div>
              </div>

              {!editingUserId && (
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Security Passphrase</label>
                  <div className="relative">
                     <Lock className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                     <input
                       type="password"
                       required
                       value={newUser.password}
                       onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                       placeholder="Initialize system key"
                       className="w-full bg-slate-50 border border-slate-100 rounded-[16px] pl-11 pr-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                     />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-black focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all appearance-none shadow-inner text-sm"
                  >
                    <option value="FARM_ADMIN" className="bg-white">Unit Controller</option>
                    <option value="INCHARGE" className="bg-white">Module Lead</option>
                    <option value="SUPER_ADMIN" className="bg-white">Master Authority</option>
                  </select>
                </div>
                {newUser.role !== 'SUPER_ADMIN' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Farm</label>
                    <select
                      required
                      value={newUser.farmId}
                      onChange={(e) => setNewUser({...newUser, farmId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all appearance-none shadow-inner text-sm"
                    >
                      <option value="" disabled className="bg-white">Select Host Unit</option>
                      {farms.map((farm) => (
                        <option key={farm._id} value={farm._id} className="bg-white">{farm.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-4 rounded-[18px] shadow-3xl shadow-slate-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-[0.15em] border-b-4 border-slate-950"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  editingUserId ? 'Update User' : 'Add New User'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Shield, 
  Tractor, 
  X, 
  Loader2, 
  CheckCircle2, 
  MoreVertical, 
  Lock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
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
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newUser)
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'User created successfully' });
        setNewUser({ name: '', email: '', phone: '', password: '', role: 'FARM_ADMIN', farmId: '' });
        await fetchData();
        setTimeout(() => setShowModal(false), 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Access Control</h1>
          <p className="text-slate-500 font-bold tracking-tight">Identity management and administrative tier provisioning.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-4 bg-slate-900 hover:bg-slate-800 text-white px-10 py-5 rounded-[28px] font-black transition-all duration-300 shadow-2xl shadow-slate-900/20 active:scale-95 uppercase tracking-widest text-xs"
        >
          <UserPlus className="w-6 h-6" />
          Provision Access
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {users.map((user) => (
            <div key={user._id} className="bg-white border border-slate-200 rounded-[40px] p-10 group relative hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-900/[0.03] transition-all duration-500 overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-bl-[120px] -z-1" />
               <div className="flex items-start gap-8 relative">
                  <div className="w-24 h-24 bg-white border border-slate-100 rounded-[36px] flex items-center justify-center text-slate-900 shadow-xl shadow-slate-900/5 group-hover:scale-105 transition-transform duration-500">
                     <Users className="w-10 h-10 opacity-70" />
                  </div>
                  <div className="flex-1 min-w-0 pt-2">
                     <div className="flex flex-col gap-2 mb-4">
                        <h3 className="text-2xl font-black text-slate-900 truncate tracking-tight leading-none">{user.name}</h3>
                        <div className="flex items-center gap-2">
                           <span className={`text-[9px] font-black px-3 py-1 rounded-lg tracking-widest uppercase border ${user.role === 'SUPER_ADMIN' ? 'bg-rose-50 text-rose-600 border-rose-100' : user.role === 'FARM_ADMIN' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {user.role}
                           </span>
                           <span className="w-1 h-1 bg-slate-200 rounded-full" />
                           <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${user.status ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{user.status ? 'Active' : 'Locked'}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex flex-col gap-4 text-sm text-slate-500 font-bold">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-50 rounded-xl"><Mail className="w-4 h-4 text-slate-400" /></div>
                           <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-50 rounded-xl"><Phone className="w-4 h-4 text-slate-400" /></div>
                           <span>{user.phone}</span>
                        </div>
                     </div>
                  </div>
                  <button className="p-3 text-slate-200 hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100">
                     <MoreVertical className="w-7 h-7" />
                  </button>
               </div>
               
               <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                     <div className="p-2 bg-blue-50/50 rounded-xl border border-blue-100/50"><Tractor className="w-4 h-4 text-blue-500" /></div>
                     <span className="tracking-tight">Target Unit: <span className="text-slate-900 font-black">{user.farmId?.name || 'Global Systems'}</span></span>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-100 group-hover:text-slate-300 transition-colors" />
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" onClick={() => setShowModal(false)} />
          
          <div className="bg-white border border-slate-200 rounded-[56px] p-16 w-full max-w-2xl relative z-10 shadow-3xl animate-in slide-in-from-bottom-32 duration-700">
            <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-slate-900 rounded-[36px] flex items-center justify-center shadow-3xl shadow-slate-900/40">
                  <ShieldCheck className="w-10 h-10 text-white" />
                </div>
                <div>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tight">Onboard Personnel</h2>
                   <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.4em] font-black">Authorized Credential Registry</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-5 bg-slate-50 hover:bg-slate-100 rounded-3xl text-slate-300 hover:text-slate-900 transition-all transform hover:rotate-90 duration-500"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {message.text && (
              <div className={`mb-12 p-8 rounded-[40px] flex items-center gap-5 shadow-sm border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                {message.type === 'success' && <CheckCircle2 className="w-8 h-8" />}
                <p className="font-black text-lg">{message.text}</p>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Identity Name</label>
                  <input
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="Enter full name"
                    className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 text-slate-900 font-bold focus:ring-8 focus:ring-slate-900/5 focus:bg-white transition-all text-lg shadow-inner"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Primary Contact</label>
                  <input
                    required
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    placeholder="+91..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 text-slate-900 font-bold focus:ring-8 focus:ring-slate-900/5 focus:bg-white transition-all text-lg shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Corporate Email Identifier</label>
                <div className="relative">
                   <Mail className="w-6 h-6 text-slate-300 absolute left-8 top-1/2 -translate-y-1/2" />
                   <input
                     type="email"
                     required
                     value={newUser.email}
                     onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                     placeholder="admin@enterprise.com"
                     className="w-full bg-slate-50 border border-slate-100 rounded-[28px] pl-20 pr-8 py-6 text-slate-900 font-bold focus:ring-8 focus:ring-slate-900/5 focus:bg-white transition-all text-lg shadow-inner"
                   />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Security Passphrase</label>
                <div className="relative">
                   <Lock className="w-6 h-6 text-slate-300 absolute left-8 top-1/2 -translate-y-1/2" />
                   <input
                     type="password"
                     required
                     value={newUser.password}
                     onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                     placeholder="Initialize system key"
                     className="w-full bg-slate-50 border border-slate-100 rounded-[28px] pl-20 pr-8 py-6 text-slate-900 font-bold focus:ring-8 focus:ring-slate-900/5 focus:bg-white transition-all text-lg shadow-inner"
                   />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Authorization Tier</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 text-slate-900 font-black focus:ring-8 focus:ring-slate-900/5 focus:bg-white transition-all appearance-none shadow-inner"
                  >
                    <option value="FARM_ADMIN" className="bg-white">Unit Controller</option>
                    <option value="INCHARGE" className="bg-white">Module Lead</option>
                    <option value="SUPER_ADMIN" className="bg-white">Master Authority</option>
                  </select>
                </div>
                {newUser.role !== 'SUPER_ADMIN' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Deployment Unit</label>
                    <select
                      required
                      value={newUser.farmId}
                      onChange={(e) => setNewUser({...newUser, farmId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 text-slate-900 font-bold focus:ring-8 focus:ring-slate-900/5 focus:bg-white transition-all appearance-none shadow-inner"
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
                className="w-full mt-10 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-8 rounded-[40px] shadow-3xl shadow-slate-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-5 text-2xl uppercase tracking-[0.2em] border-b-8 border-slate-950"
              >
                {submitting ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                  'Confirm Assignment'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

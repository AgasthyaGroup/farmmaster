'use client';

import { useEffect, useState } from 'react';
import { 
  Warehouse, 
  Tractor, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  X,
  Loader2,
  CheckCircle2,
  Circle,
  Hash,
  Users
} from 'lucide-react';

interface Shed {
  _id: string;
  name: string;
  code: string;
  lines: number;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE';
  farmId: {
    _id: string;
    name: string;
  };
}

interface Farm {
  _id: string;
  name: string;
}

export default function ShedsPage() {
  const [sheds, setSheds] = useState<Shed[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newShed, setNewShed] = useState({ 
    name: '', 
    code: '', 
    farmId: '', 
    lines: 0, 
    capacity: 0,
    remarks: '' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [shedsRes, farmsRes] = await Promise.all([
        fetch('/api/sheds', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/farms', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const shedsResult = await shedsRes.json();
      const farmsResult = await farmsRes.json();
      
      if (shedsResult.success) setSheds(shedsResult.data);
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

  const handleCreateShed = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sheds', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newShed)
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Shed created successfully' });
        setNewShed({ name: '', code: '', farmId: '', lines: 0, capacity: 0, remarks: '' });
        await fetchData();
        setTimeout(() => setShowModal(false), 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create shed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Shed Analytics</h1>
          <p className="text-slate-500 font-medium tracking-tight">Real-time status of livestock housing and row occupancy.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-3xl font-bold transition-all duration-300 shadow-2xl shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-6 h-6" />
          Onboard Shed
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-2xl shadow-slate-900/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shed Inventory ID</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Unit</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Config / Capacity</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sheds.map((shed) => (
                <tr key={shed._id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
                        <Warehouse className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-lg leading-none mb-1">{shed.name}</p>
                        <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest">{shed.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                      <Tractor className="w-4 h-4 opacity-40" />
                      <span className="text-sm">{shed.farmId?.name || 'Globally Pooled'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-6">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-slate-300 uppercase tracking-tighter mb-1">Rows</span>
                        <span className="text-lg font-black text-slate-900 font-mono">{shed.lines}</span>
                      </div>
                      <div className="w-px h-8 bg-slate-100" />
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-slate-300 uppercase tracking-tighter mb-1">Max Cap</span>
                        <span className="text-lg font-black text-slate-900 font-mono">{shed.capacity}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <Circle className={`w-2.5 h-2.5 fill-current ${shed.status === 'ACTIVE' ? 'text-emerald-500 animate-pulse' : 'text-slate-300'}`} />
                       <span className={`text-[10px] uppercase font-black tracking-widest ${shed.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`}>
                         {shed.status}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm hover:shadow-md transition-all">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl shadow-sm hover:shadow-md transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sheds.length === 0 && (
            <div className="p-20 text-center bg-white">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 border-dashed">
                <Warehouse className="w-10 h-10 text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold max-w-sm mx-auto">Asset base empty. Please initialize shed registries for your units.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setShowModal(false)} />
          
          <div className="bg-white border border-slate-200 rounded-[48px] p-12 w-full max-w-2xl relative z-10 shadow-3xl animate-in fade-in zoom-in duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100px]" />
            <div className="flex items-center justify-between mb-12 relative">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-600/30">
                  <Warehouse className="w-8 h-8 text-white" />
                </div>
                <div>
                   <h2 className="text-3xl font-black text-slate-900">Define Quarter</h2>
                   <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Infrastructure Entry</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-3 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 transition-all transform hover:rotate-90 duration-300"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {message.text && (
              <div className={`mb-10 p-6 rounded-3xl flex items-center gap-4 shadow-sm border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                {message.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                <p className="text-sm font-black">{message.text}</p>
              </div>
            )}

            <form onSubmit={handleCreateShed} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Primary Unit Assignment</label>
                <div className="relative">
                   <Tractor className="w-5 h-5 text-slate-300 absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" />
                   <select
                     required
                     value={newShed.farmId}
                     onChange={(e) => setNewShed({...newShed, farmId: e.target.value})}
                     className="w-full bg-slate-50 border border-slate-100 rounded-3xl pl-16 pr-6 py-5 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all appearance-none shadow-inner"
                   >
                     <option value="" disabled className="bg-white">Choose Host Unit</option>
                     {farms.map((farm) => (
                       <option key={farm._id} value={farm._id} className="bg-white">{farm.name}</option>
                     ))}
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Quarter Alias</label>
                  <div className="relative">
                    <Warehouse className="w-5 h-5 text-slate-300 absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      required
                      value={newShed.name}
                      onChange={(e) => setNewShed({...newShed, name: e.target.value})}
                      placeholder="E.g. Alpha Wing"
                      className="w-full bg-slate-50 border border-slate-100 rounded-3xl pl-16 pr-6 py-5 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Infrastructure ID</label>
                  <div className="relative">
                    <Hash className="w-5 h-5 text-slate-300 absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      required
                      value={newShed.code}
                      onChange={(e) => setNewShed({...newShed, code: e.target.value.toUpperCase()})}
                      placeholder="SQ-XXX"
                      className="w-full bg-slate-50 border border-slate-100 rounded-3xl pl-16 pr-6 py-5 text-slate-900 font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Operational Rows</label>
                  <input
                    type="number"
                    value={newShed.lines}
                    onChange={(e) => setNewShed({...newShed, lines: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-slate-900 font-black font-mono focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Max Asset Capacity</label>
                  <input
                    type="number"
                    value={newShed.capacity}
                    onChange={(e) => setNewShed({...newShed, capacity: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-slate-900 font-black font-mono focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-6 rounded-3xl shadow-3xl shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-4 text-xl mt-12 uppercase tracking-widest"
              >
                {submitting ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <span>Execute Commissioning</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

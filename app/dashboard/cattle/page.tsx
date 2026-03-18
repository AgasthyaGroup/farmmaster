'use client';

import { useEffect, useState } from 'react';
import { 
  Beef as CattleIcon, 
  Tag as TagIcon, 
  Warehouse, 
  MapPin, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  X,
  Loader2,
  CheckCircle2,
  Filter,
  Check,
  ChevronDown,
  Search
} from 'lucide-react';

interface Cattle {
  _id: string;
  name: string;
  code: string;
  type: 'COW' | 'BUFFALO' | 'CALF';
  status: boolean;
  farmId: { _id: string; name: string };
  tagId: { _id: string; code: string };
  shedId: { _id: string; name: string };
}

interface Item {
  _id: string;
  name?: string;
  code?: string;
  farmId?: string;
}

export default function CattlePage() {
  const [cattleList, setCattleList] = useState<Cattle[]>([]);
  const [farms, setFarms] = useState<Item[]>([]);
  const [sheds, setSheds] = useState<Item[]>([]);
  const [tags, setTags] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCattle, setNewCattle] = useState({ 
    name: '', 
    code: '', 
    farmId: '', 
    tagId: '', 
    shedId: '', 
    type: 'COW' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [cattleRes, farmsRes, shedsRes, tagsRes] = await Promise.all([
        fetch('/api/cattle', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/farms', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/sheds', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/tags', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const cattleResult = await cattleRes.json();
      const farmsResult = await farmsRes.json();
      const shedsResult = await shedsRes.json();
      const tagsResult = await tagsRes.json();
      
      if (cattleResult.success) setCattleList(cattleResult.data);
      if (farmsResult.success) setFarms(farmsResult.data);
      if (shedsResult.success) setSheds(shedsResult.data);
      if (tagsResult.success) {
        setTags(tagsResult.data.filter((t: any) => t.status === 'AVAILABLE'));
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCattle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/cattle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newCattle)
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Cattle registered successfully' });
        setNewCattle({ name: '', code: '', farmId: '', tagId: '', shedId: '', type: 'COW' });
        await fetchData();
        setTimeout(() => setShowModal(false), 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to register cattle' });
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
           <h1 className="text-4xl font-black text-slate-900 mb-2">Internal Livestock Registry</h1>
           <p className="text-slate-500 font-bold tracking-tight">Active asset tracking and biometric mapping of all animals.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-5 rounded-3xl font-black transition-all duration-300 shadow-2xl shadow-emerald-600/30 active:scale-95 uppercase tracking-widest text-sm"
        >
          <Plus className="w-6 h-6" />
          Assign Asset
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
         <div className="flex-1 w-full relative group">
            <Search className="w-6 h-6 text-slate-300 absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              placeholder="Search Asset Key or Alias..." 
              className="w-full bg-white border border-slate-200 rounded-[32px] pl-16 pr-8 py-5 text-sm font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
         </div>
         <div className="flex items-center gap-4 bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm">
            <div className="px-5 py-3 text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-2">
               <CattleIcon className="w-4 h-4" />
               Category: Bovine
            </div>
            <button className="p-3 text-slate-400 hover:text-slate-900 transition-colors"><Filter className="w-6 h-6" /></button>
         </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[48px] overflow-hidden shadow-2xl shadow-slate-900/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Asset Identity</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol ID (Tag)</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Spatial Mapping (Unit)</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Biometric Status</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-geist-sans">
              {cattleList.map((cattle) => (
                <tr key={cattle._id} className="hover:bg-slate-50/50 transition-all duration-500 group">
                  <td className="px-10 py-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-emerald-50 rounded-[28px] flex items-center justify-center text-emerald-600 border border-emerald-100 group-hover:scale-105 transition-transform shadow-inner">
                        <CattleIcon className="w-8 h-8 opacity-80" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-xl tracking-tighter leading-none mb-2">{cattle.name}</p>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">{cattle.code}</p>
                           <span className="w-1 h-1 bg-slate-200 rounded-full" />
                           <span className="text-[9px] font-black px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-md tracking-widest uppercase">{cattle.type}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3 w-fit">
                       <TagIcon className="w-4 h-4 text-indigo-500" />
                       <span className="text-sm font-black text-indigo-600 font-mono tracking-tighter">{cattle.tagId?.code || 'UNMAPPED'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                          <MapPin className="w-4 h-4 text-blue-400" />
                          <span>{cattle.farmId?.name}</span>
                       </div>
                       <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                          <Warehouse className="w-4 h-4 text-purple-400" />
                          <span>{cattle.shedId?.name}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <div className="flex items-center gap-3 text-emerald-600 text-xs font-black bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 w-fit shadow-sm">
                       <Check className="w-4 h-4" />
                       OPTIMAL
                    </div>
                  </td>
                  <td className="px-10 py-10 text-right">
                    <button className="p-3 text-slate-200 hover:text-slate-900 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-slate-200 transition-all opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-6 h-6" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {cattleList.length === 0 && (
            <div className="p-32 text-center bg-white border-t border-slate-50">
              <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
                 <CattleIcon className="w-12 h-12 text-slate-200" />
              </div>
              <p className="text-slate-400 font-black text-xl italic max-w-sm mx-auto">No digital assets recorded within the current registry.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={() => setShowModal(false)} />
          
          <div className="bg-white border border-slate-200 rounded-[64px] p-16 w-full max-w-3xl relative z-10 shadow-3xl animate-in slide-in-from-bottom-24 duration-700 overflow-y-auto max-h-[95vh] scrollbar-hide">
            <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-emerald-600 rounded-[36px] flex items-center justify-center shadow-3xl shadow-emerald-600/40">
                  <CattleIcon className="w-10 h-10 text-white" />
                </div>
                <div>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tight">Index Asset</h2>
                   <p className="text-[10px] text-emerald-600 mt-2 uppercase tracking-[0.3em] font-black">Lifeform Identification Protocol</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-4 bg-slate-50 hover:bg-slate-100 rounded-3xl text-slate-300 hover:text-slate-900 transition-all transform hover:rotate-90 duration-500"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {message.text && (
              <div className={`mb-12 p-8 rounded-[36px] flex items-center gap-5 shadow-sm border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                {message.type === 'success' && <CheckCircle2 className="w-8 h-8" />}
                <p className="font-black text-lg">{message.text}</p>
              </div>
            )}

            <form onSubmit={handleCreateCattle} className="grid grid-cols-2 gap-x-12 gap-y-10">
              <div className="space-y-4 col-span-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Biological Alias</label>
                <input
                  required
                  value={newCattle.name}
                  onChange={(e) => setNewCattle({...newCattle, name: e.target.value})}
                  placeholder="E.g. Sovereign"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[32px] px-8 py-6 text-slate-900 font-bold focus:ring-8 focus:ring-emerald-500/5 focus:bg-white transition-all text-xl shadow-inner border shadow-emerald-900/[0.02]"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">System Identity Code</label>
                <input
                  required
                  value={newCattle.code}
                  onChange={(e) => setNewCattle({...newCattle, code: e.target.value.toUpperCase()})}
                  placeholder="ASSET-77"
                  className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-slate-900 font-black font-mono tracking-[0.2em] focus:ring-8 focus:ring-emerald-500/5 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Protocol Identification (Tag)</label>
                <select
                  required
                  value={newCattle.tagId}
                  onChange={(e) => setNewCattle({...newCattle, tagId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-slate-900 font-black focus:ring-8 focus:ring-emerald-500/5 focus:bg-white transition-all appearance-none shadow-inner"
                >
                  <option value="" disabled className="bg-white">Select Protocol</option>
                  {tags.map((tag) => (
                    <option key={tag._id} value={tag._id} className="bg-white font-mono">{tag.code}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Enterprise Assignment</label>
                <select
                  required
                  value={newCattle.farmId}
                  onChange={(e) => setNewCattle({...newCattle, farmId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-slate-900 font-bold focus:ring-8 focus:ring-emerald-500/5 focus:bg-white transition-all appearance-none shadow-inner"
                >
                  <option value="" disabled className="bg-white">Choose Host Unit</option>
                  {farms.map((farm) => (
                    <option key={farm._id} value={farm._id} className="bg-white">{farm.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Spatial Storage (Quarter/Shed)</label>
                <select
                  required
                  value={newCattle.shedId}
                  onChange={(e) => setNewCattle({...newCattle, shedId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-slate-900 font-bold focus:ring-8 focus:ring-emerald-500/5 focus:bg-white transition-all appearance-none shadow-inner"
                >
                  <option value="" disabled className="bg-white">Choose Quarter</option>
                  {sheds.filter((s:any) => s.farmId === newCattle.farmId || !newCattle.farmId).map((shed) => (
                    <option key={shed._id} value={shed._id} className="bg-white">{shed.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-6 col-span-2 pt-6">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 text-center block">Biological Classification</label>
                <div className="grid grid-cols-3 gap-10">
                   {['COW', 'BUFFALO', 'CALF'].map((t) => (
                     <button
                       key={t}
                       type="button"
                       onClick={() => setNewCattle({...newCattle, type: t as any})}
                       className={`py-8 rounded-[40px] border-2 font-black transition-all flex flex-col items-center justify-center gap-3 shadow-sm ${newCattle.type === t ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xl shadow-emerald-600/30 ring-8 ring-emerald-500/5 scale-105' : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200'}`}
                     >
                       <CattleIcon className={`w-8 h-8 ${newCattle.type === t ? 'opacity-100' : 'opacity-20'}`} />
                       <span className="uppercase tracking-[0.2em] text-[10px]">{t}</span>
                     </button>
                   ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="col-span-2 mt-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-8 rounded-[48px] shadow-3xl shadow-emerald-600/50 active:scale-[0.98] transition-all flex items-center justify-center gap-5 text-2xl uppercase tracking-[0.2em] border-b-8 border-emerald-800"
              >
                {submitting ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                  <>
                    <span>Execute Asset Onboarding</span>
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

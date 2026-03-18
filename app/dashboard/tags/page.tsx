'use client';

import { useEffect, useState } from 'react';
import { 
  Tag as TagIcon, 
  Tractor, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  X,
  Loader2,
  CheckCircle2,
  Circle,
  Filter,
  Search,
  Scan
} from 'lucide-react';

interface Tag {
  _id: string;
  code: string;
  type: 'COW' | 'BUFFALO' | 'CALF';
  status: 'AVAILABLE' | 'ASSIGNED';
  farmId: {
    _id: string;
    name: string;
  };
}

interface Farm {
  _id: string;
  name: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTag, setNewTag] = useState({ 
    code: '', 
    farmId: '', 
    type: 'COW'
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filter, setFilter] = useState('ALL');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [tagsRes, farmsRes] = await Promise.all([
        fetch('/api/tags', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/farms', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const tagsResult = await tagsRes.json();
      const farmsResult = await farmsRes.json();
      
      if (tagsResult.success) setTags(tagsResult.data);
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

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newTag)
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Tag created successfully' });
        setNewTag({ code: '', farmId: '', type: 'COW' });
        await fetchData();
        setTimeout(() => setShowModal(false), 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create tag' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTags = tags.filter(tag => {
    if (filter === 'ALL') return true;
    return tag.status === filter;
  });

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Tag Registry</h1>
          <p className="text-slate-500 font-bold tracking-tight">Active UHF Identification & Asset Mapping.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 bg-amber-500 hover:bg-amber-600 text-white px-8 py-5 rounded-3xl font-black transition-all duration-300 shadow-2xl shadow-amber-500/20 active:scale-95 uppercase tracking-widest text-sm"
        >
          <Plus className="w-6 h-6" />
          Batch Register
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
         <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm self-start sm:self-auto">
            {['ALL', 'AVAILABLE', 'ASSIGNED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-tighter ${filter === f ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-900'}`}
              >
                {f}
              </button>
            ))}
         </div>
         <div className="flex-1 w-full relative group">
            <Search className="w-6 h-6 text-slate-300 absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-amber-500 transition-colors" />
            <input 
              placeholder="Search Tag Identifier..." 
              className="w-full bg-white border border-slate-200 rounded-[28px] pl-16 pr-8 py-5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/20 shadow-sm transition-all"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-slate-50 rounded-xl">
               <Scan className="w-5 h-5 text-slate-400" />
            </div>
         </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {filteredTags.map((tag) => (
            <div key={tag._id} className="bg-white border border-slate-200 rounded-[32px] p-8 hover:border-amber-300 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-slate-50 rounded-full border border-slate-100 -z-1" />
              <div className="flex justify-between items-start mb-8 relative">
                <div className={`p-4 rounded-2xl ${tag.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                  <TagIcon className="w-6 h-6" />
                </div>
                <div className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${tag.type === 'COW' ? 'bg-orange-50 text-orange-600 border-orange-100' : tag.type === 'BUFFALO' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-pink-50 text-pink-600 border-pink-100'}`}>
                  {tag.type}
                </div>
              </div>
              
              <h3 className="text-xl font-black font-mono text-slate-900 mb-2 leading-none tracking-tighter">{tag.code}</h3>
              <p className="text-xs text-slate-400 font-bold truncate mb-8">{tag.farmId?.name || 'Unit Unlinked'}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                 <div className="flex items-center gap-2">
                    <Circle className={`w-2.5 h-2.5 fill-current ${tag.status === 'AVAILABLE' ? 'text-emerald-500 animate-pulse' : 'text-blue-500'}`} />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{tag.status}</span>
                 </div>
                 <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-5 h-5" />
                 </button>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
            </div>
          ))}
          
          {filteredTags.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-slate-200 rounded-[40px] p-24 text-center bg-white">
              <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 transform rotate-12">
                 <TagIcon className="w-12 h-12 text-slate-200" />
              </div>
              <p className="text-slate-400 font-black text-xl italic max-w-sm mx-auto">Asset indexing null. Please initialize tag protocols.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowModal(false)} />
          
          <div className="bg-white border border-slate-200 rounded-[48px] p-12 w-full max-w-xl relative z-10 shadow-3xl animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/40">
                  <TagIcon className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Index Tag</h2>
                  <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Digital Asset Provisioning</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all transform hover:rotate-90 duration-300"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {message.text && (
              <div className={`mb-10 p-6 rounded-3xl flex items-center gap-4 shadow-sm border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                {message.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                <p className="font-black text-sm">{message.text}</p>
              </div>
            )}

            <form onSubmit={handleCreateTag} className="space-y-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Enterprise Unit Assignment</label>
                <div className="relative">
                   <Tractor className="w-6 h-6 text-slate-300 absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" />
                   <select
                     required
                     value={newTag.farmId}
                     onChange={(e) => setNewTag({...newTag, farmId: e.target.value})}
                     className="w-full bg-slate-50 border border-slate-100 rounded-3xl pl-16 pr-6 py-6 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:bg-white transition-all appearance-none shadow-inner"
                   >
                     <option value="" disabled className="bg-white">Choose unit for batch</option>
                     {farms.map((farm) => (
                       <option key={farm._id} value={farm._id} className="bg-white">{farm.name}</option>
                     ))}
                   </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Universal Identifier Code</label>
                <div className="relative">
                   <Hash className="w-6 h-6 text-slate-300 absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" />
                   <input
                     required
                     value={newTag.code}
                     onChange={(e) => setNewTag({...newTag, code: e.target.value.toUpperCase()})}
                     placeholder="E.g. TAG-XXXX-YYYY"
                     className="w-full bg-slate-50 border border-slate-100 rounded-3xl pl-16 pr-6 py-6 text-slate-900 font-black font-mono tracking-widest focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:bg-white transition-all shadow-inner"
                   />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Asset Class Categorization</label>
                <div className="grid grid-cols-3 gap-6">
                   {['COW', 'BUFFALO', 'CALF'].map((t) => (
                     <button
                       key={t}
                       type="button"
                       onClick={() => setNewTag({...newTag, type: t as any})}
                       className={`py-5 rounded-3xl border-2 font-black transition-all text-xs tracking-widest uppercase ${newTag.type === t ? 'bg-amber-500/5 border-amber-500 text-amber-600 shadow-xl shadow-amber-500/10' : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200'}`}
                     >
                       {t}
                     </button>
                   ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black py-7 rounded-[32px] shadow-3xl shadow-amber-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-4 text-xl mt-12 uppercase tracking-widest"
              >
                {submitting ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  'Commit To Registry'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Hash({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="4" y1="9" x2="20" y2="9"></line>
      <line x1="4" y1="15" x2="20" y2="15"></line>
      <line x1="10" y1="3" x2="8" y2="21"></line>
      <line x1="16" y1="3" x2="14" y2="21"></line>
    </svg>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { 
  Navigation, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  User,
  MapPin
} from 'lucide-react';

interface DeliveryExecutive {
  _id: string;
  name: string;
  phone: string;
}

interface DeliveryRoute {
  _id: string;
  routeName: string;
  routeCode: string;
  startPoint: string;
  endPoint: string;
  pincodes: string[];
  assignedExecutiveId: DeliveryExecutive | null;
  status: string;
  createdAt: string;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [executives, setExecutives] = useState<DeliveryExecutive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Modals/Forms State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<DeliveryRoute | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });

  // Form Fields
  const [form, setForm] = useState({
    routeName: '',
    routeCode: '',
    startPoint: '',
    endPoint: '',
    assignedExecutiveId: '',
    status: 'inactive',
  });

  const [pincodesInput, setPincodesInput] = useState('');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch Routes
      const routesRes = await fetch('/api/admin/delivery-routes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const routesResult = await routesRes.json();
      
      // Fetch Executives
      const execRes = await fetch('/api/admin/delivery-executives', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const execResult = await execRes.json();

      if (routesResult.success && execResult.success) {
        setRoutes(routesResult.data);
        // Only list active executives for new assignments
        setExecutives(execResult.data.filter((e: any) => e.status === 'active' || e._id === form.assignedExecutiveId));
      } else {
        setError(routesResult.error || execResult.error || 'Failed to load routes logistics');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading delivery routes data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingRoute(null);
    setForm({
      routeName: '',
      routeCode: '',
      startPoint: '',
      endPoint: '',
      assignedExecutiveId: '',
      status: 'inactive',
    });
    setPincodesInput('');
    setModalMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: DeliveryRoute) => {
    setEditingRoute(r);
    setForm({
      routeName: r.routeName || '',
      routeCode: r.routeCode || '',
      startPoint: r.startPoint || '',
      endPoint: r.endPoint || '',
      assignedExecutiveId: r.assignedExecutiveId ? r.assignedExecutiveId._id : '',
      status: r.status || 'inactive',
    });
    setPincodesInput(r.pincodes ? r.pincodes.join(', ') : '');
    setModalMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalMessage({ type: '', text: '' });

    const parsedPincodes = pincodesInput
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const payload = {
      ...form,
      pincodes: parsedPincodes,
      assignedExecutiveId: form.assignedExecutiveId || null,
    };

    try {
      const token = localStorage.getItem('token');
      const url = editingRoute ? `/api/admin/delivery-routes/${editingRoute._id}` : '/api/admin/delivery-routes';
      const method = editingRoute ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        setModalMessage({
          type: 'success',
          text: editingRoute ? 'Delivery route updated successfully' : 'Delivery route registered successfully'
        });
        await loadData();
        setTimeout(() => setIsModalOpen(false), 1200);
      } else {
        setModalMessage({ type: 'error', text: result.error || 'Failed to save delivery route' });
      }
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete delivery route "${name}"?`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/delivery-routes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        await loadData();
      } else {
        alert(result.error || 'Failed to delete route');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while deleting');
    }
  };

  const filteredRoutes = routes.filter(r => {
    const search = searchQuery.toLowerCase();
    return (
      r.routeName.toLowerCase().includes(search) ||
      r.routeCode.toLowerCase().includes(search) ||
      (r.assignedExecutiveId && r.assignedExecutiveId.name.toLowerCase().includes(search))
    );
  });

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Delivery Routes</h1>
          <p className="text-slate-500 font-bold tracking-tight">Define geographical delivery pathways, bound pincodes, and assign executive drivers.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-slate-900/10"
        >
          <Plus className="w-4 h-4" />
          Add Route
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-6 rounded-[24px]">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by route name, code, or driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-[16px] text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total Routes</span>
            <span className="text-2xl font-black text-slate-900">{routes.length}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-[20px] font-bold text-sm">
          {error}
        </div>
      )}

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
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Route Name</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Route Code</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Transit Line</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Covered Pincodes</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Assigned Driver</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                      No delivery routes configured.
                    </td>
                  </tr>
                ) : (
                  filteredRoutes.map((r) => (
                    <tr key={r._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-800 text-sm">
                            <Navigation className="w-5 h-5 text-slate-500" />
                          </div>
                          <span className="text-sm font-black text-slate-900 block">{r.routeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">{r.routeCode}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">
                        {r.startPoint && r.endPoint ? `${r.startPoint} ➔ ${r.endPoint}` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {r.pincodes && r.pincodes.length > 0 ? (
                            r.pincodes.map((pin, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                {pin}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {r.assignedExecutiveId ? (
                          <span className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            {r.assignedExecutiveId.name}
                          </span>
                        ) : (
                          <span className="text-rose-500 text-xs font-bold uppercase tracking-wider bg-rose-50 px-2 py-1 rounded-lg">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border uppercase tracking-wider ${
                          r.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(r._id, r.routeName)}
                            className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 hover:text-rose-700 transition-all border border-transparent hover:border-rose-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Route Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 w-full max-w-2xl relative z-10 shadow-3xl animate-in slide-in-from-bottom-32 duration-500 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-slate-900 rounded-[20px] flex items-center justify-center shadow-3xl shadow-slate-900/40">
                  <Navigation className="w-7 h-7 text-white" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                     {editingRoute ? 'Edit Delivery Route' : 'Configure New Route'}
                   </h2>
                   <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.3em] font-black">Regional Logistics Transit</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all transform hover:rotate-90 duration-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMessage.text && (
              <div className={`mb-6 p-4 rounded-[20px] flex items-center gap-3 shadow-sm border ${
                modalMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                {modalMessage.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {modalMessage.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                <p className="font-black text-sm">{modalMessage.text}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 pr-2">
              
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Route Name</label>
                <input
                  type="text"
                  required
                  value={form.routeName}
                  onChange={(e) => setForm({ ...form, routeName: e.target.value })}
                  placeholder="e.g. Outer Ring Road North"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Route Code</label>
                  <input
                    type="text"
                    required
                    value={form.routeCode}
                    onChange={(e) => setForm({ ...form, routeCode: e.target.value })}
                    placeholder="e.g. ROUTE_ORR_N"
                    className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Transit Start Point</label>
                  <input
                    type="text"
                    value={form.startPoint}
                    onChange={(e) => setForm({ ...form, startPoint: e.target.value })}
                    placeholder="e.g. Main Farm Hub"
                    className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Transit End Point</label>
                  <input
                    type="text"
                    value={form.endPoint}
                    onChange={(e) => setForm({ ...form, endPoint: e.target.value })}
                    placeholder="e.g. Indiranagar Distribution Depot"
                    className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Assigned Delivery Partner</label>
                <select
                  value={form.assignedExecutiveId}
                  onChange={(e) => setForm({ ...form, assignedExecutiveId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                >
                  <option value="">Unassigned</option>
                  {executives.map((exec) => (
                    <option key={exec._id} value={exec._id}>{exec.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Bound Pincodes (comma-separated)</label>
                <input
                  type="text"
                  value={pincodesInput}
                  onChange={(e) => setPincodesInput(e.target.value)}
                  placeholder="e.g. 560038, 560066, 560008"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    editingRoute ? 'Save Changes' : 'Register Route'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

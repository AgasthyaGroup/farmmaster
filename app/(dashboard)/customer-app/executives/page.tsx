'use client';

import { useEffect, useState } from 'react';
import { 
  UserCheck, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  Truck
} from 'lucide-react';

interface DeliveryExecutive {
  _id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehicleNumber: string;
  status: string;
  createdAt: string;
}

export default function ExecutivesPage() {
  const [executives, setExecutives] = useState<DeliveryExecutive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Modals/Forms State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExecutive, setEditingExecutive] = useState<DeliveryExecutive | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });

  // Form Fields
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'Bike',
    vehicleNumber: '',
    status: 'inactive',
  });

  const fetchExecutives = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/delivery-executives', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setExecutives(result.data);
      } else {
        setError(result.error || 'Failed to fetch delivery executives');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching delivery executives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutives();
  }, []);

  const handleOpenAddModal = () => {
    setEditingExecutive(null);
    setForm({
      name: '',
      phone: '',
      email: '',
      vehicleType: 'Bike',
      vehicleNumber: '',
      status: 'inactive',
    });
    setModalMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exec: DeliveryExecutive) => {
    setEditingExecutive(exec);
    setForm({
      name: exec.name || '',
      phone: exec.phone || '',
      email: exec.email || '',
      vehicleType: exec.vehicleType || 'Bike',
      vehicleNumber: exec.vehicleNumber || '',
      status: exec.status || 'inactive',
    });
    setModalMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const url = editingExecutive ? `/api/admin/delivery-executives/${editingExecutive._id}` : '/api/admin/delivery-executives';
      const method = editingExecutive ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const result = await res.json();
      if (result.success) {
        setModalMessage({
          type: 'success',
          text: editingExecutive ? 'Executive updated successfully' : 'Executive registered successfully'
        });
        await fetchExecutives();
        setTimeout(() => setIsModalOpen(false), 1200);
      } else {
        setModalMessage({ type: 'error', text: result.error || 'Failed to save delivery executive' });
      }
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete delivery executive "${name}"?`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/delivery-executives/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        await fetchExecutives();
      } else {
        alert(result.error || 'Failed to delete executive');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while deleting');
    }
  };

  const filteredExecutives = executives.filter(exec => {
    const search = searchQuery.toLowerCase();
    return (
      exec.name.toLowerCase().includes(search) ||
      exec.phone.toLowerCase().includes(search) ||
      exec.vehicleNumber.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Delivery Executives</h1>
          <p className="text-slate-500 font-bold tracking-tight">Manage logistics delivery executives, contact details, and vehicle assignments.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-slate-900/10"
        >
          <Plus className="w-4 h-4" />
          Add Executive
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-6 rounded-[24px]">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or vehicle number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-[16px] text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total Executives</span>
            <span className="text-2xl font-black text-slate-900">{executives.length}</span>
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
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Executive</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Email Address</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Vehicle Type</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Vehicle Number</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExecutives.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                      No delivery executives found.
                    </td>
                  </tr>
                ) : (
                  filteredExecutives.map((exec) => (
                    <tr key={exec._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-800 text-sm">
                            <UserCheck className="w-5 h-5 text-slate-500" />
                          </div>
                          <span className="text-sm font-black text-slate-900 block">{exec.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        <span className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {exec.phone}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {exec.email ? (
                          <span className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400" />
                            {exec.email}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{exec.vehicleType}</td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">{exec.vehicleNumber || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border uppercase tracking-wider ${
                          exec.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {exec.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(exec)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(exec._id, exec.name)}
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

      {/* Add/Edit Executive Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 w-full max-w-2xl relative z-10 shadow-3xl animate-in slide-in-from-bottom-32 duration-500 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-slate-900 rounded-[20px] flex items-center justify-center shadow-3xl shadow-slate-900/40">
                  <UserCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                     {editingExecutive ? 'Edit Delivery Executive' : 'Register Delivery Partner'}
                   </h2>
                   <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.3em] font-black">Personnel & Fleet Registry</p>
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
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
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

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ramesh@gmail.com"
                  className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Vehicle Type</label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                  >
                    <option value="Bike">Two Wheeler (Bike)</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Van">Three Wheeler (Van)</option>
                    <option value="Auto">Auto Rickshaw</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Vehicle License Plate No.</label>
                  <input
                    type="text"
                    value={form.vehicleNumber}
                    onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                    placeholder="e.g. KA-03-HA-1234"
                    className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                  />
                </div>
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
                    editingExecutive ? 'Save Changes' : 'Register Executive'
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

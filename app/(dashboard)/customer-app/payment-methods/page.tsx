'use client';

import { useEffect, useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface PaymentMethod {
  _id: string;
  name: string;
  code: string;
  description: string;
  enabled: boolean;
  displayOrder: number;
  createdAt: string;
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Modals/Forms State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });

  // Form Fields
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    enabled: true,
    displayOrder: 0,
  });

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/payment-methods', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setPaymentMethods(result.data);
      } else {
        setError(result.error || 'Failed to fetch payment methods');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching payment methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleOpenAddModal = () => {
    setEditingMethod(null);
    setForm({
      name: '',
      code: '',
      description: '',
      enabled: true,
      displayOrder: paymentMethods.length,
    });
    setModalMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setForm({
      name: method.name || '',
      code: method.code || '',
      description: method.description || '',
      enabled: method.enabled !== undefined ? method.enabled : true,
      displayOrder: method.displayOrder || 0,
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
      const url = editingMethod 
        ? `/api/admin/payment-methods/${editingMethod._id}`
        : '/api/admin/payment-methods';
      
      const method = editingMethod ? 'PUT' : 'POST';

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
          text: editingMethod ? 'Payment method updated successfully!' : 'Payment method added successfully!' 
        });
        fetchPaymentMethods();
        setTimeout(() => {
          setIsModalOpen(false);
        }, 1500);
      } else {
        setModalMessage({ type: 'error', text: result.error || 'Failed to save payment method' });
      }
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/payment-methods/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        fetchPaymentMethods();
      } else {
        alert(result.error || 'Failed to delete payment method');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  };

  const filteredMethods = paymentMethods.filter(method => 
    method.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    method.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">Payment Methods</h1>
            <p className="text-slate-500 font-medium">Manage payment methods available to customers</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-200 border-b-4 border-blue-800 active:border-b-0 active:translate-y-[4px]"
          >
            <Plus size={20} />
            Add Payment Method
          </button>
        </div>

        {/* Error Box */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-bold">Error Loading Payment Methods</p>
              <p className="text-red-600 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all font-medium"
            />
          </div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Total Methods: {filteredMethods.length}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <span className="text-slate-500 font-bold">Loading payment methods...</span>
          </div>
        ) : filteredMethods.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center shadow-sm">
            <CreditCard size={64} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-black text-slate-800 mb-1">No Payment Methods Found</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">
              {searchQuery ? "No payment methods match your search criteria." : "Get started by adding your first payment method."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMethods.map((method) => (
              <div 
                key={method._id} 
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <CreditCard size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-slate-800 leading-snug">{method.name}</h3>
                        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">{method.code}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      method.enabled 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {method.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm font-medium mb-6 min-h-[40px]">
                    {method.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-auto">
                  <div className="text-xs font-bold text-slate-400">
                    Order: {method.displayOrder}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(method)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(method._id)}
                      className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h2 className="text-xl font-black text-slate-800">
                  {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                {modalMessage.text && (
                  <div className={`p-4 rounded-xl flex items-start gap-3 text-sm font-bold ${
                    modalMessage.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800' 
                      : 'bg-red-50 text-red-800'
                  }`}>
                    {modalMessage.type === 'success' ? (
                      <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-600" size={18} />
                    ) : (
                      <AlertTriangle className="shrink-0 mt-0.5 text-red-600" size={18} />
                    )}
                    <span>{modalMessage.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      Method Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Cash on Delivery"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      Method Code *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingMethod}
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. COD"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      required
                      value={form.displayOrder}
                      onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Short description for customers..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="enabled" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                    Enable this payment method for customers
                  </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="animate-spin" size={18} />}
                    {editingMethod ? 'Save Changes' : 'Create Method'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

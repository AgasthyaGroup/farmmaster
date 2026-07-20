'use client';

import { useEffect, useState } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Calendar,
  Image as ImageIcon,
  Tag
} from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  code: string;
  image: string;
  volume: string;
  price: number;
  description: string;
  benefits: string[];
  status: string;
  createdAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Modals/Forms State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });

  // Form Fields
  const [form, setForm] = useState({
    name: '',
    code: '',
    image: '',
    volume: '',
    price: 0,
    description: '',
    status: 'inactive',
  });

  const [benefitsInput, setBenefitsInput] = useState('');

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setCategories(result.data);
      } else {
        setError(result.error || 'Failed to fetch categories catalog');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setForm({
      name: '',
      code: '',
      image: '',
      volume: '',
      price: 0,
      description: '',
      status: 'inactive',
    });
    setBenefitsInput('');
    setModalMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name || '',
      code: category.code || '',
      image: category.image || '',
      volume: category.volume || '',
      price: category.price || 0,
      description: category.description || '',
      status: category.status || 'inactive',
    });
    setBenefitsInput(category.benefits ? category.benefits.join('\n') : '');
    setModalMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalMessage({ type: '', text: '' });

    const parsedBenefits = benefitsInput
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    const payload = {
      ...form,
      price: Number(form.price),
      benefits: parsedBenefits,
    };

    try {
      const token = localStorage.getItem('token');
      const url = editingCategory ? `/api/admin/categories/${editingCategory._id}` : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

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
          text: editingCategory ? 'Category updated successfully' : 'Category created successfully'
        });
        await fetchCategories();
        setTimeout(() => setIsModalOpen(false), 1200);
      } else {
        setModalMessage({ type: 'error', text: result.error || 'Failed to save category' });
      }
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete category "${name}"?`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        await fetchCategories();
      } else {
        alert(result.error || 'Failed to delete category');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while deleting');
    }
  };

  const filteredCategories = categories.filter(category => {
    const search = searchQuery.toLowerCase();
    return (
      category.name.toLowerCase().includes(search) ||
      category.code.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Customer App Categories</h1>
          <p className="text-slate-500 font-bold tracking-tight">Manage classification structures, prices, and volumes of client product collections.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-slate-900/10"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-6 rounded-[24px]">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by category name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-[16px] text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total Categories</span>
            <span className="text-2xl font-black text-slate-900">{categories.length}</span>
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
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Code</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Volume / SKU Type</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Price (₹)</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Registered On</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                      No categories found in the catalog.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {category.image ? (
                            <img src={category.image} alt={category.name} className="w-10 h-10 object-cover rounded-xl" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-800 text-sm">
                              <Layers className="w-5 h-5 text-slate-500" />
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-black text-slate-900 block">{category.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">{category.description.substring(0, 40)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">{category.code}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{category.volume || '—'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{category.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border uppercase tracking-wider ${
                          category.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : category.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {category.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-300" />
                          {new Date(category.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(category)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category._id, category.name)}
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

      {/* Add/Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 w-full max-w-3xl relative z-10 shadow-3xl animate-in slide-in-from-bottom-32 duration-500 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-slate-900 rounded-[20px] flex items-center justify-center shadow-3xl shadow-slate-900/40">
                  <Layers className="w-7 h-7 text-white" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                     {editingCategory ? 'Edit Category Details' : 'Create Custom Product Category'}
                   </h2>
                   <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.3em] font-black">Digital Category Registry</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Category Config */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Category Identification</h3>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Category Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Milk & Shakes"
                      className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Category Code</label>
                    <input
                      type="text"
                      required
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      placeholder="e.g. DAIRY_MILK"
                      className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
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
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Parameters & Assets */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Properties & Styling</h3>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Volume / Size Format</label>
                    <input
                      type="text"
                      value={form.volume}
                      onChange={(e) => setForm({ ...form, volume: e.target.value })}
                      placeholder="e.g. 500 ml, 1 kg"
                      className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Image Asset Link</label>
                    <input
                      type="url"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      placeholder="https://example.com/category-thumb.jpg"
                      className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                    />
                  </div>
                </div>

              </div>

              {/* Description & Benefits */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2">Catalog Details</h3>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Category Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Provide a description copy for client category section..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Benefits (one per line)</label>
                  <textarea
                    rows={3}
                    value={benefitsInput}
                    onChange={(e) => setBenefitsInput(e.target.value)}
                    placeholder="• Probiotic enrichment&#10;• Preservative free processing&#10;• High dietary nutritional value"
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
                    editingCategory ? 'Save Changes' : 'Add Category'
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

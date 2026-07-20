'use client';

import { useEffect, useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Layers,
  DollarSign,
  Boxes,
  HelpCircle,
  Tag,
  Image as ImageIcon
} from 'lucide-react';

interface Category {
  name: string;
  code: string;
}

interface Subcategory {
  name: string;
  code: string;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
  description: string;
  benefits: string[];
  status: string;
  category: Category;
  subcategory: Subcategory;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Modals/Forms State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });

  // Form Fields
  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: 0,
    quantity: 0,
    size: '',
    image: '',
    description: '',
    status: 'inactive',
    categoryName: '',
    categoryCode: '',
    subcategoryName: '',
    subcategoryCode: '',
  });

  const [benefitsInput, setBenefitsInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setModalMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        setForm(prev => ({ ...prev, image: result.data.url }));
        setModalMessage({ type: 'success', text: 'Image uploaded successfully' });
      } else {
        setModalMessage({ type: 'error', text: result.error || 'Failed to upload image' });
      }
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message || 'Error uploading image' });
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setProducts(result.data);
      } else {
        setError(result.error || 'Failed to fetch products catalog');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      sku: '',
      price: 0,
      quantity: 0,
      size: '',
      image: '',
      description: '',
      status: 'inactive',
      categoryName: '',
      categoryCode: '',
      subcategoryName: '',
      subcategoryCode: '',
    });
    setBenefitsInput('');
    setModalMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      price: product.price || 0,
      quantity: product.quantity || 0,
      size: product.size || '',
      image: product.image || '',
      description: product.description || '',
      status: product.status || 'inactive',
      categoryName: product.category?.name || '',
      categoryCode: product.category?.code || '',
      subcategoryName: product.subcategory?.name || '',
      subcategoryCode: product.subcategory?.code || '',
    });
    setBenefitsInput(product.benefits ? product.benefits.join('\n') : '');
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
      name: form.name,
      sku: form.sku,
      price: Number(form.price),
      quantity: Number(form.quantity),
      size: form.size,
      image: form.image,
      description: form.description,
      status: form.status,
      benefits: parsedBenefits,
      category: {
        name: form.categoryName || 'General',
        code: form.categoryCode || 'GEN',
      },
      subcategory: {
        name: form.subcategoryName || 'General',
        code: form.subcategoryCode || 'GEN',
      }
    };

    try {
      const token = localStorage.getItem('token');
      const url = editingProduct ? `/api/admin/products/${editingProduct._id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

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
          text: editingProduct ? 'Product updated successfully' : 'Product created successfully'
        });
        await fetchProducts();
        setTimeout(() => setIsModalOpen(false), 1200);
      } else {
        setModalMessage({ type: 'error', text: result.error || 'Failed to save product' });
      }
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete product "${name}"?`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        await fetchProducts();
      } else {
        alert(result.error || 'Failed to delete product');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while deleting');
    }
  };

  const filteredProducts = products.filter(product => {
    const search = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(search) ||
      product.sku.toLowerCase().includes(search) ||
      (product.category?.name && product.category.name.toLowerCase().includes(search))
    );
  });

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Customer App Products</h1>
          <p className="text-slate-500 font-bold tracking-tight">Manage the active inventory, prices, and categories displayed in client apps.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-slate-900/10"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-6 rounded-[24px]">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-[16px] text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total Products</span>
            <span className="text-2xl font-black text-slate-900">{products.length}</span>
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
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Product Info</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">SKU</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Size</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Stock Qty</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                      No products found in the catalog.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-xl" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-800 text-sm">
                              <Package className="w-5 h-5 text-slate-500" />
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-black text-slate-900 block">{product.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">{product.description.substring(0, 40)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{product.sku}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        <div className="flex flex-col">
                          <span>{product.category?.name || '—'}</span>
                          <span className="text-[10px] text-slate-400">{product.subcategory?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-bold">{product.size || '—'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{product.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{product.quantity}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border uppercase tracking-wider ${
                          product.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : product.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id, product.name)}
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

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 w-full max-w-4xl relative z-10 shadow-3xl animate-in slide-in-from-bottom-32 duration-500 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-slate-900 rounded-[20px] flex items-center justify-center shadow-3xl shadow-slate-900/40">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                     {editingProduct ? 'Edit Product Details' : 'Add New Catalog Product'}
                   </h2>
                   <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.3em] font-black">Digital Catalog Registry</p>
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
                
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Basic Info</h3>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Product Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Fresh Organic Whole Milk"
                      className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">SKU / Code</label>
                    <input
                      type="text"
                      required
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      placeholder="e.g. MILK-ORG-1L"
                      className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Price (₹)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Quantity</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Size / Volume</label>
                      <input
                        type="text"
                        value={form.size}
                        onChange={(e) => setForm({ ...form, size: e.target.value })}
                        placeholder="e.g. 1 Litre, 500g"
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

                {/* Categorization and Assets */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Classification</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Category Name</label>
                      <input
                        type="text"
                        value={form.categoryName}
                        onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                        placeholder="e.g. Dairy"
                        className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Category Code</label>
                      <input
                        type="text"
                        value={form.categoryCode}
                        onChange={(e) => setForm({ ...form, categoryCode: e.target.value })}
                        placeholder="e.g. DAIRY"
                        className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Subcategory Name</label>
                      <input
                        type="text"
                        value={form.subcategoryName}
                        onChange={(e) => setForm({ ...form, subcategoryName: e.target.value })}
                        placeholder="e.g. Organic Milk"
                        className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Subcategory Code</label>
                      <input
                        type="text"
                        value={form.subcategoryCode}
                        onChange={(e) => setForm({ ...form, subcategoryCode: e.target.value })}
                        placeholder="e.g. MILK_ORG"
                        className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Product Image</label>
                    {form.image ? (
                      <div className="relative w-full h-32 rounded-[16px] overflow-hidden border border-slate-200 bg-slate-50 group">
                        <img src={form.image} alt="Preview" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                          className="absolute top-2 right-2 p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all shadow-md active:scale-90"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-[16px] cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploadingImage ? (
                            <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                          ) : (
                            <>
                              <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                              <p className="text-xs text-slate-500 font-bold">Click to upload product image</p>
                              <p className="text-[9px] text-slate-400">PNG, JPG or WEBP</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingImage}
                          onChange={handleImageUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>

              </div>

              {/* Description & Benefits */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2">Description & Details</h3>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Product Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Provide a premium product marketing copy description..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Benefits (one per line)</label>
                  <textarea
                    rows={3}
                    value={benefitsInput}
                    onChange={(e) => setBenefitsInput(e.target.value)}
                    placeholder="• Rich in Calcium&#10;• 100% Organic certified&#10;• Directly from local cow farms"
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
                    editingProduct ? 'Save Changes' : 'Add Product'
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

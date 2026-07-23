'use client';

import { useEffect, useState } from 'react';
import { 
  Boxes, 
  Search, 
  Loader2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  size: string;
  categoryName: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localQuantities, setLocalQuantities] = useState<Record<string, string>>({});

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/products', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (result.success) {
        setProducts(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch products');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUpdateStock = async (productId: string, newQuantity: number) => {
    const safeQuantity = Math.max(0, newQuantity);
    setUpdatingId(productId);
    setError('');
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: safeQuantity })
      });

      const result = await res.json();
      if (result.success) {
        setProducts(prev => 
          prev.map(p => p._id === productId ? { ...p, quantity: safeQuantity } : p)
        );
        // Clear local quantity for this product so it falls back to products.quantity
        setLocalQuantities(prev => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
        setSuccessMessage('Stock updated successfully');
        setTimeout(() => setSuccessMessage(null), 2000);
      } else {
        setError(result.error || 'Failed to update stock');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Customer App Inventory</h1>
          <p className="text-slate-500">Manage and update stock quantities dynamically without leaving this view.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Search Header */}
      <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, SKU or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          Total Products: {filteredProducts.length}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-500 text-sm font-medium">Loading live inventory catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-center px-4">
          <Boxes className="h-14 w-14 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Products Found</h3>
          <p className="text-slate-500 max-w-md text-sm">
            {searchQuery ? "We couldn't find any products matching your search query." : "There are currently no products registered."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-64">Stock Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-bold text-slate-700">{product.sku}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-950 text-sm">{product.name}</div>
                      <div className="text-xs text-slate-500 font-medium">{product.size}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        {product.categoryName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{product.price}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            const nextQty = product.quantity - 1;
                            setLocalQuantities(prev => ({ ...prev, [product._id]: nextQty.toString() }));
                            handleUpdateStock(product._id, nextQty);
                          }}
                          disabled={product.quantity <= 0 || updatingId === product._id}
                          className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        
                        <input
                          type="number"
                          value={localQuantities[product._id] !== undefined ? localQuantities[product._id] : product.quantity}
                          min="0"
                          onChange={(e) => {
                            setLocalQuantities(prev => ({
                              ...prev,
                              [product._id]: e.target.value
                            }));
                          }}
                          onBlur={() => {
                            const valStr = localQuantities[product._id];
                            if (valStr !== undefined) {
                              const val = valStr === '' ? 0 : parseInt(valStr);
                              const safeVal = isNaN(val) ? 0 : Math.max(0, val);
                              if (safeVal !== product.quantity) {
                                handleUpdateStock(product._id, safeVal);
                              } else {
                                setLocalQuantities(prev => {
                                  const next = { ...prev };
                                  delete next[product._id];
                                  return next;
                                });
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-20 text-center font-bold text-sm bg-slate-50 border border-slate-200 py-1.5 px-2 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />

                        <button
                          onClick={() => {
                            const nextQty = product.quantity + 1;
                            setLocalQuantities(prev => ({ ...prev, [product._id]: nextQty.toString() }));
                            handleUpdateStock(product._id, nextQty);
                          }}
                          disabled={updatingId === product._id}
                          className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        
                        {updatingId === product._id && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600 ml-1" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

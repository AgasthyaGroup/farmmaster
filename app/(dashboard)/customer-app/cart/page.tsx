'use client';

import { useEffect, useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  User, 
  Phone, 
  Calendar, 
  Loader2, 
  Package, 
  Trash2, 
  Eye, 
  X, 
  DollarSign, 
  ShoppingBag,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

interface Customer {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
}

interface ProductDetails {
  name?: string;
  image?: string;
  price?: number;
  size?: string;
  sku?: string;
  categoryName?: string;
}

interface CartItem {
  _id: string;
  productId: string;
  quantity: number;
  price: number;
  addedAt: string;
  product?: ProductDetails | null;
}

interface CartData {
  _id: string;
  customerId?: Customer | null;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export default function CartPage() {
  const [carts, setCarts] = useState<CartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [selectedCart, setSelectedCart] = useState<CartData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCarts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setCarts(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch customer carts');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching carts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, []);

  const handleDeleteCart = async (cartId: string) => {
    if (!confirm('Are you sure you want to clear/delete this customer cart?')) return;
    setDeletingId(cartId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/cart/${cartId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setCarts(prev => prev.filter(c => c._id !== cartId));
        if (selectedCart?._id === cartId) setSelectedCart(null);
      } else {
        alert(result.error || 'Failed to delete cart');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while deleting cart');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCarts = carts.filter(cart => {
    const search = searchQuery.toLowerCase();
    const customer = cart.customerId;
    const nameMatch = customer?.name?.toLowerCase().includes(search) || false;
    const phoneMatch = customer?.phone?.includes(search) || false;
    const emailMatch = customer?.email?.toLowerCase().includes(search) || false;
    const itemProductMatch = cart.items.some(
      item => item.productId.toLowerCase().includes(search) || item.product?.name?.toLowerCase().includes(search)
    );
    return nameMatch || phoneMatch || emailMatch || itemProductMatch;
  });

  const totalActiveCarts = carts.filter(c => c.totalItems > 0).length;
  const totalCartItems = carts.reduce((acc, c) => acc + c.totalItems, 0);
  const totalCartValue = carts.reduce((acc, c) => acc + c.totalPrice, 0);
  const avgCartValue = totalActiveCarts > 0 ? (totalCartValue / totalActiveCarts).toFixed(2) : '0';

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Customer Carts
            </h1>
          </div>
          <p className="text-slate-500 font-bold text-sm tracking-tight pl-1">
            Monitor, inspect, and manage active shopping carts across customer mobile apps.
          </p>
        </div>

        <button
          onClick={() => fetchCarts(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1">Active Carts</span>
            <span className="text-3xl font-black text-slate-900">{totalActiveCarts}</span>
            <span className="text-xs font-bold text-slate-500 block mt-1">out of {carts.length} total saved</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1">Total Items</span>
            <span className="text-3xl font-black text-slate-900">{totalCartItems}</span>
            <span className="text-xs font-bold text-slate-500 block mt-1">in customer carts</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1">Total Cart Value</span>
            <span className="text-3xl font-black text-emerald-600">₹{totalCartValue.toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-500 block mt-1">potential orders</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1">Avg Cart Value</span>
            <span className="text-3xl font-black text-purple-600">₹{avgCartValue}</span>
            <span className="text-xs font-bold text-slate-500 block mt-1">per active cart</span>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search and Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-5 rounded-[24px] shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer name, phone, email, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-[16px] text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Filtered Carts</span>
            <span className="text-2xl font-black text-slate-900">{filteredCarts.length}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-[20px] font-bold text-sm">
          {error}
        </div>
      )}

      {/* Main Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-[32px] border border-slate-200">
          <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">S.No</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Mobile</th>
                  <th className="text-center px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Items Qty</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Cart Total</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Last Updated</th>
                  <th className="text-right px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCarts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-bold text-sm">
                      No customer shopping carts found.
                    </td>
                  </tr>
                ) : (
                  filteredCarts.map((cart, index) => (
                    <tr key={cart._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center font-black text-emerald-600 text-sm border border-emerald-100">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-900 block">
                              {cart.customerId?.name || 'Guest / Anonymous'}
                            </span>
                            {cart.customerId?.email && (
                              <span className="text-xs font-bold text-slate-400 block">
                                {cart.customerId.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {cart.customerId?.phone ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {cart.customerId.phone}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-black">
                          {cart.totalItems} items
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-emerald-600">
                        ₹{cart.totalPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(cart.updatedAt || cart.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCart(cart)}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all font-bold text-xs flex items-center gap-1"
                            title="Inspect Cart Items"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Items</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCart(cart._id)}
                            disabled={deletingId === cart._id}
                            className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all font-bold text-xs flex items-center gap-1 disabled:opacity-50"
                            title="Clear Customer Cart"
                          >
                            {deletingId === cart._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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

      {/* Cart Details Modal */}
      {selectedCart && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Cart Items Details
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    Customer: {selectedCart.customerId?.name || 'Anonymous'} ({selectedCart.customerId?.phone || 'No Phone'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCart(null)}
                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedCart.items.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-bold">
                  No items in this cart.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selectedCart.items.map((item, idx) => (
                    <div key={item._id || idx} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200">
                          {item.product?.image ? (
                            <img src={item.product.image} alt={item.product.name || 'Product'} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">
                            {item.product?.name || `Product (${item.productId})`}
                          </h4>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-0.5">
                            <span>Qty: {item.quantity}</span>
                            <span>•</span>
                            <span>Unit: ₹{item.price}</span>
                            {item.product?.size && (
                              <>
                                <span>•</span>
                                <span>{item.product.size}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-600 block">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">Cart Subtotal</span>
                <span className="text-2xl font-black text-slate-900">₹{selectedCart.totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteCart(selectedCart._id)}
                  className="px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl text-sm font-bold transition-all"
                >
                  Clear Cart
                </button>
                <button
                  onClick={() => setSelectedCart(null)}
                  className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl text-sm font-bold transition-all shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

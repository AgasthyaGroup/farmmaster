'use client';

import { useEffect, useState } from 'react';
import { 
  Heart, 
  Search, 
  User, 
  Phone, 
  Calendar, 
  Loader2, 
  Package
} from 'lucide-react';

interface Customer {
  _id: string;
  name?: string;
  phone: string;
  email?: string;
}

interface Favourite {
  _id: string;
  customerId: Customer;
  productId: string;
  createdAt: string;
}

export default function FavoritesPage() {
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const fetchFavourites = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/favourites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setFavourites(result.data);
      } else {
        setError(result.error || 'Failed to fetch customer favourites');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching favourites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavourites();
  }, []);

  const filteredFavourites = favourites.filter(fav => {
    const search = searchQuery.toLowerCase();
    const customer = fav.customerId;
    const nameMatch = customer?.name?.toLowerCase().includes(search) || false;
    const phoneMatch = customer?.phone?.includes(search) || false;
    const productMatch = fav.productId.toLowerCase().includes(search);
    return nameMatch || phoneMatch || productMatch;
  });

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Customer Favorites</h1>
          <p className="text-slate-500 font-bold tracking-tight">Products favorited by mobile client app users.</p>
        </div>
      </div>

      {/* Search and stats bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-6 rounded-[24px]">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or product ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-[16px] text-slate-900 font-bold focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm shadow-inner"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Total Favorited Items</span>
            <span className="text-2xl font-black text-slate-900">{favourites.length}</span>
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
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">S.No</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Mobile</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Product ID</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Favorited On</th>
                </tr>
              </thead>
              <tbody>
                {filteredFavourites.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                      No favorited products found.
                    </td>
                  </tr>
                ) : (
                  filteredFavourites.map((fav, index) => (
                    <tr key={fav._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center font-bold text-rose-600 text-sm">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-black text-slate-900 block">
                            {fav.customerId?.name || 'Anonymous User'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {fav.customerId?.phone || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          {fav.productId}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-300" />
                          {new Date(fav.createdAt).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

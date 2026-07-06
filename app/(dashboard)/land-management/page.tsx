'use client';

import { useEffect, useState } from 'react';
import { 
  Map, 
  Tractor, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  Loader2,
  CheckCircle2,
  MapPin,
  Calendar,
  Phone,
  User,
  Info,
  Layers,
  FileText
} from 'lucide-react';

interface Farm {
  _id: string;
  name: string;
  id?: string;
}

interface Land {
  _id: string;
  name: string;
  code: string;
  totalArea: number;
  unit: 'Acres' | 'Hectares' | 'Sq Meters';
  status: 'AVAILABLE' | 'MAINTENANCE';
  location?: string;
  description?: string;
  farmId: Farm;
  
  // Ownership details (owned or leased for cultivation)
  ownershipType?: 'OWNED' | 'LEASED';
  landownerName?: string;
  landownerPhone?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  rentAmount?: number;
  paymentInterval?: 'Monthly' | 'Quarterly' | 'Yearly';
  createdAt: string;
}

export default function LandManagementPage() {
  const [lands, setLands] = useState<Land[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'leases'>('all');
  const [userRole, setUserRole] = useState<string>('');
  const [userFarmId, setUserFarmId] = useState<string>('');

  // Modals state
  const [showLandModal, setShowLandModal] = useState(false);
  const [editingLand, setEditingLand] = useState<Land | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [farmFilter, setFarmFilter] = useState('ALL');

  // Form states
  const [landForm, setLandForm] = useState({
    name: '',
    code: '',
    farmId: '',
    totalArea: '',
    unit: 'Acres' as 'Acres' | 'Hectares' | 'Sq Meters',
    location: '',
    description: '',
    ownershipType: 'OWNED' as 'OWNED' | 'LEASED',
    landownerName: '',
    landownerPhone: '',
    rentAmount: '',
    paymentInterval: 'Monthly' as 'Monthly' | 'Quarterly' | 'Yearly',
    leaseStartDate: '',
    leaseEndDate: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        setUserRole(u.role || '');
        const fId = u.farmId && typeof u.farmId === 'object' ? (u.farmId._id || u.farmId.id) : u.farmId;
        setUserFarmId(fId || '');
      }

      const [landsRes, farmsRes] = await Promise.all([
        fetch('/api/lands', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/farms', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const landsResult = await landsRes.json();
      const farmsResult = await farmsRes.json();

      if (landsResult.success) setLands(landsResult.data);
      if (farmsResult.success) setFarms(farmsResult.data);
    } catch (error) {
      console.error('Failed to fetch land management data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set default farm for land form when farms are loaded
  useEffect(() => {
    if (farms.length > 0 && !landForm.farmId) {
      if (userRole !== 'SUPER_ADMIN' && userFarmId) {
        setLandForm(prev => ({ ...prev, farmId: userFarmId }));
      } else {
        setLandForm(prev => ({ ...prev, farmId: farms[0]._id }));
      }
    }
  }, [farms, userRole, userFarmId]);

  const handleOpenCreateModal = () => {
    setEditingLand(null);
    setLandForm({
      name: '',
      code: '',
      farmId: userRole !== 'SUPER_ADMIN' && userFarmId ? userFarmId : (farms[0]?._id || ''),
      totalArea: '',
      unit: 'Acres',
      location: '',
      description: '',
      ownershipType: 'OWNED',
      landownerName: '',
      landownerPhone: '',
      rentAmount: '',
      paymentInterval: 'Monthly',
      leaseStartDate: '',
      leaseEndDate: ''
    });
    setMessage({ type: '', text: '' });
    setShowLandModal(true);
  };

  const handleOpenEditModal = (land: Land) => {
    setEditingLand(land);
    const landFarmId = land.farmId && typeof land.farmId === 'object' ? (land.farmId._id || land.farmId.id) : land.farmId;
    setLandForm({
      name: land.name,
      code: land.code,
      farmId: landFarmId || '',
      totalArea: land.totalArea.toString(),
      unit: land.unit,
      location: land.location || '',
      description: land.description || '',
      ownershipType: land.ownershipType || 'OWNED',
      landownerName: land.landownerName || '',
      landownerPhone: land.landownerPhone || '',
      rentAmount: land.rentAmount ? land.rentAmount.toString() : '',
      paymentInterval: land.paymentInterval || 'Monthly',
      leaseStartDate: land.leaseStartDate ? new Date(land.leaseStartDate).toISOString().substring(0, 10) : '',
      leaseEndDate: land.leaseEndDate ? new Date(land.leaseEndDate).toISOString().substring(0, 10) : ''
    });
    setMessage({ type: '', text: '' });
    setShowLandModal(true);
  };

  const handleSaveLand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const payload = {
      ...landForm,
      totalArea: parseFloat(landForm.totalArea),
      rentAmount: landForm.ownershipType === 'LEASED' ? parseFloat(landForm.rentAmount || '0') : 0,
      leaseStartDate: landForm.ownershipType === 'LEASED' && landForm.leaseStartDate ? new Date(landForm.leaseStartDate).toISOString() : null,
      leaseEndDate: landForm.ownershipType === 'LEASED' && landForm.leaseEndDate ? new Date(landForm.leaseEndDate).toISOString() : null
    };

    try {
      const token = localStorage.getItem('token');
      const url = editingLand ? `/api/lands/${editingLand._id}` : '/api/lands';
      const method = editingLand ? 'PUT' : 'POST';

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
        setMessage({ 
          type: 'success', 
          text: editingLand ? 'Land specifications updated successfully' : 'Land area defined successfully' 
        });
        await fetchData();
        setTimeout(() => setShowLandModal(false), 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save land details' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLand = async (id: string) => {
    if (!confirm('Are you sure you want to delete this land area?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/lands/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await res.json();
      if (result.success) {
        await fetchData();
      } else {
        alert(result.error || 'Failed to delete land');
      }
    } catch (error) {
      console.error(error);
      alert('An unexpected error occurred');
    }
  };

  const handleUpdateStatus = async (land: Land, status: 'AVAILABLE' | 'MAINTENANCE') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/lands/${land._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const result = await res.json();
      if (result.success) {
        await fetchData();
      } else {
        alert(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error(error);
      alert('An unexpected error occurred');
    }
  };

  // Calculations for stats
  const totalLandCount = lands.length;
  const availableLandsCount = lands.filter(l => l.status === 'AVAILABLE').length;
  const leasedLandsCount = lands.filter(l => l.ownershipType === 'LEASED').length;
  
  const totalAreaAcres = lands.reduce((sum, land) => {
    let area = land.totalArea;
    if (land.unit === 'Hectares') area = land.totalArea * 2.47105;
    if (land.unit === 'Sq Meters') area = land.totalArea * 0.000247105;
    return sum + area;
  }, 0);

  // Filters logic
  const filteredLands = lands.filter((land) => {
    const matchesSearch = 
      land.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      land.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (land.landownerName && land.landownerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || land.status === statusFilter;
    
    const landFarmId = land.farmId && typeof land.farmId === 'object' ? (land.farmId._id || land.farmId.id) : land.farmId;
    const matchesFarm = farmFilter === 'ALL' || landFarmId === farmFilter;

    return matchesSearch && matchesStatus && matchesFarm;
  });

  const leasedLandsOnly = lands.filter((land) => {
    if (land.ownershipType !== 'LEASED') return false;
    const matchesSearch = 
      land.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      land.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (land.landownerName && land.landownerName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const landFarmId = land.farmId && typeof land.farmId === 'object' ? (land.farmId._id || land.farmId.id) : land.farmId;
    const matchesFarm = farmFilter === 'ALL' || landFarmId === farmFilter;
    return matchesSearch && matchesFarm;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Land Management</h1>
          <p className="text-slate-500 font-medium">Define owned or leased lands used for grass cultivation of animals.</p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-lg shadow-blue-600/20 active:scale-95 self-start"
        >
          <Plus className="w-5 h-5" />
          Define Land Area
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Total Area Cultivated</span>
            <h3 className="text-3xl font-black text-slate-900 leading-none">
              {totalAreaAcres.toFixed(1)} <span className="text-sm font-semibold text-slate-500">Acres</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Across {totalLandCount} parcels</p>
          </div>
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Available Areas</span>
            <h3 className="text-3xl font-black text-emerald-600 leading-none">
              {availableLandsCount} <span className="text-sm font-semibold text-slate-400">units</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Ready for grass cultivation</p>
          </div>
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center">
            <Map className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Leased Parcels</span>
            <h3 className="text-3xl font-black text-blue-600 leading-none">
              {leasedLandsCount} <span className="text-sm font-semibold text-slate-400">units</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Acquired from landowners</p>
          </div>
          <div className="w-14 h-14 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'all' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          All Land Parcels
        </button>
        <button
          onClick={() => setActiveTab('leases')}
          className={`px-6 py-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'leases' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Leased Lands ({leasedLandsCount})
        </button>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-5 border border-slate-200 rounded-3xl">
        <div className="flex flex-1 flex-col sm:flex-row gap-4 w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search lands by name, code or landowner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {activeTab === 'all' && (
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          )}

          {userRole === 'SUPER_ADMIN' && (
            <div className="w-full sm:w-48">
              <select
                value={farmFilter}
                onChange={(e) => setFarmFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="ALL">All Farms</option>
                {farms.map(f => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      ) : activeTab === 'all' ? (
        /* Land Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLands.map((land) => {
            const landFarmId = land.farmId && typeof land.farmId === 'object' ? (land.farmId._id || land.farmId.id) : land.farmId;
            const landFarm = farms.find(f => f._id === landFarmId);
            return (
              <div 
                key={land._id} 
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-blue-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center">
                        <Map className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-lg leading-tight truncate max-w-[150px]">{land.name}</h4>
                        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{land.code}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full border ${
                        land.ownershipType === 'LEASED'
                          ? 'bg-blue-50 text-blue-600 border-blue-100'
                          : 'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {land.ownershipType || 'OWNED'}
                      </span>
                      <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full border ${
                        land.status === 'AVAILABLE' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {land.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 font-medium">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400">Total Area</span>
                      <span className="font-bold text-slate-800">{land.totalArea} {land.unit}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400">Enterprise Unit</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Tractor className="w-4 h-4 text-slate-400" />
                        {land.farmId?.name || landFarm?.name || 'Unassigned'}
                      </span>
                    </div>
                    {land.location && (
                      <div className="flex items-start gap-2 pt-1">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-500 line-clamp-1">{land.location}</span>
                      </div>
                    )}
                    {land.description && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{land.description}</p>
                      </div>
                    )}
                  </div>

                  {land.ownershipType === 'LEASED' && land.landownerName && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Landowner / Lessor</span>
                        {land.rentAmount && land.rentAmount > 0 ? (
                          <span className="text-xs font-bold text-blue-600">₹{land.rentAmount}/{land.paymentInterval?.toLowerCase().replace('ly', '')}</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-800 truncate">{land.landownerName}</span>
                      </div>
                      {land.leaseEndDate && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-bold">Ends {new Date(land.leaseEndDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEditModal(land)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 active:scale-95"
                      title="Edit specs"
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteLand(land._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 active:scale-95"
                      title="Delete land"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {land.status === 'AVAILABLE' ? (
                      <button
                        onClick={() => handleUpdateStatus(land, 'MAINTENANCE')}
                        className="border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs px-4 py-2 rounded-xl transition-all duration-200 active:scale-95"
                      >
                        Set Maint.
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(land, 'AVAILABLE')}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 font-bold text-xs px-4 py-2 rounded-xl transition-all duration-200 active:scale-95"
                      >
                        Make Available
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredLands.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-slate-200 rounded-[32px] p-16 text-center bg-white">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Map className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">No lands indexed</h3>
              <p className="text-slate-400 text-sm font-semibold max-w-sm mx-auto">Either refine your query filters or click "Define Land Area" to record your agricultural parcels.</p>
            </div>
          )}
        </div>
      ) : (
        /* Leases Table View */
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider">Land Parcel</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider">Landowner Details</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider">Lease Term</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider">Rent Cost / Interval</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider">Remaining Duration</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leasedLandsOnly.map((land) => {
                  const now = new Date();
                  const end = land.leaseEndDate ? new Date(land.leaseEndDate) : null;
                  let daysLeft = 0;
                  if (end) {
                    const diffTime = end.getTime() - now.getTime();
                    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  }
                  
                  return (
                    <tr key={land._id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                            <Map className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{land.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{land.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {land.landownerName}
                          </p>
                          {land.landownerPhone && (
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {land.landownerPhone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-600 space-y-1">
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Start: {land.leaseStartDate ? new Date(land.leaseStartDate).toLocaleDateString() : 'N/A'}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            End: {land.leaseEndDate ? new Date(land.leaseEndDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ₹{land.rentAmount} <span className="text-[10px] text-slate-400 font-bold uppercase">/ {land.paymentInterval}</span>
                      </td>
                      <td className="px-6 py-4">
                        {end ? (
                          daysLeft > 0 ? (
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                              {daysLeft} days remaining
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
                              Expired {Math.abs(daysLeft)} days ago
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Ongoing</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenEditModal(land)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition-all"
                        >
                          Edit Specs
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {leasedLandsOnly.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-bold">
                      No active leased lands recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Define/Edit Land Modal */}
      {showLandModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{editingLand ? 'Edit specifications' : 'Define Land Area'}</h3>
                <p className="text-xs text-slate-400 font-medium">Set land specifications and ownership details.</p>
              </div>
              <button 
                onClick={() => setShowLandModal(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveLand} className="p-8 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
              {message.text && (
                <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                  <span className="text-xs font-semibold">{message.text}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Land Name</label>
                  <input
                    type="text"
                    required
                    value={landForm.name}
                    onChange={(e) => setLandForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. North Pasture"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Land Code</label>
                  <input
                    type="text"
                    required
                    value={landForm.code}
                    onChange={(e) => setLandForm(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g. LND-001"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Area</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={landForm.totalArea}
                    onChange={(e) => setLandForm(prev => ({ ...prev, totalArea: e.target.value }))}
                    placeholder="e.g. 15.5"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Unit</label>
                  <select
                    value={landForm.unit}
                    onChange={(e) => setLandForm(prev => ({ ...prev, unit: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="Acres">Acres</option>
                    <option value="Hectares">Hectares</option>
                    <option value="Sq Meters">Sq Meters</option>
                  </select>
                </div>
              </div>

              {userRole === 'SUPER_ADMIN' ? (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Enterprise Farm Unit</label>
                  <select
                    required
                    value={landForm.farmId}
                    onChange={(e) => setLandForm(prev => ({ ...prev, farmId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="" disabled>Select Farm</option>
                    {farms.map(f => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Ownership Type</label>
                  <select
                    value={landForm.ownershipType}
                    onChange={(e) => setLandForm(prev => ({ ...prev, ownershipType: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="OWNED">Owned (Farm Asset)</option>
                    <option value="LEASED">Leased (Rented from Landowner)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Location / GPS</label>
                  <input
                    type="text"
                    value={landForm.location}
                    onChange={(e) => setLandForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Section coordinates"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Lease Details config - dynamically shown if LEASED */}
              {landForm.ownershipType === 'LEASED' && (
                <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-5 space-y-5 animate-in fade-in duration-200">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">Lease Details</h4>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Landowner Name</label>
                      <input
                        type="text"
                        required
                        value={landForm.landownerName}
                        onChange={(e) => setLandForm(prev => ({ ...prev, landownerName: e.target.value }))}
                        placeholder="e.g. John Doe"
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Landowner Phone</label>
                      <input
                        type="tel"
                        value={landForm.landownerPhone}
                        onChange={(e) => setLandForm(prev => ({ ...prev, landownerPhone: e.target.value }))}
                        placeholder="e.g. 555-0100"
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Rent Cost (₹)</label>
                      <input
                        type="number"
                        value={landForm.rentAmount}
                        onChange={(e) => setLandForm(prev => ({ ...prev, rentAmount: e.target.value }))}
                        placeholder="e.g. 1200"
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Payment Interval</label>
                      <select
                        value={landForm.paymentInterval}
                        onChange={(e) => setLandForm(prev => ({ ...prev, paymentInterval: e.target.value as any }))}
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Lease Start Date</label>
                      <input
                        type="date"
                        value={landForm.leaseStartDate}
                        onChange={(e) => setLandForm(prev => ({ ...prev, leaseStartDate: e.target.value }))}
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Lease End Date</label>
                      <input
                        type="date"
                        value={landForm.leaseEndDate}
                        onChange={(e) => setLandForm(prev => ({ ...prev, leaseEndDate: e.target.value }))}
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Description / Soil specs</label>
                <textarea
                  value={landForm.description}
                  onChange={(e) => setLandForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Notes about grass cultivation, soil type..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowLandModal(false)}
                  className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingLand ? 'Save Specifications' : 'Define Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

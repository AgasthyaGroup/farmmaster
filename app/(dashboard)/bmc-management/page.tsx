'use client';

import { useEffect, useState } from 'react';
import { 
  Snowflake,
  Thermometer,
  Layers,
  Plus,
  Edit,
  Trash2,
  X,
  MapPin,
  Loader2,
  CheckCircle2,
  Info,
  AlertTriangle,
  Activity,
  Droplet
} from 'lucide-react';

interface Farm {
  _id: string;
  name: string;
  id?: string;
}

interface BMC {
  _id: string;
  name: string;
  code: string;
  capacity: number;
  currentVolume: number;
  temperature?: number | null;
  location?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  description?: string;
  farmId: Farm;
  createdAt: string;
}

export default function BmcManagementPage() {
  const [bmcs, setBmcs] = useState<BMC[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [userFarmId, setUserFarmId] = useState<string>('');

  // Modals state
  const [showBmcModal, setShowBmcModal] = useState(false);
  const [editingBmc, setEditingBmc] = useState<BMC | null>(null);
  
  // Quick status update modal state
  const [showQuickUpdateModal, setShowQuickUpdateModal] = useState(false);
  const [quickUpdateBmc, setQuickUpdateBmc] = useState<BMC | null>(null);
  const [quickVolume, setQuickVolume] = useState('');
  const [quickTemp, setQuickTemp] = useState('');

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [farmFilter, setFarmFilter] = useState('ALL');

  // Form states
  const [bmcForm, setBmcForm] = useState({
    name: '',
    code: '',
    farmId: '',
    capacity: '',
    location: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
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

      const [bmcsRes, farmsRes] = await Promise.all([
        fetch('/api/bmcs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/farms', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const bmcsResult = await bmcsRes.json();
      const farmsResult = await farmsRes.json();

      if (bmcsResult.success) setBmcs(bmcsResult.data);
      if (farmsResult.success) setFarms(farmsResult.data);
    } catch (error) {
      console.error('Failed to fetch BMC data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set default farm for form
  useEffect(() => {
    if (farms.length > 0 && !bmcForm.farmId) {
      if (userRole !== 'SUPER_ADMIN' && userFarmId) {
        setBmcForm(prev => ({ ...prev, farmId: userFarmId }));
      } else {
        setBmcForm(prev => ({ ...prev, farmId: farms[0]._id }));
      }
    }
  }, [farms, userRole, userFarmId]);

  const handleOpenCreateModal = () => {
    setEditingBmc(null);
    setBmcForm({
      name: '',
      code: '',
      farmId: userRole !== 'SUPER_ADMIN' && userFarmId ? userFarmId : (farms[0]?._id || ''),
      capacity: '',
      location: '',
      description: '',
      status: 'ACTIVE'
    });
    setMessage({ type: '', text: '' });
    setShowBmcModal(true);
  };

  const handleOpenEditModal = (bmc: BMC) => {
    setEditingBmc(bmc);
    const bmcFarmId = bmc.farmId && typeof bmc.farmId === 'object' ? (bmc.farmId._id || bmc.farmId.id) : bmc.farmId;
    setBmcForm({
      name: bmc.name,
      code: bmc.code,
      farmId: bmcFarmId || '',
      capacity: bmc.capacity.toString(),
      location: bmc.location || '',
      description: bmc.description || '',
      status: bmc.status
    });
    setMessage({ type: '', text: '' });
    setShowBmcModal(true);
  };

  const handleOpenQuickUpdate = (bmc: BMC) => {
    setQuickUpdateBmc(bmc);
    setQuickVolume(bmc.currentVolume?.toString() || '0');
    setQuickTemp(bmc.temperature?.toString() || '');
    setMessage({ type: '', text: '' });
    setShowQuickUpdateModal(true);
  };

  const handleSaveBmc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const payload = {
      ...bmcForm,
      capacity: parseFloat(bmcForm.capacity)
    };

    try {
      const token = localStorage.getItem('token');
      const url = editingBmc ? `/api/bmcs/${editingBmc._id}` : '/api/bmcs';
      const method = editingBmc ? 'PUT' : 'POST';

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
          text: editingBmc ? 'Cooler specs updated successfully' : 'Cooler defined successfully' 
        });
        await fetchData();
        setTimeout(() => setShowBmcModal(false), 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save cooler details' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveQuickUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUpdateBmc) return;

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const volumeVal = parseFloat(quickVolume);
    const capacityVal = quickUpdateBmc.capacity;

    if (volumeVal > capacityVal) {
      setMessage({ type: 'error', text: `Storage volume cannot exceed cooler capacity of ${capacityVal} L.` });
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bmcs/${quickUpdateBmc._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentVolume: volumeVal,
          temperature: quickTemp !== '' ? parseFloat(quickTemp) : null
        })
      });

      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Storage metrics logged successfully' });
        await fetchData();
        setTimeout(() => setShowQuickUpdateModal(false), 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to log metrics' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBmc = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Bulk Milk Cooler?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/bmcs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await res.json();
      if (result.success) {
        await fetchData();
      } else {
        alert(result.error || 'Failed to delete cooler');
      }
    } catch (error) {
      console.error(error);
      alert('An unexpected error occurred');
    }
  };

  // Stats
  const totalCapacity = bmcs.reduce((sum, b) => sum + (b.capacity || 0), 0);
  const totalStored = bmcs.reduce((sum, b) => sum + (b.currentVolume || 0), 0);
  const activeCoolers = bmcs.filter(b => b.status === 'ACTIVE').length;

  // Filter
  const filteredBmcs = bmcs.filter((bmc) => {
    const matchesSearch = 
      bmc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bmc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bmc.location && bmc.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || bmc.status === statusFilter;
    
    const bmcFarmId = bmc.farmId && typeof bmc.farmId === 'object' ? (bmc.farmId._id || bmc.farmId.id) : bmc.farmId;
    const matchesFarm = farmFilter === 'ALL' || bmcFarmId === farmFilter;

    return matchesSearch && matchesStatus && matchesFarm;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">BMC Management</h1>
          <p className="text-slate-500 font-medium">Define Bulk Milk Coolers, manage capacities, storage volumes, and temperature statuses.</p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-lg shadow-blue-600/20 active:scale-95 self-start"
        >
          <Plus className="w-5 h-5" />
          Define Milk Cooler
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Total Cooling Capacity</span>
            <h3 className="text-3xl font-black text-slate-900 leading-none">
              {totalCapacity.toLocaleString()} <span className="text-sm font-semibold text-slate-500">Liters</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Across {bmcs.length} total units</p>
          </div>
          <div className="w-14 h-14 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Total Stored Milk</span>
            <h3 className="text-3xl font-black text-indigo-600 leading-none">
              {totalStored.toLocaleString()} <span className="text-sm font-semibold text-indigo-400">Liters</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {totalCapacity > 0 ? ((totalStored / totalCapacity) * 100).toFixed(1) : 0}% aggregate utilization
            </p>
          </div>
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl flex items-center justify-center">
            <Droplet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Active Cooling Systems</span>
            <h3 className="text-3xl font-black text-emerald-600 leading-none">
              {activeCoolers} <span className="text-sm font-semibold text-slate-400">units</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Ready for daily collections</p>
          </div>
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center">
            <Snowflake className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-5 border border-slate-200 rounded-3xl">
        <div className="flex flex-1 flex-col sm:flex-row gap-4 w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, code or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

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
      ) : (
        /* BMC Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBmcs.map((bmc) => {
            const bmcFarmId = bmc.farmId && typeof bmc.farmId === 'object' ? (bmc.farmId._id || bmc.farmId.id) : bmc.farmId;
            const bmcFarm = farms.find(f => f._id === bmcFarmId);
            const fillPercentage = Math.min(((bmc.currentVolume || 0) / bmc.capacity) * 100, 100);
            const isTempWarning = bmc.temperature !== undefined && bmc.temperature !== null && bmc.temperature > 4;

            return (
              <div 
                key={bmc._id} 
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-blue-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center">
                        <Snowflake className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-lg leading-tight truncate max-w-[150px]">{bmc.name}</h4>
                        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{bmc.code}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full border ${
                      bmc.status === 'ACTIVE' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : bmc.status === 'MAINTENANCE'
                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                        : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {bmc.status}
                    </span>
                  </div>

                  {/* Visual gauge */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>Volume Level</span>
                      <span>{bmc.currentVolume?.toLocaleString() || 0} / {bmc.capacity?.toLocaleString()} L</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-50">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold text-right">
                      {fillPercentage.toFixed(1)}% full
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 font-medium">
                    {/* Temperature Indicator */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Thermometer className="w-4 h-4 text-slate-400" />
                        Cooler Temperature
                      </span>
                      {bmc.temperature !== undefined && bmc.temperature !== null ? (
                        <span className={`font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
                          isTempWarning 
                            ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-bounce' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {bmc.temperature}°C
                          {isTempWarning && <AlertTriangle className="w-3.5 h-3.5" />}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No sensor reading</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400">Enterprise Unit</span>
                      <span className="font-bold text-slate-800">
                        {bmc.farmId?.name || bmcFarm?.name || 'Unassigned'}
                      </span>
                    </div>
                    {bmc.location && (
                      <div className="flex items-start gap-2 pt-1">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-500 line-clamp-1">{bmc.location}</span>
                      </div>
                    )}
                    {bmc.description && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{bmc.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEditModal(bmc)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 active:scale-95"
                      title="Edit specs"
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteBmc(bmc._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 active:scale-95"
                      title="Delete cooler"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenQuickUpdate(bmc)}
                      className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 font-bold text-xs px-4 py-2 rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-1.5"
                    >
                      <Activity className="w-4.5 h-4.5" />
                      Log Storage
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredBmcs.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-slate-200 rounded-[32px] p-16 text-center bg-white">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Snowflake className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">No coolers indexed</h3>
              <p className="text-slate-400 text-sm font-semibold max-w-sm mx-auto">Define Bulk Milk Cooler tanks to track cooling metrics.</p>
            </div>
          )}
        </div>
      )}

      {/* Define/Edit Cooler Modal */}
      {showBmcModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{editingBmc ? 'Edit specifications' : 'Define Bulk Milk Cooler'}</h3>
                <p className="text-xs text-slate-400 font-medium">Register or update milk storage capacities.</p>
              </div>
              <button 
                onClick={() => setShowBmcModal(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBmc} className="p-8 space-y-6 flex-1 overflow-y-auto">
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
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Cooler Name</label>
                  <input
                    type="text"
                    required
                    value={bmcForm.name}
                    onChange={(e) => setBmcForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Tank A"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Cooler Code</label>
                  <input
                    type="text"
                    required
                    value={bmcForm.code}
                    onChange={(e) => setBmcForm(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g. BMC-001"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Capacity (Liters)</label>
                  <input
                    type="number"
                    required
                    value={bmcForm.capacity}
                    onChange={(e) => setBmcForm(prev => ({ ...prev, capacity: e.target.value }))}
                    placeholder="e.g. 5000"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Status</label>
                  <select
                    value={bmcForm.status}
                    onChange={(e) => setBmcForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="ACTIVE">Active (Available)</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
              </div>

              {userRole === 'SUPER_ADMIN' ? (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Enterprise Farm Unit</label>
                  <select
                    required
                    value={bmcForm.farmId}
                    onChange={(e) => setBmcForm(prev => ({ ...prev, farmId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="" disabled>Select Farm</option>
                    {farms.map(f => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Location / Facility Section</label>
                <input
                  type="text"
                  value={bmcForm.location}
                  onChange={(e) => setBmcForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Shed 1, North Side Cooler Station"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={bmcForm.description}
                  onChange={(e) => setBmcForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Notes about coolant type, manufacturer..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowBmcModal(false)}
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
                  {editingBmc ? 'Save Specifications' : 'Define Cooler'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Storage Update Modal (Volume / Temp sensor data) */}
      {showQuickUpdateModal && quickUpdateBmc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Log Stored Volume</h3>
                <p className="text-xs text-slate-400 font-medium">{quickUpdateBmc.name} ({quickUpdateBmc.code})</p>
              </div>
              <button 
                onClick={() => setShowQuickUpdateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickUpdate} className="p-8 space-y-6">
              {message.text && (
                <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                  <span className="text-xs font-semibold">{message.text}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Current Milk Volume (Liters)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={quickVolume}
                  onChange={(e) => setQuickVolume(e.target.value)}
                  placeholder={`Max capacity: ${quickUpdateBmc.capacity} L`}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Cooler Temperature Reading (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={quickTemp}
                  onChange={(e) => setQuickTemp(e.target.value)}
                  placeholder="e.g. 3.5"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <p className="text-[10px] text-slate-400 font-medium">Standard targets: 2°C to 4°C</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowQuickUpdateModal(false)}
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
                  Save Storage Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

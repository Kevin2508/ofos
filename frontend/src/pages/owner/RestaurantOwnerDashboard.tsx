import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { KitchenOrdersManager } from '../../components/owner/KitchenOrdersManager';
import {
  Store,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Percent,
  Clock,
  MapPin,
  Users,
  Power,
  PauseCircle,
  PlayCircle,
  Plus,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  X,
  FileText,
  BarChart2,
  ChefHat,
} from 'lucide-react';

interface OperatingHour {
  id: string;
  dayOfWeek: number;
  openingTime: string | null;
  closingTime: string | null;
  isClosed: boolean;
}

interface DeliveryZone {
  id: string;
  radiusKm: number;
  minimumDeliveryTimeMinutes: number;
  maximumDeliveryTimeMinutes: number;
}

interface BranchStaff {
  id: string;
  userId: string;
  designation: string;
  status: string;
  joinedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string;
  };
}

interface Branch {
  id: string;
  branchName: string;
  gstin: string;
  fssaiLicenseNumber: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  minimumOrderValue: number;
  deliveryFee: number;
  isActive: boolean;
  isAcceptingOrders: boolean;
  deliveryZone?: DeliveryZone | null;
  operatingHours?: OperatingHour[];
}

interface Restaurant {
  id: string;
  businessName: string;
  legalBusinessName: string;
  primaryPhone: string;
  primaryEmail: string;
  description: string | null;
  cuisineTags: string | null;
  status: string;
  branches: Branch[];
}

interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  averageOrderValue: number;
  acceptanceRate: number;
  revenueTrends: Array<{ date: string; revenue: number }>;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const RestaurantOwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Management Tab: 'overview' | 'orders' | 'hours' | 'zone' | 'staff'
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'hours' | 'zone' | 'staff'>('orders');

  // Hours Editing State
  const [hoursList, setHoursList] = useState<Array<{ dayOfWeek: number; openingTime: string; closingTime: string; isClosed: boolean }>>([]);
  const [savingHours, setSavingHours] = useState(false);

  // Delivery Zone Editing State
  const [zoneRadius, setZoneRadius] = useState<number>(5);
  const [minDeliveryTime, setMinDeliveryTime] = useState<number>(25);
  const [maxDeliveryTime, setMaxDeliveryTime] = useState<number>(45);
  const [savingZone, setSavingZone] = useState(false);

  // Staff State
  const [staffList, setStaffList] = useState<BranchStaff[]>([]);
  const [newStaffUserId, setNewStaffUserId] = useState('');
  const [newStaffDesignation, setNewStaffDesignation] = useState('KITCHEN_STAFF');
  const [addingStaff, setAddingStaff] = useState(false);

  // Modals
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showRegisterRestModal, setShowRegisterRestModal] = useState(false);
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [registeringRest, setRegisteringRest] = useState(false);

  // Branch creation form state
  const [newBranchData, setNewBranchData] = useState({
    branchName: '',
    gstin: '',
    fssaiLicenseNumber: '',
    contactPhone: '',
    addressLine1: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    deliveryFee: 35,
    minimumOrderValue: 150,
  });

  // Restaurant registration form state
  const [newRestData, setNewRestData] = useState({
    businessName: '',
    legalBusinessName: '',
    primaryPhone: user?.phone || '',
    primaryEmail: user?.email || '',
    description: '',
    cuisineTags: 'North Indian, Fast Food',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [restRes, statsRes] = await Promise.all([
        apiClient.get<{ restaurants: Restaurant[] }>('/restaurant-management/mine'),
        apiClient.get<DashboardStats>('/restaurant-management/dashboard-stats'),
      ]);

      const rests = restRes.data.restaurants || [];
      setRestaurants(rests);
      setStats(statsRes.data);

      if (rests.length > 0) {
        // Prioritize approved restaurants with active branches and menus (e.g. Pizza Bella)
        const defaultRest =
          rests.find((r) => r.businessName === 'Pizza Bella') ||
          rests.find((r) => r.status === 'APPROVED' && r.branches && r.branches.length > 0) ||
          rests[0];
        setSelectedRestaurantId(defaultRest.id);
        if (defaultRest.branches && defaultRest.branches.length > 0) {
          const firstBranch = defaultRest.branches[0];
          setSelectedBranchId(firstBranch.id);
          initBranchData(firstBranch);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantChange = (restId: string) => {
    setSelectedRestaurantId(restId);
    const target = restaurants.find((r) => r.id === restId);
    if (target && target.branches && target.branches.length > 0) {
      setSelectedBranchId(target.branches[0].id);
      initBranchData(target.branches[0]);
    } else {
      setSelectedBranchId(null);
    }
  };

  const initBranchData = (branch: Branch) => {
    // Init Hours
    const defaultHours = Array.from({ length: 7 }, (_, i) => {
      const existing = branch.operatingHours?.find((h) => h.dayOfWeek === i);
      return {
        dayOfWeek: i,
        openingTime: existing?.openingTime ? existing.openingTime.substring(0, 5) : '09:00',
        closingTime: existing?.closingTime ? existing.closingTime.substring(0, 5) : '22:00',
        isClosed: existing?.isClosed ?? false,
      };
    });
    setHoursList(defaultHours);

    // Init Zone
    if (branch.deliveryZone) {
      setZoneRadius(branch.deliveryZone.radiusKm);
      setMinDeliveryTime(branch.deliveryZone.minimumDeliveryTimeMinutes);
      setMaxDeliveryTime(branch.deliveryZone.maximumDeliveryTimeMinutes);
    } else {
      setZoneRadius(5);
      setMinDeliveryTime(25);
      setMaxDeliveryTime(45);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);
  const activeBranch = activeRestaurant?.branches.find((b) => b.id === selectedBranchId) || activeRestaurant?.branches[0];

  // Fetch staff when staff tab is activated
  useEffect(() => {
    if (activeTab === 'staff' && activeBranch) {
      apiClient
        .get<{ staff: BranchStaff[] }>(`/restaurant-management/branches/${activeBranch.id}/staff`)
        .then((res) => setStaffList(res.data.staff || []))
        .catch((err) => showToast(err.message || 'Failed to fetch staff'));
    }
  }, [activeTab, activeBranch?.id]);

  // Toggle Accepting Orders
  const handleToggleOrders = async () => {
    if (!activeBranch) return;
    try {
      const res = await apiClient.patch<{ message: string; isAcceptingOrders: boolean }>(
        `/restaurant-management/branches/${activeBranch.id}/toggle-orders`,
      );
      showToast(res.data.message);
      setRestaurants((prev) =>
        prev.map((r) => ({
          ...r,
          branches: r.branches.map((b) =>
            b.id === activeBranch.id ? { ...b, isAcceptingOrders: res.data.isAcceptingOrders } : b,
          ),
        })),
      );
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message);
    }
  };

  // Pause / Resume Restaurant
  const handleTogglePause = async () => {
    if (!activeRestaurant) return;
    const isPaused = activeRestaurant.status === 'SUSPENDED';
    const endpoint = isPaused
      ? `/restaurant-management/${activeRestaurant.id}/resume`
      : `/restaurant-management/${activeRestaurant.id}/pause`;

    try {
      const res = await apiClient.patch<{ message: string; restaurant: any }>(endpoint);
      showToast(res.data.message);
      setRestaurants((prev) =>
        prev.map((r) => (r.id === activeRestaurant.id ? { ...r, status: res.data.restaurant.status } : r)),
      );
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message);
    }
  };

  // Save Hours
  const handleSaveHours = async () => {
    if (!activeBranch) return;
    setSavingHours(true);
    try {
      await apiClient.put(`/restaurant-management/branches/${activeBranch.id}/hours`, {
        hours: hoursList.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          openingTime: h.openingTime.length === 5 ? `${h.openingTime}:00` : h.openingTime,
          closingTime: h.closingTime.length === 5 ? `${h.closingTime}:00` : h.closingTime,
          isClosed: h.isClosed,
        })),
      });
      showToast('Weekly operating hours saved successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message);
    } finally {
      setSavingHours(false);
    }
  };

  // Save Delivery Zone
  const handleSaveZone = async () => {
    if (!activeBranch) return;
    if (minDeliveryTime > maxDeliveryTime) {
      showToast('Minimum delivery time cannot exceed maximum delivery time');
      return;
    }
    setSavingZone(true);
    try {
      await apiClient.put(`/restaurant-management/branches/${activeBranch.id}/delivery-zone`, {
        radiusKm: Number(zoneRadius),
        minimumDeliveryTimeMinutes: Number(minDeliveryTime),
        maximumDeliveryTimeMinutes: Number(maxDeliveryTime),
      });
      showToast('Delivery zone saved successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message);
    } finally {
      setSavingZone(false);
    }
  };

  // Create New Branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRestaurant) return;
    setCreatingBranch(true);
    try {
      const res = await apiClient.post<{ message: string; branch: Branch }>(
        `/restaurant-management/${activeRestaurant.id}/branches`,
        {
          ...newBranchData,
          latitude: 12.9716,
          longitude: 77.5946,
          country: 'India',
        },
      );
      showToast('Branch created successfully!');
      setShowAddBranchModal(false);
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === activeRestaurant.id ? { ...r, branches: [...r.branches, res.data.branch] } : r,
        ),
      );
      setSelectedBranchId(res.data.branch.id);
      initBranchData(res.data.branch);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message);
    } finally {
      setCreatingBranch(false);
    }
  };

  // Register New Restaurant
  const handleRegisterRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisteringRest(true);
    try {
      await apiClient.post('/restaurant-management', newRestData);
      showToast('Restaurant registered successfully! Pending approval.');
      setShowRegisterRestModal(false);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message);
    } finally {
      setRegisteringRest(false);
    }
  };

  // Add Staff Member
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBranch || !newStaffUserId.trim()) return;
    setAddingStaff(true);
    try {
      const res = await apiClient.post<{ message: string; staff: BranchStaff }>(
        `/restaurant-management/branches/${activeBranch.id}/staff`,
        {
          userId: newStaffUserId.trim(),
          designation: newStaffDesignation,
        },
      );
      showToast('Staff member assigned successfully!');
      setStaffList((prev) => [res.data.staff, ...prev]);
      setNewStaffUserId('');
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message);
    } finally {
      setAddingStaff(false);
    }
  };

  // Remove Staff Member
  const handleRemoveStaff = async (staffId: string) => {
    if (!activeBranch) return;
    try {
      await apiClient.delete(`/restaurant-management/branches/${activeBranch.id}/staff/${staffId}`);
      showToast('Staff member removed successfully');
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-medium">Loading restaurant operations dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          {error}
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Zero-Restaurant Empty State
  if (restaurants.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center font-black mx-auto shadow-md">
          <Store className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">No Registered Restaurant Found</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            You don't have any restaurants registered under this account yet. Register your brand to start selling on OFOS.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterRestModal(true)}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-2xl shadow-lg transition-all inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Register Restaurant Now
        </button>

        {/* Registration Modal */}
        {showRegisterRestModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-lg text-slate-900">Register Restaurant</h3>
                <button onClick={() => setShowRegisterRestModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRegisterRestaurant} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand / Business Name</label>
                  <input
                    type="text"
                    required
                    value={newRestData.businessName}
                    onChange={(e) => setNewRestData({ ...newRestData, businessName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. Royal Biryani House"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Legal Entity Name</label>
                  <input
                    type="text"
                    required
                    value={newRestData.legalBusinessName}
                    onChange={(e) => setNewRestData({ ...newRestData, legalBusinessName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                    placeholder="e.g. Royal Foods LLP"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Phone</label>
                    <input
                      type="text"
                      required
                      value={newRestData.primaryPhone}
                      onChange={(e) => setNewRestData({ ...newRestData, primaryPhone: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Email</label>
                    <input
                      type="email"
                      required
                      value={newRestData.primaryEmail}
                      onChange={(e) => setNewRestData({ ...newRestData, primaryEmail: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cuisine Tags</label>
                  <input
                    type="text"
                    value={newRestData.cuisineTags}
                    onChange={(e) => setNewRestData({ ...newRestData, cuisineTags: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                    placeholder="Biryani, North Indian, Mughlai"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterRestModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registeringRest}
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-50"
                  >
                    {registeringRest ? 'Submitting...' : 'Register Restaurant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const maxRevenueTrend = Math.max(...(stats?.revenueTrends?.map((t) => t.revenue) || [100]), 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Restaurant Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center font-black text-2xl shadow-sm">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {activeRestaurant?.businessName || 'Restaurant Management'}
              </h1>
              {activeRestaurant && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    activeRestaurant.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : activeRestaurant.status === 'SUSPENDED'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {activeRestaurant.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Owner: {user?.firstName} {user?.lastName || ''} &bull; Primary Phone: {activeRestaurant?.primaryPhone}
            </p>
            {restaurants.length > 1 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold text-slate-500">Switch Restaurant:</span>
                <select
                  value={selectedRestaurantId || ''}
                  onChange={(e) => handleRestaurantChange(e.target.value)}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.businessName} ({r.status})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Quick Operations Controls */}
        {activeBranch && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleOrders}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                activeBranch.isAcceptingOrders
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{activeBranch.isAcceptingOrders ? 'Accepting Orders: ON' : 'Orders: OFF'}</span>
            </button>

            <button
              onClick={handleTogglePause}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center gap-1.5 ${
                activeRestaurant?.status === 'SUSPENDED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {activeRestaurant?.status === 'SUSPENDED' ? (
                <>
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Resume Restaurant</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Pause Restaurant</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Multi-Branch Selector Tab Bar */}
      {activeRestaurant && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Branches:</span>
          {activeRestaurant.branches.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setSelectedBranchId(b.id);
                initBranchData(b);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeBranch?.id === b.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{b.branchName}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  b.isAcceptingOrders ? 'bg-emerald-400' : 'bg-red-400'
                }`}
              ></span>
            </button>
          ))}

          <button
            onClick={() => setShowAddBranchModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Branch</span>
          </button>
        </div>
      )}

      {/* KPI Cards & 7-Day Revenue Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Today's Orders</span>
              <ShoppingBag className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats?.ordersToday ?? 0}</div>
            <p className="text-[11px] text-slate-500">Live active & completed orders today</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Today's Revenue</span>
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">₹{stats?.revenueToday ?? 0}</div>
            <p className="text-[11px] text-slate-500">Gross paid revenue today</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Avg Order Value</span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">₹{stats?.averageOrderValue ?? 0}</div>
            <p className="text-[11px] text-slate-500">Average ticket size today</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Acceptance Rate</span>
              <Percent className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats?.acceptanceRate ?? 0}%</div>
            <p className="text-[11px] text-slate-500">Dispatched orders without cancellation</p>
          </div>
        </div>

        {/* 7-Day Revenue Sparkline / Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-orange-500" />
              7-Day Revenue Trend
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 h-28 pt-4">
            {stats?.revenueTrends?.map((item, idx) => {
              const heightPercent = maxRevenueTrend > 0 ? (item.revenue / maxRevenueTrend) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    className="w-full bg-orange-500/80 hover:bg-orange-600 rounded-t-md transition-all relative group cursor-pointer"
                    style={{ height: `${Math.max(8, heightPercent)}%` }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                      ₹{item.revenue}
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold text-slate-400 truncate w-full text-center">
                    {item.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Operations Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Store className="w-4 h-4" />
          Branch Overview
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          Live Kitchen Orders
        </button>

        <button
          onClick={() => setActiveTab('hours')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'hours'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Operating Hours
        </button>

        <button
          onClick={() => setActiveTab('zone')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'zone'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Delivery Zone & Times
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Kitchen Staff Roster
        </button>
      </div>

      {/* Tab: Live Kitchen Orders */}
      {activeTab === 'orders' && <KitchenOrdersManager />}

      {/* Tab 1: Branch Overview */}
      {activeTab === 'overview' && activeBranch && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-orange-500" />
              Branch Information
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Branch Name:</span>
                <span className="font-bold text-slate-800">{activeBranch.branchName}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Contact Phone:</span>
                <span className="font-bold text-slate-800">{activeBranch.contactPhone}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Address:</span>
                <span className="font-bold text-slate-800">
                  {activeBranch.addressLine1}, {activeBranch.city}, {activeBranch.state} ({activeBranch.postalCode})
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">FSSAI License:</span>
                <span className="font-mono font-bold text-slate-800">{activeBranch.fssaiLicenseNumber}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">GSTIN:</span>
                <span className="font-mono font-bold text-slate-800">{activeBranch.gstin}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Order Pricing & Fee Settings
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Base Delivery Fee:</span>
                <span className="font-bold text-slate-900">₹{activeBranch.deliveryFee}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Minimum Order Value:</span>
                <span className="font-bold text-slate-900">₹{activeBranch.minimumOrderValue}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Order Acceptance Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                    activeBranch.isAcceptingOrders
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {activeBranch.isAcceptingOrders ? 'Accepting Orders' : 'Paused'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Total Branches:</span>
                <span className="font-bold text-slate-800">{activeRestaurant?.branches.length} branch(es)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Operating Hours Schedule */}
      {activeTab === 'hours' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Weekly Operating Hours</h3>
              <p className="text-xs text-slate-500 mt-0.5">Configure opening and closing schedules for each day of the week</p>
            </div>
            <button
              onClick={handleSaveHours}
              disabled={savingHours}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingHours ? 'Saving...' : 'Save Schedule'}</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {hoursList.map((item, idx) => (
              <div key={item.dayOfWeek} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="w-32 font-bold text-xs text-slate-800">{DAY_NAMES[item.dayOfWeek]}</div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={item.isClosed}
                      onChange={(e) => {
                        const updated = [...hoursList];
                        updated[idx].isClosed = e.target.checked;
                        setHoursList(updated);
                      }}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>Closed</span>
                  </label>

                  {!item.isClosed && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={item.openingTime}
                        onChange={(e) => {
                          const updated = [...hoursList];
                          updated[idx].openingTime = e.target.value;
                          setHoursList(updated);
                        }}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                      />
                      <span className="text-xs text-slate-400">to</span>
                      <input
                        type="time"
                        value={item.closingTime}
                        onChange={(e) => {
                          const updated = [...hoursList];
                          updated[idx].closingTime = e.target.value;
                          setHoursList(updated);
                        }}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Delivery Zone */}
      {activeTab === 'zone' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Delivery Zone & Service Estimates</h3>
              <p className="text-xs text-slate-500 mt-0.5">Control the delivery radius (max 100km) and estimated delivery duration</p>
            </div>
            <button
              onClick={handleSaveZone}
              disabled={savingZone}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingZone ? 'Saving...' : 'Save Zone'}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Delivery Radius (km): <span className="text-orange-600">{zoneRadius} km</span>
              </label>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={zoneRadius}
                onChange={(e) => setZoneRadius(parseFloat(e.target.value))}
                className="w-full accent-orange-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Min Delivery Time (mins)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={minDeliveryTime}
                  onChange={(e) => setMinDeliveryTime(parseInt(e.target.value) || 20)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Max Delivery Time (mins)</label>
                <input
                  type="number"
                  min="10"
                  max="180"
                  value={maxDeliveryTime}
                  onChange={(e) => setMaxDeliveryTime(parseInt(e.target.value) || 45)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Kitchen Staff Roster */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Add Staff Form */}
          <form
            onSubmit={handleAddStaff}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-end gap-4"
          >
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">User ID to Assign</label>
              <input
                type="text"
                placeholder="e.g. 5"
                value={newStaffUserId}
                onChange={(e) => setNewStaffUserId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
              <select
                value={newStaffDesignation}
                onChange={(e) => setNewStaffDesignation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="MANAGER">Manager</option>
                <option value="KITCHEN_STAFF">Kitchen Staff</option>
                <option value="CASHIER">Cashier</option>
                <option value="DISPATCHER">Dispatcher</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={addingStaff}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{addingStaff ? 'Adding...' : 'Assign Staff'}</span>
            </button>
          </form>

          {/* Staff List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Branch Staff Members</h3>
              <span className="text-xs text-slate-400 font-semibold">{staffList.length} member(s)</span>
            </div>

            {staffList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No staff members currently assigned to this branch.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {staffList.map((member) => (
                  <div key={member.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-xs">
                        {member.user?.firstName ? member.user.firstName[0] : 'U'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {member.user?.firstName} {member.user?.lastName || ''} (ID: #{member.userId})
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {member.user?.email || member.user?.phone} &bull; Designation: {member.designation}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveStaff(member.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Staff Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {showAddBranchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Add New Branch</h3>
              <button onClick={() => setShowAddBranchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Koramangala Branch"
                  value={newBranchData.branchName}
                  onChange={(e) => setNewBranchData({ ...newBranchData, branchName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    required
                    placeholder="29ABCDE1234F1Z5"
                    value={newBranchData.gstin}
                    onChange={(e) => setNewBranchData({ ...newBranchData, gstin: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">FSSAI License</label>
                  <input
                    type="text"
                    required
                    placeholder="11223344556677"
                    value={newBranchData.fssaiLicenseNumber}
                    onChange={(e) => setNewBranchData({ ...newBranchData, fssaiLicenseNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  placeholder="9876543210"
                  value={newBranchData.contactPhone}
                  onChange={(e) => setNewBranchData({ ...newBranchData, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  required
                  placeholder="80 Feet Road, 4th Block"
                  value={newBranchData.addressLine1}
                  onChange={(e) => setNewBranchData({ ...newBranchData, addressLine1: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newBranchData.city}
                    onChange={(e) => setNewBranchData({ ...newBranchData, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newBranchData.state}
                    onChange={(e) => setNewBranchData({ ...newBranchData, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN</label>
                  <input
                    type="text"
                    required
                    value={newBranchData.postalCode}
                    onChange={(e) => setNewBranchData({ ...newBranchData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Base Delivery Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newBranchData.deliveryFee}
                    onChange={(e) => setNewBranchData({ ...newBranchData, deliveryFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newBranchData.minimumOrderValue}
                    onChange={(e) => setNewBranchData({ ...newBranchData, minimumOrderValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingBranch}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-50"
                >
                  {creatingBranch ? 'Creating...' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

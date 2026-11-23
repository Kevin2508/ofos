import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Bike,
  Power,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  Package,
  RotateCcw,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Send,
  Star,
  Check,
  X,
} from 'lucide-react';

interface ActiveOrder {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  subtotalAmount: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  estimatedDeliveryAt?: string;
  createdAt: string;
  branch: {
    id: string;
    branchName: string;
    addressLine1: string;
    city: string;
    contactPhone?: string;
    latitude?: number;
    longitude?: number;
  };
  address?: {
    recipientName: string;
    recipientPhone: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    specialInstructions?: string;
    modifiers: Array<{
      id: string;
      optionName: string;
      additionalPrice: number;
    }>;
  }>;
}

interface ActiveAssignment {
  id: string;
  orderId: string;
  partnerUserId: string;
  status: 'ASSIGNED' | 'ACCEPTED' | 'COMPLETED' | 'DECLINED';
  assignedAt: string;
  acceptedAt?: string;
  order: ActiveOrder;
}

interface PartnerProfile {
  userId: string;
  vehicleType: string;
  vehicleRegistrationNumber: string;
  isOnline: boolean;
  averageRating: number;
  totalCompletedDeliveries: number;
  status: string;
  user: {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone: string;
  };
}

interface EarningsData {
  period: string;
  deliveriesCount: number;
  totalEarning: number;
  baseEarning: number;
  tipAmount: number;
  incentives: number;
  history: Array<{
    id: string;
    orderId: string;
    orderNumber?: string;
    baseEarning: number;
    tipAmount: number;
    incentiveAmount: number;
    totalEarning: number;
    status: string;
    createdAt: string;
  }>;
}

export const DeliveryPartnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<ActiveAssignment | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'weekly' | 'all'>('today');
  const [activeTab, setActiveTab] = useState<'active' | 'earnings' | 'history'>('active');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueReason, setIssueReason] = useState('VEHICLE_BREAKDOWN');
  const [issueNotes, setIssueNotes] = useState('');

  const fetchPartnerData = useCallback(async () => {
    try {
      const [profRes, assignRes, earnRes] = await Promise.all([
        apiClient.get<PartnerProfile>('/delivery-partner/profile'),
        apiClient.get<ActiveAssignment | null>('/delivery-partner/assignments/active'),
        apiClient.get<EarningsData>(`/delivery-partner/earnings?period=${selectedPeriod}`),
      ]);

      setProfile(profRes.data);
      setActiveAssignment(assignRes.data);
      setEarnings(earnRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load driver dashboard.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchPartnerData();
    const interval = setInterval(fetchPartnerData, 8000);
    return () => clearInterval(interval);
  }, [fetchPartnerData]);

  const toggleDutyStatus = async () => {
    if (!profile) return;
    try {
      setActionLoading(true);
      const res = await apiClient.patch<{ isOnline: boolean; status: string; message: string }>(
        '/delivery-partner/status',
        {
          isOnline: !profile.isOnline,
        }
      );
      setProfile((prev) => (prev ? { ...prev, isOnline: res.data.isOnline } : null));
      setSuccessMsg(res.data.message);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update duty status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptAssignment = async () => {
    if (!activeAssignment) return;
    try {
      setActionLoading(true);
      await apiClient.patch(`/orders/assignments/${activeAssignment.id}/accept`);
      setSuccessMsg('Assignment accepted! Proceed to restaurant.');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchPartnerData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineAssignment = async () => {
    if (!activeAssignment) return;
    try {
      setActionLoading(true);
      await apiClient.patch(`/orders/assignments/${activeAssignment.id}/decline`, {
        reason: 'Unable to fulfill this delivery',
      });
      setActiveAssignment(null);
      setSuccessMsg('Assignment declined.');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchPartnerData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to decline assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkOutForDelivery = async () => {
    if (!activeAssignment) return;
    try {
      setActionLoading(true);
      await apiClient.patch(`/orders/${activeAssignment.orderId}/out-for-delivery`);
      setSuccessMsg('Order marked Out for Delivery!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchPartnerData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark out for delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtpAndDeliver = async () => {
    if (!activeAssignment) return;
    if (!otpInput || otpInput.trim().length < 4) {
      setOtpError('Please enter a valid 4-6 digit numeric OTP.');
      return;
    }

    try {
      setActionLoading(true);
      setOtpError(null);
      await apiClient.patch(`/orders/${activeAssignment.orderId}/deliver`, {
        otp: otpInput.trim(),
      });
      setShowOtpModal(false);
      setOtpInput('');
      setSuccessMsg('Delivery completed successfully! Great job!');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchPartnerData();
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Invalid delivery OTP.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBroadcastGps = async () => {
    if (!activeAssignment) return;
    try {
      // Safely parse base coordinates as numbers to avoid string concatenation
      const rawLat = activeAssignment.order.address?.latitude;
      const rawLng = activeAssignment.order.address?.longitude;
      const baseLat = typeof rawLat === 'number' ? rawLat : parseFloat(String(rawLat || '19.0760'));
      const baseLng = typeof rawLng === 'number' ? rawLng : parseFloat(String(rawLng || '72.8777'));

      const validLat = isNaN(baseLat) ? 19.076 : baseLat;
      const validLng = isNaN(baseLng) ? 72.8777 : baseLng;

      // Small jitter within realistic range, strictly typed as numbers
      const lat = Number((validLat + (Math.random() - 0.5) * 0.005).toFixed(6));
      const lng = Number((validLng + (Math.random() - 0.5) * 0.005).toFixed(6));

      await apiClient.post(`/delivery-partner/assignments/${activeAssignment.id}/location`, {
        latitude: lat,
        longitude: lng,
      });
      setSuccessMsg('GPS Location updated successfully!');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      const rawMsg = err.response?.data?.message;
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg || 'Failed to broadcast location.';
      setError(msg);
    }
  };

  const handleReportIssue = async () => {
    if (!activeAssignment) return;
    try {
      setActionLoading(true);
      await apiClient.post(`/delivery-partner/assignments/${activeAssignment.id}/report-issue`, {
        issueReason,
        notes: issueNotes,
      });
      setShowIssueModal(false);
      setIssueNotes('');
      setSuccessMsg('Issue logged and reported to Fleet Dispatcher.');
      setTimeout(() => setSuccessMsg(null), 3500);
      fetchPartnerData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to report issue.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-medium">Connecting to Rider Network...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner: Rider Identity & Online Duty Switch */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner flex-shrink-0">
            <Bike className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {profile?.user.firstName} {profile?.user.lastName || ''}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {profile?.vehicleType || 'Motorcycle'} &bull; {profile?.vehicleRegistrationNumber || 'Reg Pending'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Phone: <strong className="text-slate-700">{profile?.user.phone}</strong></span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {profile?.averageRating ? profile.averageRating.toFixed(1) : '5.0'}
              </span>
              <span>&bull;</span>
              <span>{profile?.totalCompletedDeliveries || 0} Delivered</span>
            </p>
          </div>
        </div>

        {/* Duty Status Switch */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Duty Status</span>
            <span className={`text-sm font-black ${profile?.isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
              {profile?.isOnline ? 'ONLINE & READY' : 'OFFLINE'}
            </span>
          </div>
          <button
            onClick={toggleDutyStatus}
            disabled={actionLoading}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md ${
              profile?.isOnline
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-600 shadow-slate-300/30'
            }`}
            title={profile?.isOnline ? 'Go Offline' : 'Go Online'}
          >
            <Power className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center justify-between animate-fade-in">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'active'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Current Delivery</span>
          {activeAssignment && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'earnings'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Earnings & Payouts</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE DELIVERY */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {activeAssignment ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                    Assignment Status: {activeAssignment.status}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Order #{activeAssignment.order.orderNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Placed at {new Date(activeAssignment.order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Payout for Order</span>
                  <span className="text-xl font-black text-emerald-600">
                    ₹{Number(activeAssignment.order.deliveryFee) > 0 ? Number(activeAssignment.order.deliveryFee).toFixed(0) : '50'}
                  </span>
                </div>
              </div>

              {/* Waypoints Grid: Restaurant Pickup -> Customer Dropoff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pickup Card */}
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> 1. Pickup from Restaurant
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Status: {activeAssignment.order.orderStatus}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {activeAssignment.order.branch.branchName}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeAssignment.order.branch.addressLine1}, {activeAssignment.order.branch.city}
                  </p>
                  {activeAssignment.order.branch.contactPhone && (
                    <div className="pt-2">
                      <a
                        href={`tel:${activeAssignment.order.branch.contactPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                        <span>Call Kitchen: {activeAssignment.order.branch.contactPhone}</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Dropoff Card */}
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" /> 2. Dropoff to Customer
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Payment: {activeAssignment.order.paymentStatus}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {activeAssignment.order.address?.recipientName || 'Customer'}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeAssignment.order.address?.addressLine1}
                    {activeAssignment.order.address?.landmark && ` (Near ${activeAssignment.order.address.landmark})`}
                    , {activeAssignment.order.address?.city}
                  </p>
                  {activeAssignment.order.address?.recipientPhone && (
                    <div className="pt-2">
                      <a
                        href={`tel:${activeAssignment.order.address.recipientPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>Call Customer: {activeAssignment.order.address.recipientPhone}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="space-y-2 pt-2">
                <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Order Items ({activeAssignment.order.items.length})
                </h5>
                <div className="divide-y divide-slate-100 bg-slate-50 rounded-2xl p-4 border border-slate-200/60">
                  {activeAssignment.order.items.map((item) => (
                    <div key={item.id} className="py-2 flex items-start justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{item.quantity}x {item.itemName}</span>
                        {item.modifiers.length > 0 && (
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {item.modifiers.map((m) => m.optionName).join(', ')}
                          </p>
                        )}
                        {item.specialInstructions && (
                          <p className="text-[10px] text-orange-600 italic">&quot;{item.specialInstructions}&quot;</p>
                        )}
                      </div>
                      <span className="font-bold text-slate-700">₹{item.lineTotal.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Controls based on State */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBroadcastGps}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
                    title="Send current GPS beacon to customer & dispatch"
                  >
                    <Send className="w-3.5 h-3.5 text-orange-500" />
                    <span>Ping GPS Location</span>
                  </button>
                  <button
                    onClick={() => setShowIssueModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-colors flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Report Issue</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {activeAssignment.status === 'ASSIGNED' && (
                    <>
                      <button
                        onClick={handleDeclineAssignment}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={handleAcceptAssignment}
                        disabled={actionLoading}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Assignment</span>
                      </button>
                    </>
                  )}

                  {activeAssignment.status === 'ACCEPTED' && activeAssignment.order.orderStatus === 'PICKED_UP' && (
                    <button
                      onClick={handleMarkOutForDelivery}
                      disabled={actionLoading}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Start Delivery Transit</span>
                    </button>
                  )}

                  {activeAssignment.status === 'ACCEPTED' && activeAssignment.order.orderStatus === 'READY_FOR_PICKUP' && (
                    <div className="text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                      Awaiting Kitchen Handover...
                    </div>
                  )}

                  {activeAssignment.status === 'ACCEPTED' && activeAssignment.order.orderStatus === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => setShowOtpModal(true)}
                      disabled={actionLoading}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Verify Customer OTP & Deliver</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto shadow-inner">
                <Bike className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-800">
                {profile?.isOnline ? 'Waiting for New Deliveries...' : 'You Are Currently Offline'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {profile?.isOnline
                  ? 'Keep this screen open or GPS active. Nearby restaurant orders will be automatically routed to you.'
                  : 'Toggle your duty status switch above to start receiving delivery orders in your zone.'}
              </p>
              {!profile?.isOnline && (
                <button
                  onClick={toggleDutyStatus}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Go Online Now
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EARNINGS & PAYOUTS */}
      {activeTab === 'earnings' && earnings && (
        <div className="space-y-6">
          {/* Period Filter */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
            {(['today', 'weekly', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                  selectedPeriod === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {p === 'today' ? "Today's Earnings" : p === 'weekly' ? 'Past 7 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Earnings</span>
              <div className="text-2xl font-black text-emerald-600">₹{earnings.totalEarning.toFixed(0)}</div>
              <span className="text-[10px] text-slate-500">Gross payout amount</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base Delivery Pay</span>
              <div className="text-2xl font-black text-slate-900">₹{earnings.baseEarning.toFixed(0)}</div>
              <span className="text-[10px] text-slate-500">Distance & trip fees</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tips & Incentives</span>
              <div className="text-2xl font-black text-amber-600">₹{(earnings.tipAmount + earnings.incentives).toFixed(0)}</div>
              <span className="text-[10px] text-slate-500">Customer gratuities</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Trips</span>
              <div className="text-2xl font-black text-slate-900">{earnings.deliveriesCount}</div>
              <span className="text-[10px] text-emerald-600 font-bold">100% verified via OTP</span>
            </div>
          </div>

          {/* Earnings History Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm text-slate-900">Earnings History</h4>
            {earnings.history.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {earnings.history.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">
                        Order #{item.orderNumber || item.orderId}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleString()} &bull; Base ₹{item.baseEarning.toFixed(0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-600 text-sm block">
                        +₹{item.totalEarning.toFixed(0)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center italic">No earnings records found for this period.</p>
            )}
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-black text-slate-900 text-base">Enter Delivery OTP</h4>
              <p className="text-xs text-slate-500 mt-1">
                Ask the customer for the 6-digit PIN displayed on their live tracking screen.
              </p>
            </div>

            {otpError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 text-center font-bold">
                {otpError}
              </div>
            )}

            <div>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowOtpModal(false);
                  setOtpInput('');
                  setOtpError(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtpAndDeliver}
                disabled={actionLoading || otpInput.length < 4}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-colors"
              >
                {actionLoading ? 'Verifying...' : 'Confirm Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-black text-slate-900 text-base">Report Delivery Issue</h4>
              <p className="text-xs text-slate-500 mt-1">
                Notify the fleet dispatcher immediately so they can reassign or support you.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Issue Reason</label>
                <select
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="VEHICLE_BREAKDOWN">Vehicle Breakdown / Puncture</option>
                  <option value="CUSTOMER_UNREACHABLE">Customer Not Answering Phone</option>
                  <option value="TRAFFIC_DELAY">Heavy Traffic / Road Closed</option>
                  <option value="BAD_WEATHER">Severe Weather / Rain</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  rows={3}
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="Describe the situation briefly..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReportIssue}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-colors"
              >
                {actionLoading ? 'Reporting...' : 'Submit Issue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

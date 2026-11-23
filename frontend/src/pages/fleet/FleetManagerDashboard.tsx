import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import {
  Compass,
  Bike,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Send,
  UserCheck,
  UserX,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Filter,
  Search,
  Navigation,
  X,
} from 'lucide-react';

interface OnlinePartner {
  userId: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleRegistrationNumber: string;
  averageRating: number;
  status: string;
  isOnline: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    recordedAt: string;
  } | null;
  activeAssignment?: {
    id: string;
    orderId: string;
    status: string;
    order: {
      id: string;
      orderNumber: string;
      orderStatus: string;
      branch?: {
        branchName: string;
        latitude?: number;
        longitude?: number;
      };
      address?: {
        recipientName: string;
        addressLine1: string;
        latitude?: number;
        longitude?: number;
      };
    };
  } | null;
}

interface UnassignedOrder {
  id: string;
  orderNumber: string;
  orderStatus: string;
  totalAmount: number;
  createdAt: string;
  restaurantName: string;
  branch: {
    id: string;
    branchName: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  address?: {
    recipientName: string;
    addressLine1: string;
    city: string;
  };
}

interface LiveMapData {
  totalOnline: number;
  totalInTransit: number;
  totalIdle: number;
  totalUnassigned: number;
  onlinePartners: OnlinePartner[];
  unassignedOrders: UnassignedOrder[];
}

interface RiderSummary {
  userId: string;
  name: string;
  email?: string;
  phone: string;
  vehicleType: string;
  vehicleRegistrationNumber: string;
  isOnline: boolean;
  status: string;
  averageRating: number;
  totalCompletedDeliveries: number;
  joinedAt: string;
  activeAssignment?: {
    id: string;
    orderId: string;
    status: string;
  } | null;
}

export const FleetManagerDashboard: React.FC = () => {
  const [liveData, setLiveData] = useState<LiveMapData | null>(null);
  const [riders, setRiders] = useState<RiderSummary[]>([]);
  const [activeTab, setActiveTab] = useState<'dispatch' | 'riders'>('dispatch');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Manual Dispatch Modal
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<UnassignedOrder | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');

  // Reassignment Modal
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [reassignReason, setReassignReason] = useState<string>('');

  const fetchFleetData = useCallback(async () => {
    try {
      const [mapRes, ridersRes] = await Promise.all([
        apiClient.get<LiveMapData>('/fleet-manager/live-map'),
        apiClient.get<{ riders: RiderSummary[] }>('/fleet-manager/riders?limit=50'),
      ]);

      setLiveData(mapRes.data);
      setRiders(ridersRes.data.riders);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch live fleet data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFleetData();
    const interval = setInterval(fetchFleetData, 7000);
    return () => clearInterval(interval);
  }, [fetchFleetData]);

  const handleManualAssign = async () => {
    if (!selectedOrderForDispatch || !selectedPartnerId) return;
    try {
      setActionLoading(true);
      await apiClient.post(`/fleet-manager/${selectedOrderForDispatch.id}/assign`, {
        partnerUserId: selectedPartnerId,
      });
      setSuccessMsg(`Order #${selectedOrderForDispatch.orderNumber} successfully assigned!`);
      setSelectedOrderForDispatch(null);
      setSelectedPartnerId('');
      setTimeout(() => setSuccessMsg(null), 3500);
      fetchFleetData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to dispatch order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedAssignmentId || !selectedPartnerId) return;
    try {
      setActionLoading(true);
      await apiClient.patch(`/fleet-manager/assignments/${selectedAssignmentId}/reassign`, {
        newPartnerUserId: selectedPartnerId,
        reason: reassignReason || 'Reassigned by fleet controller',
      });
      setSuccessMsg('Delivery assignment successfully reassigned.');
      setSelectedAssignmentId(null);
      setSelectedPartnerId('');
      setReassignReason('');
      setTimeout(() => setSuccessMsg(null), 3500);
      fetchFleetData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reassign delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRiderStatus = async (userId: string, status: string) => {
    try {
      setActionLoading(true);
      await apiClient.patch(`/fleet-manager/riders/${userId}/status`, { status });
      setSuccessMsg(`Rider status updated to ${status}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchFleetData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update rider status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-medium">Connecting to Fleet Radar & Dispatch...</p>
      </div>
    );
  }

  const idlePartners = liveData?.onlinePartners.filter((p) => !p.activeAssignment) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner flex-shrink-0">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Fleet Command & Dispatch</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Live Radar Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time rider telemetry, unassigned order queues, and manual dispatch controls
            </p>
          </div>
        </div>

        <button
          onClick={fetchFleetData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {/* Notifications */}
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

      {/* KPI Overviews */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Online Riders</span>
          <div className="text-2xl font-black text-emerald-600">{liveData?.totalOnline || 0}</div>
          <span className="text-[10px] text-slate-500">Currently on duty</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Transit</span>
          <div className="text-2xl font-black text-blue-600">{liveData?.totalInTransit || 0}</div>
          <span className="text-[10px] text-slate-500">Executing deliveries</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available / Idle</span>
          <div className="text-2xl font-black text-slate-900">{liveData?.totalIdle || 0}</div>
          <span className="text-[10px] text-emerald-600 font-bold">Ready for dispatch</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unassigned Orders</span>
          <div className={`text-2xl font-black ${(liveData?.totalUnassigned || 0) > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {liveData?.totalUnassigned || 0}
          </div>
          <span className="text-[10px] text-slate-500">Require rider dispatch</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'dispatch'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Live Dispatch & Radar</span>
          {(liveData?.totalUnassigned || 0) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-amber-950 font-black">
              {liveData?.totalUnassigned}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('riders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'riders'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Fleet Roster ({riders.length})</span>
        </button>
      </div>

      {/* TAB 1: LIVE DISPATCH */}
      {activeTab === 'dispatch' && (
        <div className="space-y-6">
          {/* Unassigned Orders Queue */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Unassigned Orders Queue</h3>
                <p className="text-xs text-slate-500">Orders ready or cooking awaiting rider assignment</p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {liveData?.unassignedOrders.length || 0} orders waiting
              </span>
            </div>

            {(liveData?.unassignedOrders.length || 0) > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveData?.unassignedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          {order.orderStatus}
                        </span>
                        <span className="text-xs font-black text-slate-900">₹{order.totalAmount.toFixed(0)}</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-2">
                        #{order.orderNumber} &bull; {order.restaurantName}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Pickup: <strong>{order.branch.branchName}</strong> ({order.branch.city})
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Dropoff: {order.address?.recipientName} ({order.address?.addressLine1})
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Placed {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedOrderForDispatch(order);
                          setSelectedPartnerId(idlePartners[0]?.userId || '');
                        }}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Rider</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-400 italic">
                All incoming orders have been assigned to delivery partners.
              </div>
            )}
          </div>

          {/* Live Online Riders Grid */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Online Fleet Radar</h3>
                <p className="text-xs text-slate-500">Live positions and active task statuses of on-duty riders</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>{liveData?.totalOnline} Riders Live</span>
              </span>
            </div>

            {(liveData?.onlinePartners.length || 0) > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveData?.onlinePartners.map((partner) => (
                  <div
                    key={partner.userId}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                            <Bike className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs text-slate-900">{partner.name}</h4>
                            <span className="text-[10px] text-slate-400">{partner.vehicleType}</span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            partner.activeAssignment
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {partner.activeAssignment ? 'In Transit' : 'Idle / Available'}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-slate-600 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{partner.phone}</span>
                        </div>
                        {partner.currentLocation ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Navigation className="w-3.5 h-3.5 text-blue-500" />
                            <span>
                              GPS: {partner.currentLocation.latitude.toFixed(4)},{' '}
                              {partner.currentLocation.longitude.toFixed(4)}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">No GPS beacon received yet</div>
                        )}
                      </div>

                      {partner.activeAssignment && (
                        <div className="mt-3 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950">
                          <div className="font-bold">Active Delivery:</div>
                          <div className="font-mono text-[11px]">#{partner.activeAssignment.order.orderNumber}</div>
                          <div className="text-[10px] text-blue-700">Status: {partner.activeAssignment.order.orderStatus}</div>
                        </div>
                      )}
                    </div>

                    {partner.activeAssignment && (
                      <div className="pt-2 border-t border-slate-200">
                        <button
                          onClick={() => {
                            setSelectedAssignmentId(partner.activeAssignment?.id || null);
                            setSelectedPartnerId(idlePartners[0]?.userId || '');
                          }}
                          className="w-full py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors text-center"
                        >
                          Reassign Order
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-400 italic">
                No riders are currently online.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FLEET ROSTER */}
      {activeTab === 'riders' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Registered Delivery Fleet</h3>
              <p className="text-xs text-slate-500">Manage partner verification, duty rights, and account suspensions</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Rider</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Duty Status</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Deliveries</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {riders.map((r) => (
                  <tr key={r.userId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <div className="text-[10px] text-slate-400">{r.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{r.vehicleType}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.vehicleRegistrationNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'SUSPENDED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ★ {r.averageRating ? r.averageRating.toFixed(1) : '5.0'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.totalCompletedDeliveries}</td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleUpdateRiderStatus(r.userId, 'SUSPENDED')}
                          className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateRiderStatus(r.userId, 'ACTIVE')}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Dispatch Modal */}
      {selectedOrderForDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-black text-slate-900 text-base">Manual Dispatch Order</h4>
              <p className="text-xs text-slate-500 mt-1">
                Assign Order #{selectedOrderForDispatch.orderNumber} to an active on-duty delivery partner.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Delivery Partner</label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Choose Rider --</option>
                  {liveData?.onlinePartners.map((p) => (
                    <option key={p.userId} value={p.userId}>
                      {p.name} ({p.vehicleType}) - {p.activeAssignment ? 'Busy' : 'Available'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForDispatch(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualAssign}
                disabled={actionLoading || !selectedPartnerId}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-colors"
              >
                {actionLoading ? 'Assigning...' : 'Dispatch Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {selectedAssignmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-black text-slate-900 text-base">Reassign Delivery</h4>
              <p className="text-xs text-slate-500 mt-1">
                Transfer assignment to another on-duty partner.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">New Delivery Partner</label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Choose Replacement Rider --</option>
                  {liveData?.onlinePartners.map((p) => (
                    <option key={p.userId} value={p.userId}>
                      {p.name} ({p.vehicleType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Reassignment Reason</label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g. Previous rider experienced breakdown"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAssignmentId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassign}
                disabled={actionLoading || !selectedPartnerId}
                className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-colors"
              >
                {actionLoading ? 'Reassigning...' : 'Confirm Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

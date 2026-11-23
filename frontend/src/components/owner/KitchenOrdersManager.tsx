import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  CookingPot,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Bike,
  Package,
  Phone,
  Check,
  X,
  ChefHat,
  BellRing,
} from 'lucide-react';

interface BranchOrder {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  subtotalAmount: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  estimatedDeliveryAt?: string;
  customer?: {
    firstName: string;
    lastName?: string;
    phone: string;
  };
  address?: {
    contactName: string;
    contactPhone: string;
    addressLine1: string;
    city: string;
  };
  branch?: {
    id: string;
    branchName: string;
  };
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    specialInstructions?: string;
    modifiers?: Array<{
      id: string;
      optionName?: string;
      additionalPrice: number;
    }>;
  }>;
  driver?: {
    name: string;
    phone: string;
  } | null;
}

export const KitchenOrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<BranchOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'NEW' | 'KITCHEN' | 'READY' | 'COMPLETED'>('NEW');

  // Reject modal
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Kitchen is overwhelmed');

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get<any>('/orders/branch');
      const list: BranchOrder[] = Array.isArray(res.data) ? res.data : (res.data?.orders || res.data?.data || []);
      setOrders(list);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch branch orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (orderId: string, action: 'accept' | 'preparing' | 'ready' | 'handover') => {
    try {
      await apiClient.patch(`/orders/${orderId}/${action}`, {});
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} order.`);
    }
  };

  const handleReject = async () => {
    if (!rejectOrderId) return;
    try {
      await apiClient.patch(`/orders/${rejectOrderId}/reject`, { reason: rejectReason });
      setRejectOrderId(null);
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject order.');
    }
  };

  const newOrders = orders.filter((o) => o.orderStatus === 'PLACED');
  const kitchenOrders = orders.filter((o) => o.orderStatus === 'ACCEPTED' || o.orderStatus === 'PREPARING');
  const readyOrders = orders.filter((o) => o.orderStatus === 'READY_FOR_PICKUP');
  const completedOrders = orders.filter(
    (o) =>
      o.orderStatus === 'PICKED_UP' ||
      o.orderStatus === 'OUT_FOR_DELIVERY' ||
      o.orderStatus === 'DELIVERED' ||
      o.orderStatus === 'CANCELLED' ||
      o.orderStatus === 'REJECTED'
  );

  const displayedOrders =
    activeTab === 'NEW'
      ? newOrders
      : activeTab === 'KITCHEN'
        ? kitchenOrders
        : activeTab === 'READY'
          ? readyOrders
          : completedOrders;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-600" />
            <span>Kitchen Display & Live Orders</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Real-time kitchen order workflow, preparation statuses, and driver handovers
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('NEW')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'NEW'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>Incoming Orders</span>
          {newOrders.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'NEW' ? 'bg-white text-orange-600' : 'bg-orange-600 text-white'
              }`}
            >
              {newOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('KITCHEN')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'KITCHEN'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>Kitchen / Cooking</span>
          {kitchenOrders.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'KITCHEN' ? 'bg-white text-orange-600' : 'bg-slate-700 text-white'
              }`}
            >
              {kitchenOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('READY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'READY'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>Ready for Pickup</span>
          {readyOrders.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'READY' ? 'bg-white text-orange-600' : 'bg-emerald-600 text-white'
              }`}
            >
              {readyOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'COMPLETED'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Dispatched / Delivered
        </button>
      </div>

      {/* Orders Grid */}
      {displayedOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-sm text-slate-800">No orders in this queue</h4>
          <p className="text-xs text-slate-400">
            Incoming orders will update automatically every few seconds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedOrders.map((ord) => {
            const isPlaced = ord.orderStatus === 'PLACED';
            const isAccepted = ord.orderStatus === 'ACCEPTED';
            const isPreparing = ord.orderStatus === 'PREPARING';
            const isReady = ord.orderStatus === 'READY_FOR_PICKUP';

            return (
              <div
                key={ord.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                {/* Header */}
                <div className="space-y-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-black text-slate-800">
                        #{ord.orderNumber}
                      </span>
                      {ord.branch?.branchName && (
                        <p className="text-[10px] font-bold text-orange-600">
                          {ord.branch.branchName}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        isPlaced
                          ? 'bg-orange-100 text-orange-800 animate-pulse'
                          : isPreparing
                            ? 'bg-amber-100 text-amber-800'
                            : isReady
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ord.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>
                      {ord.customer
                        ? `${ord.customer.firstName} ${ord.customer.lastName || ''}`
                        : ord.address?.contactName || 'Customer'}
                    </span>
                    <span className="font-bold text-slate-900">₹{Number(ord.totalAmount).toFixed(0)}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 flex-1 max-h-48 overflow-y-auto pr-1">
                  {ord.items.map((item) => (
                    <div key={item.id} className="text-xs flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-800">
                          {item.quantity}x {item.itemName}
                        </span>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-[10px] text-slate-400">
                            {item.modifiers.map((m) => m.optionName).join(', ')}
                          </div>
                        )}
                        {item.specialInstructions && (
                          <div className="text-[10px] text-orange-600 italic">
                            &quot;{item.specialInstructions}&quot;
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-slate-700">
                        ₹{Number(item.lineTotal).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons depending on status */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {isPlaced && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAction(ord.id, 'accept')}
                        className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => setRejectOrderId(ord.id)}
                        className="py-2 border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {isAccepted && (
                    <button
                      onClick={() => handleAction(ord.id, 'preparing')}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CookingPot className="w-3.5 h-3.5" />
                      <span>Start Cooking</span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      onClick={() => handleAction(ord.id, 'ready')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Ready for Pickup</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={() => handleAction(ord.id, 'handover')}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Bike className="w-3.5 h-3.5" />
                      <span>Handover to Driver</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h4 className="font-black text-slate-900 text-base">Reject Order</h4>
            <p className="text-xs text-slate-500">
              Please specify a reason for rejecting this order:
            </p>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            >
              <option value="Kitchen is overwhelmed">Kitchen is overwhelmed</option>
              <option value="Item ingredients out of stock">Item ingredients out of stock</option>
              <option value="Closing early today">Closing early today</option>
              <option value="Other">Other</option>
            </select>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRejectOrderId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  ShoppingBag,
  Clock,
  ArrowRight,
  Store,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';

interface OrderItemSummary {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  restaurant?: {
    businessName: string;
    logoUrl?: string;
  };
  branch?: {
    branchName: string;
  };
  items?: Array<{
    itemName: string;
    quantity: number;
  }>;
}

interface OrderHistoryPageProps {
  onSelectOrder: (orderId: string) => void;
  onExplore: () => void;
}

export const OrderHistoryPage: React.FC<OrderHistoryPageProps> = ({
  onSelectOrder,
  onExplore,
}) => {
  const [orders, setOrders] = useState<OrderItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/orders');
      const list = Array.isArray(res.data) ? res.data : (res.data?.orders || res.data?.data || []);
      setOrders(list);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Delivered</span>
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" />
            <span className="capitalize">{status.toLowerCase()}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 animate-pulse">
            <Clock className="w-3 h-3" />
            <span className="capitalize">{status.replace(/_/g, ' ').toLowerCase()}</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading your order history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Orders</h2>
          <p className="text-xs text-slate-500 font-medium">
            Review past meals and track active deliveries
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl py-20 px-4 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">No orders yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven&apos;t placed any orders yet. Discover our curated restaurants and start your first feast!
          </p>
          <button
            onClick={onExplore}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
          >
            <span>Explore Restaurants</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-orange-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    #{ord.orderNumber}
                  </span>
                  {getStatusBadge(ord.orderStatus)}
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 truncate">
                  {ord.restaurant?.businessName || 'Restaurant'}
                </h4>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Total Amount
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    ₹{Number(ord.totalAmount).toFixed(0)}
                  </div>
                </div>

                <button
                  onClick={() => onSelectOrder(ord.id)}
                  className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <span>Track / View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

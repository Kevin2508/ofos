import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Send,
  SlidersHorizontal,
  ChevronRight,
  Banknote,
  Search,
} from 'lucide-react';
import { apiClient } from '../../api/client';

interface FinanceOverview {
  totalOrders: number;
  totalRevenue: number;
  totalRefunds: number;
  totalPendingRestaurantPayouts: number;
  totalPendingPartnerPayouts: number;
  totalPendingPayouts: number;
}

interface RefundItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  paymentId: string;
  paymentProvider: string;
  refundReference: string;
  amount: number;
  reason: string;
  status: 'INITIATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

interface RestaurantPayoutItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  payoutReference: string;
  payoutPeriodStart: string;
  payoutPeriodEnd: string;
  grossAmount: number;
  commissionAmount: number;
  taxAmount: number;
  netAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  paidAt?: string;
  itemsCount: number;
  createdAt: string;
}

interface PartnerPayoutItem {
  id: string;
  partnerUserId: string;
  partnerName: string;
  partnerPhone: string;
  payoutReference: string;
  grossAmount: number;
  incentiveAmount: number;
  netAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  paidAt?: string;
  itemsCount: number;
  createdAt: string;
}

export const FinanceManagerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'refunds' | 'restaurants' | 'partners'>('refunds');
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [restaurantPayouts, setRestaurantPayouts] = useState<RestaurantPayoutItem[]>([]);
  const [partnerPayouts, setPartnerPayouts] = useState<PartnerPayoutItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await apiClient.get<FinanceOverview>('/finance/overview');
      setOverview(res.data);
    } catch (err: any) {
      console.error('Failed to load financial overview:', err);
    }
  };

  const fetchRefunds = async () => {
    try {
      const res = await apiClient.get<{ data: RefundItem[] }>('/finance/refunds');
      setRefunds(res.data.data);
    } catch (err: any) {
      console.error('Failed to fetch refunds:', err);
    }
  };

  const fetchRestaurantPayouts = async () => {
    try {
      const res = await apiClient.get<{ data: RestaurantPayoutItem[] }>('/finance/payouts/restaurants');
      setRestaurantPayouts(res.data.data);
    } catch (err: any) {
      console.error('Failed to fetch restaurant payouts:', err);
    }
  };

  const fetchPartnerPayouts = async () => {
    try {
      const res = await apiClient.get<{ data: PartnerPayoutItem[] }>('/finance/payouts/partners');
      setPartnerPayouts(res.data.data);
    } catch (err: any) {
      console.error('Failed to fetch partner payouts:', err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchOverview(),
      fetchRefunds(),
      fetchRestaurantPayouts(),
      fetchPartnerPayouts(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleUpdateRefundStatus = async (id: string, status: 'PROCESSING' | 'COMPLETED' | 'FAILED') => {
    setActionLoading(`refund-${id}`);
    setMessage(null);
    try {
      await apiClient.patch(`/finance/refunds/${id}/status`, { status });
      setMessage({ type: 'success', text: `Refund #${id} transitioned to ${status}` });
      await Promise.all([fetchRefunds(), fetchOverview()]);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to update refund status',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRestaurantPayoutStatus = async (id: string, status: 'PAID' | 'FAILED') => {
    setActionLoading(`rest-${id}`);
    setMessage(null);
    try {
      await apiClient.patch(`/finance/payouts/restaurants/${id}/status`, { status });
      setMessage({ type: 'success', text: `Restaurant payout #${id} updated to ${status}` });
      await Promise.all([fetchRestaurantPayouts(), fetchOverview()]);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to update payout status',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcessWeeklyRestaurantPayouts = async () => {
    setActionLoading('process-rest');
    setMessage(null);
    try {
      const res = await apiClient.post<{ message: string }>('/finance/payouts/restaurants/process-weekly');
      setMessage({ type: 'success', text: res.data.message });
      await Promise.all([fetchRestaurantPayouts(), fetchOverview()]);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to process weekly restaurant payouts',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcessWeeklyPartnerPayouts = async () => {
    setActionLoading('process-partner');
    setMessage(null);
    try {
      const res = await apiClient.post<{ message: string }>('/finance/payouts/partners/process-weekly');
      setMessage({ type: 'success', text: res.data.message });
      await Promise.all([fetchPartnerPayouts(), fetchOverview()]);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to process weekly partner payouts',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'PAID':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {status}
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 text-blue-600 animate-spin" />
            {status}
          </span>
        );
      case 'INITIATED':
      case 'PENDING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 text-amber-600" />
            {status}
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3 text-rose-600" />
            {status}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  OFOS Treasury & Settlements
                </span>
                <span className="text-xs text-slate-400">Financial Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                Finance & Payouts Console
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Audit platform revenue, process restaurant commissions and bank transfers, disburse rider earnings, and approve customer refunds.
              </p>
            </div>
            <button
              onClick={loadAllData}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Captured Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">
                ₹{overview ? overview.totalRevenue.toLocaleString() : '0'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span>{overview?.totalOrders || 0} completed orders</span>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Refunds Disbursed</span>
                <Receipt className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-white">
                ₹{overview ? overview.totalRefunds.toLocaleString() : '0'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Completed cancellations
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Pending Rest. Payouts</span>
                <Building2 className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">
                ₹{overview ? overview.totalPendingRestaurantPayouts.toLocaleString() : '0'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Unsettled kitchen balances
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Pending Rider Payouts</span>
                <Banknote className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white">
                ₹{overview ? overview.totalPendingPartnerPayouts.toLocaleString() : '0'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Weekly fleet disbursements
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        {/* Toast Notification */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs font-medium border flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-700 font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1.5 flex gap-1 mb-6">
          <button
            onClick={() => setActiveTab('refunds')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'refunds'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Customer Refunds</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'refunds' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {refunds.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('restaurants')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'restaurants'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Restaurant Settlements</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'restaurants' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {restaurantPayouts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('partners')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'partners'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Rider Disbursements</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'partners' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {partnerPayouts.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Refunds */}
        {activeTab === 'refunds' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Customer Refund Ledger</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review cancellation refund eligibility and authorize gateway transfers.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">Loading refund ledger...</div>
            ) : refunds.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No customer refund records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Order / Reference</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {refunds.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-bold text-slate-900">#{r.orderNumber}</div>
                          <div className="text-[10px] text-slate-400">{r.refundReference}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{r.customerName}</div>
                          <div className="text-[10px] text-slate-400">{r.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                          {r.reason}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ₹{r.amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(r.status)}</td>
                        <td className="py-3.5 px-4 text-right">
                          {r.status === 'INITIATED' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateRefundStatus(r.id, 'COMPLETED')}
                                disabled={actionLoading === `refund-${r.id}`}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateRefundStatus(r.id, 'FAILED')}
                                disabled={actionLoading === `refund-${r.id}`}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold border border-rose-200 transition-all"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {r.status === 'PROCESSING' && (
                            <button
                              onClick={() => handleUpdateRefundStatus(r.id, 'COMPLETED')}
                              disabled={actionLoading === `refund-${r.id}`}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all"
                            >
                              Mark Completed
                            </button>
                          )}
                          {(r.status === 'COMPLETED' || r.status === 'FAILED') && (
                            <span className="text-[11px] text-slate-400 italic">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Restaurant Payouts */}
        {activeTab === 'restaurants' && (
          <div className="space-y-6">
            {/* Batch Action Banner */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-lg">Weekly Restaurant Settlement Engine</h4>
                <p className="text-xs text-orange-100 mt-1 max-w-xl">
                  Automatically tallies delivered order volume for Pizza Bella, Spice Symphony, and Burger Craft, deduces 10% platform commission, and credits net dues to verified bank accounts.
                </p>
              </div>
              <button
                onClick={handleProcessWeeklyRestaurantPayouts}
                disabled={actionLoading === 'process-rest'}
                className="px-6 py-3 bg-white text-orange-600 hover:bg-orange-50 rounded-2xl text-xs font-black shadow-lg hover:shadow-xl transition-all flex items-center gap-2 shrink-0 disabled:opacity-60"
              >
                <Banknote className="w-4 h-4 text-orange-500" />
                <span>
                  {actionLoading === 'process-rest' ? 'Processing...' : 'Run Weekly Restaurant Settlements'}
                </span>
              </button>
            </div>

            {/* Restaurant Payouts Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900">Restaurant Disbursement Records</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record of past and pending branch settlements.
                </p>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400 text-xs">Loading payouts...</div>
              ) : restaurantPayouts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No restaurant payout records found. Run the weekly settlement engine above to generate disbursements.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Restaurant</th>
                        <th className="py-3 px-4">Bank Details</th>
                        <th className="py-3 px-4">Gross Sales</th>
                        <th className="py-3 px-4">Commission (10%)</th>
                        <th className="py-3 px-4">Net Payout</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Disbursed Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {restaurantPayouts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{p.restaurantName}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal">
                              {p.payoutReference}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-slate-600">
                            <div>{p.bankAccountName || 'Verified Merchant Account'}</div>
                            <div className="text-slate-400 font-mono">
                              {p.bankAccountNumber ? `A/C: ${p.bankAccountNumber}` : 'Primary ACH'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            ₹{p.grossAmount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-rose-600 font-semibold">
                            -₹{p.commissionAmount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-600 text-sm">
                            ₹{p.netAmount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                          <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'Pending'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Partner Payouts */}
        {activeTab === 'partners' && (
          <div className="space-y-6">
            {/* Batch Action Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-lg">Delivery Partner Weekly Disbursement</h4>
                <p className="text-xs text-blue-100 mt-1 max-w-xl">
                  Consolidates pending delivery pay, distance bonuses, and tips for all fleet riders and dispatches batch payments to their bank accounts.
                </p>
              </div>
              <button
                onClick={handleProcessWeeklyPartnerPayouts}
                disabled={actionLoading === 'process-partner'}
                className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-2xl text-xs font-black shadow-lg hover:shadow-xl transition-all flex items-center gap-2 shrink-0 disabled:opacity-60"
              >
                <Users className="w-4 h-4 text-blue-500" />
                <span>
                  {actionLoading === 'process-partner' ? 'Processing...' : 'Run Weekly Rider Disbursements'}
                </span>
              </button>
            </div>

            {/* Rider Payouts Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900">Rider Disbursement Records</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record of rider earnings payouts and active disbursement transactions.
                </p>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400 text-xs">Loading payouts...</div>
              ) : partnerPayouts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No rider payout records found. Run the rider disbursement engine above to batch-process rider earnings.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Rider / Phone</th>
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4">Deliveries</th>
                        <th className="py-3 px-4">Gross Earnings</th>
                        <th className="py-3 px-4">Net Payout</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Disbursed Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {partnerPayouts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{p.partnerName}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal">
                              {p.partnerPhone}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                            {p.payoutReference}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {p.itemsCount} trips
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            ₹{p.grossAmount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-600 text-sm">
                            ₹{p.netAmount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                          <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'Pending'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

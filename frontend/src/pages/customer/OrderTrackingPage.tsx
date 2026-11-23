import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  CookingPot,
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
  RotateCcw,
  XCircle,
  Phone,
  KeyRound,
  MapPin,
  Star,
} from 'lucide-react';
import { ReviewOrderModal } from '../../components/reviews/ReviewOrderModal';

interface OrderTrackingData {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  subtotalAmount: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
  createdAt: string;
  otp?: string;
  restaurant?: {
    id: string;
    businessName: string;
    logoUrl?: string;
  };
  branch?: {
    id: string;
    branchName: string;
    addressLine1: string;
    city: string;
    phone?: string;
  };
  address?: {
    contactName: string;
    contactPhone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
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
  statusHistory: Array<{
    id: string;
    status: string;
    remarks?: string;
    createdAt: string;
  }>;
  driver?: {
    name: string;
    phone: string;
    vehicleType?: string;
  } | null;
  review?: {
    id: string;
    overallRating: number;
  } | null;
}

interface OrderTrackingPageProps {
  orderId: string;
  initialOtp?: string;
  onBack: () => void;
}

const STATUS_STEPS = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Sent to restaurant' },
  { key: 'ACCEPTED', label: 'Accepted', desc: 'Kitchen acknowledged' },
  { key: 'PREPARING', label: 'Cooking', desc: 'Preparing your dishes' },
  { key: 'READY_FOR_PICKUP', label: 'Ready', desc: 'Awaiting rider pickup' },
  { key: 'PICKED_UP', label: 'Picked Up', desc: 'Rider on the way' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Arriving at your location' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Order completed' },
];

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  orderId,
  initialOtp,
  onBack,
}) => {
  const [order, setOrder] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Changed my mind');
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [hasReviewed, setHasReviewed] = useState<boolean>(false);

  const fetchTracking = async () => {
    try {
      const res = await apiClient.get<OrderTrackingData>(`/orders/${orderId}/tracking`);
      setOrder(res.data);
      if (res.data?.review) {
        setHasReviewed(true);
      }
      setError(null);
    } catch (err: any) {
      // Fallback to order details if tracking endpoint format varies
      try {
        const detailsRes = await apiClient.get<OrderTrackingData>(`/orders/${orderId}`);
        setOrder(detailsRes.data);
        if (detailsRes.data?.review) {
          setHasReviewed(true);
        }
      } catch (detailsErr: any) {
        setError(err.response?.data?.message || 'Failed to load order tracking details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      await apiClient.patch(`/orders/${orderId}/cancel`, { reason: cancelReason });
      setShowCancelModal(false);
      await fetchTracking();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading live order status...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {error || 'Order not found'}
        </div>
        <button
          onClick={onBack}
          className="text-xs font-semibold text-orange-600 hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const currentStatus = order.orderStatus;
  const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'REJECTED';
  const isDelivered = currentStatus === 'DELIVERED';
  const isPlaced = currentStatus === 'PLACED';

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  const otpToDisplay = initialOtp || order.otp || '------';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="text-xs font-bold text-slate-600 hover:text-orange-600 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="text-center">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Order Tracking</h2>
          <p className="text-xs font-mono text-slate-500">#{order.orderNumber}</p>
        </div>
        <button
          onClick={() => fetchTracking()}
          title="Refresh status"
          className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Cancelled / Rejected Banner */}
      {isCancelled && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
          <XCircle className="w-6 h-6 flex-shrink-0 text-red-600" />
          <div>
            <h4 className="font-bold text-sm">Order {currentStatus.toLowerCase()}</h4>
            <p className="text-xs text-red-600 mt-0.5">
              {currentStatus === 'CANCELLED'
                ? 'This order was cancelled.'
                : 'The restaurant was unable to fulfill this order.'}
            </p>
          </div>
        </div>
      )}

      {/* Live Stepper (if not cancelled) */}
      {!isCancelled && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Current Status
              </span>
              <h3 className="text-lg font-black text-slate-900 capitalize">
                {currentStatus.replace(/_/g, ' ').toLowerCase()}
              </h3>
            </div>
            {order.estimatedDeliveryAt && !isDelivered && (
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Estimated Arrival
                </span>
                <div className="text-sm font-bold text-orange-600 flex items-center gap-1 justify-end">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {new Date(order.estimatedDeliveryAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Progress Bar */}
          <div className="relative">
            <div className="grid grid-cols-7 gap-1 relative z-10">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.key} className="text-center space-y-2">
                    <div
                      className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-all ${
                        isCurrent
                          ? 'bg-orange-600 text-white ring-4 ring-orange-100 shadow-md'
                          : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="hidden sm:block">
                      <div
                        className={`text-[11px] font-bold ${
                          isCurrent
                            ? 'text-orange-600'
                            : isPassed
                              ? 'text-slate-800'
                              : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="text-[9px] text-slate-400 leading-tight truncate">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Delivery OTP Card (Prominent Customer Display) */}
      {!isCancelled && !isDelivered && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs font-semibold text-orange-100 uppercase tracking-wider">
                Delivery Verification PIN
              </div>
              <p className="text-xs text-white/90">
                Share this secure 6-digit code with your driver upon arrival:
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl px-6 py-2.5 shadow-md">
            <div className="text-2xl font-black text-slate-900 tracking-widest font-mono">
              {otpToDisplay}
            </div>
          </div>
        </div>
      )}

      {/* Driver & Restaurant Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Restaurant Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-slate-900 truncate">
                {order.restaurant?.businessName || 'Restaurant'}
              </h4>
              <p className="text-xs text-slate-500 truncate">
                {order.branch?.branchName || 'Main Branch'}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-600 flex items-start gap-2 pt-2 border-t border-slate-100">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="truncate">
              {order.branch?.addressLine1}, {order.branch?.city}
            </span>
          </div>
        </div>

        {/* Assigned Driver Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Bike className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-slate-900">
                {order.driver ? order.driver.name : 'Assigning Delivery Rider...'}
              </h4>
              <p className="text-xs text-slate-500">
                {order.driver ? `${order.driver.vehicleType || 'Motorcycle'}` : 'Nearby drivers notified'}
              </p>
            </div>
          </div>
          {order.driver ? (
            <div className="text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {order.driver.phone}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic pt-2 border-t border-slate-100">
              Rider will be assigned once kitchen begins preparation.
            </div>
          )}
        </div>
      </div>

      {/* Order Summary & Bill */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h4 className="font-extrabold text-sm text-slate-900">Order Items</h4>
        <div className="divide-y divide-slate-100">
          {(order.items || []).map((item) => (
            <div key={item.id} className="py-2.5 flex items-start justify-between text-xs">
              <div>
                <div className="font-bold text-slate-800">
                  {item.quantity}x {item.itemName}
                </div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {item.modifiers.map((m) => m.optionName).join(', ')}
                  </div>
                )}
                {item.specialInstructions && (
                  <div className="text-[10px] text-slate-400 italic">
                    &quot;{item.specialInstructions}&quot;
                  </div>
                )}
              </div>
              <div className="font-bold text-slate-900">₹{Number(item.lineTotal).toFixed(0)}</div>
            </div>
          ))}
        </div>

        {/* Bill Breakdown */}
        <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Item Subtotal</span>
            <span>₹{Number(order.subtotalAmount).toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>{Number(order.deliveryFee) === 0 ? 'FREE' : `₹${Number(order.deliveryFee).toFixed(0)}`}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxes (5% GST)</span>
            <span>₹{Number(order.taxAmount).toFixed(0)}</span>
          </div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Discount</span>
              <span>-₹{Number(order.discountAmount).toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
            <span>Total Paid</span>
            <span>₹{Number(order.totalAmount).toFixed(0)}</span>
          </div>
        </div>

        {/* Action Controls: Cancel Order */}
        {isPlaced && (
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors"
            >
              Cancel Order
            </button>
          </div>
        )}

        {/* Action Controls: Rate & Review Order */}
        {isDelivered && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                {hasReviewed
                  ? 'Thank you! Your feedback has been recorded.'
                  : 'Order delivered. How was your experience with the food and delivery?'}
              </span>
            </div>
            {!hasReviewed ? (
              <button
                onClick={() => setShowReviewModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <Star className="w-4 h-4 fill-white" />
                <span>Rate & Review</span>
              </button>
            ) : (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                Reviewed ★
              </span>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewOrderModal
        isOpen={showReviewModal}
        orderId={order.id}
        orderNumber={order.orderNumber}
        restaurantName={order.restaurant?.businessName}
        onClose={() => setShowReviewModal(false)}
        onSuccess={() => {
          setHasReviewed(true);
          fetchTracking();
        }}
      />

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h4 className="font-black text-slate-900 text-base">Cancel Order?</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to cancel this order? The restaurant has not started preparing yet.
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Reason for cancellation:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Changed my mind">Changed my mind</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Delivery time too long">Delivery time too long</option>
                <option value="Incorrect address selected">Incorrect address selected</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Keep Order
              </button>
              <button
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

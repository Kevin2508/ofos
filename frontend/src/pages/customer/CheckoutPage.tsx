import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useCart } from '../../context/CartContext';
import {
  MapPin,
  Clock,
  CheckCircle,
  Plus,
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  AlertCircle,
  Truck,
  Package,
} from 'lucide-react';

interface CustomerAddress {
  id: string;
  label: 'HOME' | 'WORK' | 'OTHER';
  contactName: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault: boolean;
}

interface CheckoutSessionResult {
  id: string;
  cartId: string;
  customerUserId: string;
  addressId: string;
  deliveryType: 'DELIVERY' | 'TAKEAWAY';
  estimatedDeliveryMinutes?: number;
  expiresAt: string;
}

interface CheckoutPageProps {
  onBack: () => void;
  onOrderSuccess: (orderId: string, orderNumber?: string, otp?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBack, onOrderSuccess }) => {
  const { cart, refreshCart } = useCart();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'TAKEAWAY'>('DELIVERY');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address creation form state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'HOME' as 'HOME' | 'WORK' | 'OTHER',
    contactName: '',
    contactPhone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
    latitude: 12.9716,
    longitude: 77.5946,
    isDefault: true,
  });

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/customer/addresses');
      const list: CustomerAddress[] = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      setAddresses(list);

      // Select default or first address
      if (list.length > 0) {
        const defaultAddr = list.find((a) => a.isDefault) || list[0];
        setSelectedAddressId(defaultAddr.id);
      } else {
        setShowAddAddress(true);
      }
    } catch (err: any) {
      console.warn('Could not fetch addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    refreshCart();
  }, []);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const payload = {
        ...newAddress,
        country: newAddress.country?.trim() || 'India',
      };
      const res = await apiClient.post<any>('/customer/addresses', payload);
      const created = res.data?.data || res.data;
      await fetchAddresses();
      if (created?.id) {
        setSelectedAddressId(created.id);
      }
      setShowAddAddress(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    const targetAddressId = selectedAddressId || (addresses.length > 0 ? addresses[0].id : null);
    if (!targetAddressId) {
      setError('Please add a contact or delivery address before proceeding to checkout.');
      setShowAddAddress(true);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: any = {
        addressId: String(targetAddressId),
        deliveryType,
      };
      if (cart.appliedCoupon?.couponId) {
        payload.couponId = cart.appliedCoupon.couponId;
      }

      const res = await apiClient.post<CheckoutSessionResult>('/checkout/initiate', payload);
      const session = res.data;

      // Place the order directly using Cash on Delivery (COD)
      const placeRes = await apiClient.post<{
        orderId: string;
        orderNumber: string;
        otp?: string;
        message: string;
      }>(`/checkout/${session.id}/place-order`, {
        paymentProvider: 'COD',
      });

      await refreshCart();
      onOrderSuccess(placeRes.data.orderId, placeRes.data.orderNumber, placeRes.data.otp);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
        <p className="text-sm text-slate-500">Add dishes to your cart before proceeding to checkout.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-orange-600 text-white font-bold text-xs rounded-xl hover:bg-orange-700 transition-colors inline-flex items-center gap-1.5 shadow-md shadow-orange-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore Restaurants</span>
        </button>
      </div>
    );
  }

  const subtotal = Number(cart.priceBreakdown?.subtotal || 0);
  const deliveryFee = deliveryType === 'TAKEAWAY' ? 0 : Number(cart.priceBreakdown?.deliveryFee || 0);
  const taxAmount = Number(cart.priceBreakdown?.taxAmount || 0);
  const rawDiscount = Number(cart.priceBreakdown?.discountAmount || 0);
  const discountAmount = deliveryType === 'TAKEAWAY' ? Math.min(rawDiscount, subtotal) : rawDiscount;
  const finalTotal = Math.max(0, subtotal + deliveryFee + taxAmount - discountAmount);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-orange-600 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Restaurant</span>
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Checkout</h1>
        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure Checkout</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Delivery Options & Addresses */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Fulfillment Type */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-black">
                1
              </span>
              <span>Delivery Preference</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType('DELIVERY')}
                className={`p-4 rounded-xl border flex items-center gap-3 text-left transition-all ${
                  deliveryType === 'DELIVERY'
                    ? 'border-orange-500 bg-orange-50/50 text-orange-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    deliveryType === 'DELIVERY' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs">Doorstep Delivery</div>
                  <div className="text-[11px] text-slate-500">Delivered right to your door</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('TAKEAWAY')}
                className={`p-4 rounded-xl border flex items-center gap-3 text-left transition-all ${
                  deliveryType === 'TAKEAWAY'
                    ? 'border-orange-500 bg-orange-50/50 text-orange-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    deliveryType === 'TAKEAWAY' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs">Takeaway / Pickup</div>
                  <div className="text-[11px] text-slate-500">Self-pickup (No delivery fee)</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Delivery Address (Visible for DELIVERY) */}
          {deliveryType === 'DELIVERY' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-black">
                    2
                  </span>
                  <span>Delivery Address</span>
                </h3>
                {!showAddAddress && (
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(true)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New</span>
                  </button>
                )}
              </div>

              {/* Saved Address Cards */}
              {!showAddAddress ? (
                addresses.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    No delivery addresses found. Please add an address below.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-xs text-slate-900">{addr.contactName}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{addr.contactPhone}</div>
                          <p className="text-xs text-slate-600 mt-2 leading-snug line-clamp-2">
                            {addr.addressLine1}, {addr.city} {addr.postalCode}
                          </p>

                          {isSelected && (
                            <div className="absolute top-3 right-3 text-orange-600">
                              <CheckCircle className="w-4 h-4 fill-orange-600 text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Add Address Inline Form */
                <form onSubmit={handleCreateAddress} className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.contactName}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, contactName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newAddress.contactPhone}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, contactPhone: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.addressLine1}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, addressLine1: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      placeholder="Flat 402, Sunshine Heights, 12th Main"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.postalCode}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, postalCode: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Country *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.country}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, country: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg transition-colors"
                    >
                      Save & Use Address
                    </button>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 3. Payment Method */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-black">
                {deliveryType === 'DELIVERY' ? 3 : 2}
              </span>
              <span>Payment Option</span>
            </h3>

            <div className="p-4 rounded-xl border border-orange-500 bg-orange-50/40 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-900">Pay on Delivery / COD</div>
                <div className="text-[11px] text-slate-500">
                  Pay via Cash, UPI or Card when your order arrives.
                </div>
              </div>
              <CheckCircle className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Action */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Order Summary</h3>
                <p className="text-[11px] text-slate-500">
                  {cart.restaurantBranch?.restaurant?.businessName || 'Restaurant'}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                <span>30-40 min</span>
              </div>
            </div>

            {/* Item list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.id} className="text-xs flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">
                      {item.quantity}x {item.menuItem?.name || 'Dish'}
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-[10px] text-slate-400 truncate">
                        {item.modifiers.map((m) => m.optionName).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-slate-900">
                    ₹{Number(item.lineTotal).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">₹{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-semibold text-slate-800">
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(0)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Charges (5% GST)</span>
                <span className="font-semibold text-slate-800">₹{taxAmount.toFixed(0)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{discountAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-black text-slate-900">
                <span>Total Amount</span>
                <span>₹{finalTotal.toFixed(0)}</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              disabled={submitting || (deliveryType === 'DELIVERY' && !selectedAddressId)}
              onClick={handleInitiateCheckout}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Place Order & Checkout</span>
                  <ShoppingBag className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

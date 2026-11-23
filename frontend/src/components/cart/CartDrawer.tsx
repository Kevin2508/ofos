import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Tag,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CartDrawerProps {
  onNavigateToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigateToCheckout }) => {
  const {
    cart,
    loading,
    isDrawerOpen,
    setIsDrawerOpen,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  if (!isDrawerOpen) return null;

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) return;

    setCouponError(null);
    setCouponSuccess(null);

    const result = await applyCoupon(code);
    if (result.success) {
      setCouponSuccess(result.message || 'Coupon applied successfully!');
      setCouponInput('');
    } else {
      setCouponError(result.message || 'Invalid coupon code');
    }
  };

  const restaurantName =
    cart?.restaurantBranch?.restaurant?.businessName ||
    cart?.restaurantBranch?.branchName ||
    'Selected Restaurant';

  const subtotal = Number(cart?.priceBreakdown?.subtotal || 0);
  const deliveryFee = Number(cart?.priceBreakdown?.deliveryFee || 0);
  const taxAmount = Number(cart?.priceBreakdown?.taxAmount || 0);
  const discountAmount = Number(cart?.priceBreakdown?.discountAmount || 0);
  const totalAmount = Number(cart?.priceBreakdown?.totalAmount || 0);
  const minOrderValue = Number(cart?.minimumOrderValue || 0);
  const isMinOrderMet = subtotal >= minOrderValue;
  const distanceToMin = Math.max(0, minOrderValue - subtotal);
  const progressPercent = minOrderValue > 0 ? Math.min(100, (subtotal / minOrderValue) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base leading-tight">Your Cart</h3>
                <p className="text-xs text-slate-500 font-medium truncate max-w-[220px]">
                  {restaurantName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart && cart.items.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearCart()}
                  title="Clear entire cart"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {!cart || cart.items.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Your cart is empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Explore menus and add your favorite dishes to start a fresh order!
                </p>
              </div>
            ) : (
              <>
                {/* Minimum Order Value Alert */}
                {minOrderValue > 0 && (
                  <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        {isMinOrderMet ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Minimum order requirement met</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span>Add ₹{distanceToMin.toFixed(0)} more to meet min order</span>
                          </>
                        )}
                      </span>
                      <span className="text-slate-500">₹{minOrderValue} min</span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isMinOrderMet ? 'bg-emerald-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="divide-y divide-slate-100">
                  {cart.items.map((item) => (
                    <div key={item.id} className="py-3.5 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              item.menuItem?.foodType === 'NON_VEG' ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                          />
                          <h4 className="font-bold text-sm text-slate-900 truncate">
                            {item.menuItem?.name || 'Dish'}
                          </h4>
                        </div>

                        {/* Modifiers */}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.modifiers.map((mod) => (
                              <span
                                key={mod.id}
                                className="inline-flex items-center text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                              >
                                {mod.optionName || 'Option'}
                                {Number(mod.additionalPrice) > 0 && ` (+₹${mod.additionalPrice})`}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.specialInstructions && (
                          <p className="text-[11px] text-slate-400 italic mt-0.5 truncate">
                            &quot;{item.specialInstructions}&quot;
                          </p>
                        )}

                        <div className="mt-1.5 text-xs font-bold text-slate-800">
                          ₹{Number(item.lineTotal).toFixed(0)}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={loading}
                          className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={loading}
                          className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Section */}
                <div className="pt-2">
                  <div className="border border-dashed border-slate-200 rounded-xl p-3.5 space-y-3 bg-slate-50/40">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Tag className="w-4 h-4 text-orange-600" />
                      <span>Promotions & Coupons</span>
                    </div>

                    {discountAmount > 0 ? (
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <div>
                            <span className="font-bold text-emerald-800">
                              Coupon Applied
                            </span>
                            <span className="text-emerald-700 ml-1.5 font-medium">
                              (Saved ₹{discountAmount.toFixed(0)})
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCoupon()}
                          className="text-emerald-800 font-bold hover:underline text-[11px]"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="ENTER COUPON CODE"
                          className="flex-1 px-3 py-1.5 text-xs uppercase font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          disabled={loading || !couponInput.trim()}
                          className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    {couponError && (
                      <p className="text-[11px] text-red-600 font-medium">{couponError}</p>
                    )}
                    {couponSuccess && (
                      <p className="text-[11px] text-emerald-600 font-medium">{couponSuccess}</p>
                    )}

                    {/* Applicable Coupon Suggestions */}
                    {cart.applicableCoupons && cart.applicableCoupons.length > 0 && discountAmount === 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {cart.applicableCoupons.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleApplyCoupon(c.code)}
                            className="text-[10px] font-bold px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-md hover:bg-orange-100 transition-colors flex items-center gap-1"
                          >
                            <span>{c.code}</span>
                            <span className="text-[9px] text-orange-500">({c.description})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Item Subtotal</span>
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
                      <span>Discount</span>
                      <span>-₹{discountAmount.toFixed(0)}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                    <span>To Pay</span>
                    <span>₹{totalAmount.toFixed(0)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Checkout Action */}
          {cart && cart.items.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
              <button
                type="button"
                disabled={!isMinOrderMet || loading}
                onClick={() => {
                  setIsDrawerOpen(false);
                  onNavigateToCheckout();
                }}
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  isMinOrderMet
                    ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {!isMinOrderMet && (
                <p className="text-[11px] text-center text-amber-600 font-medium">
                  Add items worth ₹{distanceToMin.toFixed(0)} more to proceed.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

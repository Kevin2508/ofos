import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

export interface CartModifier {
  id: string;
  modifierOptionId: string;
  modifierName?: string;
  optionName?: string;
  additionalPrice: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  specialInstructions?: string;
  menuItem?: {
    id: string;
    name: string;
    imageUrl?: string;
    foodType?: string;
  };
  modifiers: CartModifier[];
}

export interface CartPriceBreakdown {
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  calculatedAt?: string;
}

export interface ApplicableCoupon {
  code: string;
  couponType: string;
  value: number;
  description: string;
}

export interface CartData {
  id: string;
  customerUserId: string;
  restaurantBranchId: string;
  status: string;
  restaurantBranch?: {
    id: string;
    branchName?: string;
    deliveryFee?: number;
    minimumOrderValue?: number;
    restaurant?: {
      id?: string;
      businessName?: string;
    };
  } | null;
  items: CartItem[];
  priceBreakdown: CartPriceBreakdown;
  minimumOrderValue: number;
  distanceToMinimum: number;
  progressPercentage: number;
  applicableCoupons: ApplicableCoupon[];
  appliedCoupon?: {
    code: string;
    couponId?: string;
    discountAmount: number;
  } | null;
}

export interface AddToCartPayload {
  menuItemId: string;
  restaurantBranchId: string;
  quantity: number;
  specialInstructions?: string;
  modifiers?: Array<{ modifierOptionId: string; additionalPrice?: number }>;
}

interface CartConflict {
  isOpen: boolean;
  existingBranchName?: string;
  pendingPayload?: AddToCartPayload;
}

interface CartContextType {
  cart: CartData | null;
  loading: boolean;
  itemCount: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  conflictState: CartConflict;
  refreshCart: () => Promise<void>;
  addToCart: (payload: AddToCartPayload) => Promise<{ success: boolean; conflict?: boolean }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => Promise<void>;
  resolveConflict: (replace: boolean) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, activeRole } = useAuth();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [conflictState, setConflictState] = useState<CartConflict>({ isOpen: false });

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || (activeRole && activeRole !== 'Customer' && activeRole !== 'Admin')) {
      setCart(null);
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.get<CartData>('/cart');
      if (res.data && res.data.id && res.data.items && res.data.items.length > 0) {
        setCart(res.data);
      } else {
        setCart(null);
      }
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.data?.message?.includes('No active cart')) {
        setCart(null);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeRole]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (payload: AddToCartPayload): Promise<{ success: boolean; conflict?: boolean }> => {
    try {
      setLoading(true);
      const res = await apiClient.post<CartData>('/cart/items', payload);
      setCart(res.data);
      setIsDrawerOpen(true);
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      if (
        errorMsg === 'DIFFERENT_RESTAURANT_CART_EXISTS' ||
        err.response?.data?.error === 'DIFFERENT_RESTAURANT_CART_EXISTS'
      ) {
        const branchName =
          cart?.restaurantBranch?.restaurant?.businessName ||
          cart?.restaurantBranch?.branchName ||
          'another restaurant';
        setConflictState({
          isOpen: true,
          existingBranchName: branchName,
          pendingPayload: payload,
        });
        return { success: false, conflict: true };
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setLoading(true);
      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }
      const res = await apiClient.patch<CartData>(`/cart/items/${itemId}`, { quantity });
      setCart(res.data);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setLoading(true);
      const res = await apiClient.delete<CartData | null>(`/cart/items/${itemId}`);
      if (res.data && res.data.items && res.data.items.length > 0) {
        setCart(res.data);
      } else {
        setCart(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await apiClient.delete('/cart');
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setLoading(true);
      const res = await apiClient.post('/cart/apply-coupon', { code });
      await refreshCart();
      return { success: true, message: 'Coupon applied successfully!' };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid coupon code';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = async () => {
    try {
      setLoading(true);
      await apiClient.delete('/cart/coupon');
      await refreshCart();
    } finally {
      setLoading(false);
    }
  };

  const resolveConflict = async (replace: boolean) => {
    if (!replace || !conflictState.pendingPayload) {
      setConflictState({ isOpen: false });
      return;
    }

    const payload = conflictState.pendingPayload;
    setConflictState({ isOpen: false });

    try {
      setLoading(true);
      await apiClient.delete('/cart');
      setCart(null);
      const res = await apiClient.post<CartData>('/cart/items', payload);
      setCart(res.data);
      setIsDrawerOpen(true);
    } catch (err) {
      console.error('Failed to replace cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        isDrawerOpen,
        setIsDrawerOpen,
        conflictState,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        resolveConflict,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

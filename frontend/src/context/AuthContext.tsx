import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string;
  profileImageUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: string[];
  activeRole: string;
  customerProfile?: {
    referralCode: string;
    loyaltyPointsBalance: number;
  } | null;
  restaurants?: Array<{
    id: string;
    businessName: string;
    status: string;
  }>;
  deliveryPartner?: {
    userId: string;
    isOnline: boolean;
    status: string;
    vehicleType: string;
  } | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  activeRole: string | null;
  login: (credentials: { userIdentifier: string; password: string; rememberMe?: boolean }) => Promise<void>;
  registerCustomer: (data: any) => Promise<void>;
  registerRestaurantOwner: (data: any) => Promise<void>;
  registerDeliveryPartner: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  selectRole: (role: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await apiClient.get<UserProfile>('/auth/me');
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { userIdentifier: string; password: string; rememberMe?: boolean }) => {
    const res = await apiClient.post<any>('/auth/login', credentials);
    const token = res.data?.tokens?.accessToken || res.data?.accessToken;
    if (token) {
      localStorage.setItem('ofos_access_token', token);
    }
    await refreshUser();
  };

  const registerCustomer = async (data: any) => {
    const res = await apiClient.post<any>('/auth/register', data);
    const token = res.data?.tokens?.accessToken || res.data?.accessToken;
    if (token) {
      localStorage.setItem('ofos_access_token', token);
    }
    await refreshUser();
  };

  const registerRestaurantOwner = async (data: any) => {
    const res = await apiClient.post<any>('/auth/register/restaurant-owner', data);
    const token = res.data?.tokens?.accessToken || res.data?.accessToken;
    if (token) {
      localStorage.setItem('ofos_access_token', token);
    }
    await refreshUser();
  };

  const registerDeliveryPartner = async (data: any) => {
    const res = await apiClient.post<any>('/auth/register/delivery-partner', data);
    const token = res.data?.tokens?.accessToken || res.data?.accessToken;
    if (token) {
      localStorage.setItem('ofos_access_token', token);
    }
    await refreshUser();
  };

  const logout = async () => {
    try {
      await apiClient.get('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('ofos_access_token');
      setUser(null);
    }
  };

  const selectRole = async (role: string) => {
    await apiClient.post('/auth/select-role', { role });
    if (user) {
      setUser({ ...user, activeRole: role });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        activeRole: user?.activeRole || null,
        login,
        registerCustomer,
        registerRestaurantOwner,
        registerDeliveryPartner,
        logout,
        selectRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

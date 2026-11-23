import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { User, LogOut, ChevronDown, Shield, ShoppingBag } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { user, isAuthenticated, logout, selectRole, activeRole } = useAuth();
  const { itemCount, setIsDrawerOpen } = useCart();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => onNavigate('home')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md">
            O
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-slate-900 tracking-tight leading-none">OFOS</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">
              Online Food Ordering
            </p>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors ${
              currentPage === 'home' ? 'text-orange-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('restaurants')}
            className={`transition-colors ${
              currentPage === 'restaurants' || currentPage === 'restaurant-detail'
                ? 'text-orange-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Explore Menus
          </button>
          {isAuthenticated && (
            <button
              onClick={() => onNavigate('orders')}
              className={`transition-colors ${
                currentPage === 'orders' || currentPage === 'order-tracking'
                  ? 'text-orange-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Orders
            </button>
          )}
          {isAuthenticated && (activeRole === 'Restaurant_owner' || activeRole === 'Admin' || user?.roles.includes('Restaurant_owner')) && (
            <button
              onClick={() => onNavigate('owner-dashboard')}
              className={`transition-colors ${
                currentPage === 'owner-dashboard'
                  ? 'text-orange-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Restaurant Portal
            </button>
          )}
          {isAuthenticated && (activeRole === 'Delivery_partner' || activeRole === 'Admin' || user?.roles.includes('Delivery_partner')) && (
            <button
              onClick={() => onNavigate('driver-dashboard')}
              className={`transition-colors ${
                currentPage === 'driver-dashboard'
                  ? 'text-orange-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rider Portal
            </button>
          )}
          {isAuthenticated && (activeRole === 'Fleet_manager' || activeRole === 'Admin' || user?.roles.includes('Fleet_manager')) && (
            <button
              onClick={() => onNavigate('fleet-dashboard')}
              className={`transition-colors ${
                currentPage === 'fleet-dashboard'
                  ? 'text-orange-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fleet Command
            </button>
          )}
          {isAuthenticated && (activeRole === 'Finance_manager' || activeRole === 'Admin' || user?.roles.includes('Finance_manager')) && (
            <button
              onClick={() => onNavigate('finance-dashboard')}
              className={`transition-colors ${
                currentPage === 'finance-dashboard'
                  ? 'text-orange-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Finance Hub
            </button>
          )}
          {isAuthenticated && (activeRole === 'Admin' || user?.roles.includes('Admin')) && (
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className={`transition-colors ${
                currentPage === 'admin-dashboard'
                  ? 'text-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🛡️ Admin
            </button>
          )}
        </nav>

        {/* Right Auth Controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Role Badge / Switcher */}
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-800 hover:bg-orange-100 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-orange-600" />
                  <span>{activeRole || 'Customer'}</span>
                  {user.roles.length > 1 && <ChevronDown className="w-3.5 h-3.5 text-orange-500" />}
                </button>

                {roleDropdownOpen && user.roles.length > 1 && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
                    <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Active Role
                    </div>
                    {user.roles.map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          selectRole(role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-between ${
                          role === activeRole ? 'text-orange-600 font-bold bg-orange-50/50' : 'text-slate-700'
                        }`}
                      >
                        {role}
                        {role === activeRole && <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Drawer Trigger */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="relative p-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors flex items-center justify-center"
                title="View Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-sm">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* User Identity Pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold">
                  {user.firstName[0]}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {user.firstName} {user.lastName || ''}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    {user.email || user.phone}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => logout()}
                title="Log out"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="px-4 py-1.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

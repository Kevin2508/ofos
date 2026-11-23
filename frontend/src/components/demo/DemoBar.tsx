import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Store,
  Bike,
  ShieldAlert,
  Wallet,
  Compass,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface DemoRole {
  role: string;
  name: string;
  email: string;
  badge: string;
  icon: React.ReactNode;
  targetPage: string;
  description: string;
  color: string;
}

const PLATFORM_ROLES: DemoRole[] = [
  {
    role: 'CUSTOMER',
    name: 'Customer Experience',
    email: 'customer@ofos.com',
    badge: 'Foodie View',
    icon: <User className="w-4 h-4" />,
    targetPage: 'orders',
    description: 'Explore menus, customize dishes, and track deliveries in real time.',
    color: 'from-orange-500 to-amber-500',
  },
  {
    role: 'RESTAURANT_OWNER',
    name: 'Restaurant Partner',
    email: 'owner@ofos.com',
    badge: 'Kitchen Flow',
    icon: <Store className="w-4 h-4" />,
    targetPage: 'owner-dashboard',
    description: 'Live kitchen Kanban board, menu editor, and inventory controls.',
    color: 'from-amber-600 to-orange-600',
  },
  {
    role: 'DELIVERY_PARTNER',
    name: 'Delivery Rider',
    email: 'driver_phase7@ofos.com',
    badge: 'Rider App',
    icon: <Bike className="w-4 h-4" />,
    targetPage: 'driver-dashboard',
    description: 'Duty status, nearby order offers, and secure customer OTP handover.',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    role: 'FLEET_MANAGER',
    name: 'Fleet Dispatcher',
    email: 'fleet@ofos.com',
    badge: 'Dispatch Radar',
    icon: <Compass className="w-4 h-4" />,
    targetPage: 'fleet-dashboard',
    description: 'City-wide fleet tracking, driver heatmap, and order reassignments.',
    color: 'from-blue-600 to-cyan-700',
  },
  {
    role: 'FINANCE_MANAGER',
    name: 'Finance & Ledger',
    email: 'finance@ofos.com',
    badge: 'Settlements',
    icon: <Wallet className="w-4 h-4" />,
    targetPage: 'finance-dashboard',
    description: 'Platform revenue, merchant commissions, and weekly payout runs.',
    color: 'from-violet-600 to-purple-700',
  },
  {
    role: 'ADMIN',
    name: 'Platform Operations',
    email: 'admin@ofos.com',
    badge: 'Governance',
    icon: <ShieldAlert className="w-4 h-4" />,
    targetPage: 'admin-dashboard',
    description: 'Partner verification, dispute desk, and compliance audit trail.',
    color: 'from-rose-600 to-pink-700',
  },
];

interface DemoBarProps {
  onNavigate: (page: string) => void;
}

export const DemoBar: React.FC<DemoBarProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, activeRole, login, selectRole } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (isDismissed) return null;

  const handleRoleQuickSwitch = async (demo: DemoRole) => {
    try {
      setSwitchingRole(demo.role);
      setFeedbackMsg(`Switching to ${demo.name}...`);

      if (isAuthenticated && user?.email === demo.email) {
        if (activeRole !== demo.role) {
          await selectRole(demo.role);
        }
      } else {
        await login({
          userIdentifier: demo.email,
          password: 'Password@123',
          rememberMe: true,
        });
      }

      setFeedbackMsg(`Viewing as ${demo.name}`);
      setTimeout(() => {
        setFeedbackMsg(null);
        setIsOpen(false);
      }, 1500);
      onNavigate(demo.targetPage);
    } catch (err: any) {
      console.error('Role switch error:', err);
      setFeedbackMsg(`Failed to switch: ${err.response?.data?.message || err.message}`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } finally {
      setSwitchingRole(null);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Floating Pill when Collapsed */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 hover:border-orange-500 backdrop-blur-md transition-all group hover:scale-105"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200 group-hover:text-white">Explore Roles & Portals</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
        </button>
      ) : (
        /* Expanded Role Switcher Modal / Popover */
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-80 sm:w-96 text-slate-800 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Platform Experience</h4>
                <p className="text-[11px] text-slate-500">Preview any role in 1 click</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                title="Minimize"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {feedbackMsg && (
            <div className="py-1.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {PLATFORM_ROLES.map((demo) => {
              const isCurrent = isAuthenticated && activeRole === demo.role;
              const isLoading = switchingRole === demo.role;

              return (
                <button
                  key={demo.role}
                  onClick={() => handleRoleQuickSwitch(demo)}
                  disabled={isLoading}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-start gap-3 group ${
                    isCurrent
                      ? 'bg-orange-50/70 border-orange-300 ring-1 ring-orange-400/30'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg text-white bg-gradient-to-br ${demo.color} shadow-xs flex-shrink-0 mt-0.5`}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : demo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition truncate">
                        {demo.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{demo.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Enterprise Multi-Tenant System</span>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-slate-500 hover:text-slate-700 hover:underline"
            >
              Don't show again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

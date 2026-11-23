import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { CartDrawer } from './components/cart/CartDrawer';
import { ConflictModal } from './components/cart/ConflictModal';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { RestaurantListingPage } from './pages/customer/RestaurantListingPage';
import { RestaurantDetailPage } from './pages/customer/RestaurantDetailPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderTrackingPage } from './pages/customer/OrderTrackingPage';
import { OrderHistoryPage } from './pages/customer/OrderHistoryPage';
import { RestaurantOwnerDashboard } from './pages/owner/RestaurantOwnerDashboard';
import { DeliveryPartnerDashboard } from './pages/driver/DeliveryPartnerDashboard';
import { FleetManagerDashboard } from './pages/fleet/FleetManagerDashboard';
import { FinanceManagerDashboard } from './pages/finance/FinanceManagerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AIChatDrawer } from './components/ai/AIChatDrawer';
import { DemoBar } from './components/demo/DemoBar';
import {
  Sparkles,
  Store,
  Bike,
  Clock,
  ShieldCheck,
  Search,
  ArrowRight,
  Star,
  Award,
  Flame,
  ChefHat,
  ShoppingBag,
  Bot,
} from 'lucide-react';

const POPULAR_CUISINES = [
  { name: 'Pizza', emoji: '🍕', desc: 'Wood-fired & artisanal crusts' },
  { name: 'Burgers', emoji: '🍔', desc: 'Juicy smashed patties' },
  { name: 'Biryani', emoji: '🍛', desc: 'Aromatic slow-cooked rice' },
  { name: 'Asian & Noodles', emoji: '🍜', desc: 'Authentic wok & dim sum' },
  { name: 'Healthy Bowls', emoji: '🥗', desc: 'Organic greens & superfoods' },
  { name: 'Desserts', emoji: '🍰', desc: 'Artisan cakes & milkshakes' },
];

function MainDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, isAuthenticated, activeRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('restaurants');
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 rounded-3xl p-8 sm:p-14 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-20 top-10 w-48 h-48 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-orange-50 border border-white/20 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
            <span>Superfast Delivery &bull; Live GPS Tracking</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Crave it? Get it delivered fresh to your doorstep.
          </h2>

          <p className="text-orange-50 text-sm sm:text-lg leading-relaxed max-w-2xl">
            Order from the city's finest restaurants, authentic kitchens, and gourmet pizzerias with real-time order tracking and secure handover.
          </p>

          {/* Quick Search Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2 flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search for restaurants, burgers, pizza..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white text-slate-800 rounded-2xl shadow-md placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>Find Food</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Popular Search Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-orange-100">
            <span className="font-semibold text-white">Popular:</span>
            {['Classic Burgers', 'Woodfired Pizza', 'Hyderabadi Biryani', 'Pasta'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onNavigate('restaurants')}
                className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 transition text-xs backdrop-blur-xs"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* User Welcome Banner (when authenticated) */}
      {isAuthenticated && user && (
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              {user.firstName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Welcome back, {user.firstName}!
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                  {activeRole}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ready to order your next meal? Check out your past orders or explore today's specials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.customerProfile && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Points: <strong className="font-bold">{user.customerProfile.loyaltyPointsBalance}</strong></span>
              </div>
            )}
            <button
              onClick={() => onNavigate('orders')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              My Orders &rarr;
            </button>
          </div>
        </section>
      )}

      {/* Popular Food Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Explore by Cuisine</h3>
            <p className="text-xs text-slate-500">Handpicked selections from authentic local kitchens</p>
          </div>
          <button
            onClick={() => onNavigate('restaurants')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
          >
            <span>View All Restaurants</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {POPULAR_CUISINES.map((item) => (
            <button
              key={item.name}
              onClick={() => onNavigate('restaurants')}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all text-left group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{item.emoji}</div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition">
                {item.name}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Experience Highlights / Guarantees */}
      <section className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">The OFOS Guarantee</span>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
            Engineered for Flawless Food Delivery
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm">
            From the minute your order is confirmed to contactless OTP handover, experience speed, hygiene, and transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Live GPS Radar</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time driver location updates on interactive maps so you always know when your dinner arrives.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Encrypted OTP Handover</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Orders are protected with a unique 4-digit verification code to guarantee contactless and verified deliveries.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Artisanal Customization</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tailor every meal with required or optional modifier options, extra toppings, and chef preparation instructions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">AI Food Concierge</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Can't decide what to eat? Tap the floating assistant to get dish recommendations tailored to your cravings.
            </p>
          </div>
        </div>
      </section>

      {/* Partner With Us Banners */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 rounded-3xl p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900">Partner with OFOS as a Restaurant</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Reach thousands of hungry customers, manage live orders on your digital Kitchen Kanban board, and grow your revenue with automated payouts.
            </p>
          </div>
          <button
            onClick={() => onNavigate('register')}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Register Your Restaurant &rarr;
          </button>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900">Deliver with OFOS as a Rider</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Enjoy flexible working hours, transparent earnings per delivery, smart route dispatching, and weekly direct bank disbursements.
            </p>
          </div>
          <button
            onClick={() => onNavigate('register')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Join as a Delivery Partner &rarr;
          </button>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="pt-8 border-t border-slate-200 text-xs text-slate-500 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-xs">
              O
            </div>
            <span className="font-bold text-slate-800">OFOS</span>
            <span>&bull; Online Food Ordering & Delivery Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('restaurants')} className="hover:text-slate-800 transition">
              Explore Menus
            </button>
            <button onClick={() => onNavigate('orders')} className="hover:text-slate-800 transition">
              Track Orders
            </button>
            <button onClick={() => onNavigate('register')} className="hover:text-slate-800 transition">
              Restaurant Portal
            </button>
            <button onClick={() => onNavigate('register')} className="hover:text-slate-800 transition">
              Rider Portal
            </button>
          </div>
        </div>
        <p className="text-center sm:text-left text-[11px] text-slate-400">
          &copy; {new Date().getFullYear()} OFOS Platform. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

export function App() {
  const [currentPage, setCurrentPage] = useState<
    | 'home'
    | 'login'
    | 'register'
    | 'forgot-password'
    | 'restaurants'
    | 'restaurant-detail'
    | 'owner-dashboard'
    | 'driver-dashboard'
    | 'fleet-dashboard'
    | 'finance-dashboard'
    | 'admin-dashboard'
    | 'checkout'
    | 'checkout-success'
    | 'orders'
    | 'order-tracking'
  >('home');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentOrderOtp, setCurrentOrderOtp] = useState<string | undefined>(undefined);

  const navigate = (page: string) => {
    setCurrentPage(page as any);
  };

  const handleSelectRestaurant = (id: string) => {
    setSelectedRestaurantId(id);
    setCurrentPage('restaurant-detail');
  };

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
          <Navbar onNavigate={navigate} currentPage={currentPage} />
          <CartDrawer onNavigateToCheckout={() => setCurrentPage('checkout')} />
          <ConflictModal />
          <AIChatDrawer onSelectRestaurant={handleSelectRestaurant} />
          <DemoBar onNavigate={navigate} />

          <div className="flex-1">
            {currentPage === 'home' && <MainDashboard onNavigate={navigate} />}
            {currentPage === 'restaurants' && (
              <RestaurantListingPage onSelectRestaurant={handleSelectRestaurant} />
            )}
            {currentPage === 'restaurant-detail' && selectedRestaurantId && (
              <RestaurantDetailPage
                restaurantId={selectedRestaurantId}
                onBack={() => setCurrentPage('restaurants')}
              />
            )}
            {currentPage === 'owner-dashboard' && <RestaurantOwnerDashboard />}
            {currentPage === 'driver-dashboard' && <DeliveryPartnerDashboard />}
            {currentPage === 'fleet-dashboard' && <FleetManagerDashboard />}
            {currentPage === 'finance-dashboard' && <FinanceManagerDashboard />}
            {currentPage === 'admin-dashboard' && <AdminDashboard />}
            {currentPage === 'checkout' && (
              <CheckoutPage
                onBack={() => setCurrentPage('restaurants')}
                onOrderSuccess={(orderId, _orderNumber, otp) => {
                  setCurrentOrderId(orderId);
                  setCurrentOrderOtp(otp);
                  setCurrentPage('order-tracking');
                }}
              />
            )}
            {currentPage === 'orders' && (
              <OrderHistoryPage
                onSelectOrder={(orderId) => {
                  setCurrentOrderId(orderId);
                  setCurrentOrderOtp(undefined);
                  setCurrentPage('order-tracking');
                }}
                onExplore={() => setCurrentPage('restaurants')}
              />
            )}
            {currentPage === 'order-tracking' && currentOrderId && (
              <OrderTrackingPage
                orderId={currentOrderId}
                initialOtp={currentOrderOtp}
                onBack={() => setCurrentPage('orders')}
              />
            )}
            {currentPage === 'login' && <LoginPage onNavigate={navigate} />}
            {currentPage === 'register' && <RegisterPage onNavigate={navigate} />}
            {currentPage === 'forgot-password' && <ForgotPasswordPage onNavigate={navigate} />}
          </div>
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

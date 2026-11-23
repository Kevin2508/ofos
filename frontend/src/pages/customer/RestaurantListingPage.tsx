import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Search, Star, Clock, MapPin, Sparkles, Filter, Store, ChevronLeft, ChevronRight } from 'lucide-react';

interface RestaurantBranch {
  id: string;
  branchName: string;
  city: string;
  deliveryFee: number;
  isAcceptingOrders: boolean;
  deliveryZone?: {
    radiusKm: number;
    minMinutes: number;
    maxMinutes: number;
  } | null;
}

interface RestaurantItem {
  id: string;
  businessName: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  cuisineTags: string[];
  averageRating: number;
  totalReviews: number;
  totalBranches: number;
  branches: RestaurantBranch[];
}

interface RestaurantListingPageProps {
  onSelectRestaurant: (id: string) => void;
}

interface RestaurantListResponse {
  data: RestaurantItem[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

const CUISINE_PILLS = ['All', 'Pizza', 'Burgers', 'North Indian', 'Italian', 'Biryani', 'Fast Food'];

export const RestaurantListingPage: React.FC<RestaurantListingPageProps> = ({ onSelectRestaurant }) => {
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 9 };
      if (searchTerm) params.search = searchTerm;
      if (selectedCuisine !== 'All') params.cuisine = selectedCuisine;
      if (minRating) params.minRating = minRating;

      const res = await apiClient.get<RestaurantListResponse>('/restaurant', { params });
      setRestaurants(res.data.data);
      const total = res.data.meta?.total ?? res.data.total ?? res.data.data.length;
      const pages = res.data.meta?.totalPages ?? res.data.totalPages ?? 1;
      setTotalCount(total);
      setTotalPages(pages);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCuisine, minRating]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRestaurants();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCuisine, minRating, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search & Discovery Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order Food Online</h2>
            <p className="text-xs text-slate-500 mt-0.5">Explore handcrafted menus from top-rated restaurants near you</p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dishes or restaurants..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            />
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CUISINE_PILLS.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => setSelectedCuisine(cuisine)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCuisine === cuisine
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-orange-500'
              }`}
            >
              {cuisine}
            </button>
          ))}

          <div className="border-l border-slate-200 pl-2 ml-1 flex items-center gap-2">
            <button
              onClick={() => setMinRating(minRating === 4 ? null : 4)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all ${
                minRating === 4
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-amber-500'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              4.0+
            </button>
          </div>
        </div>
      </div>

      {/* Restaurant Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
              <div className="h-44 bg-slate-200"></div>
              <div className="p-5 space-y-3">
                <div className="h-5 bg-slate-200 rounded w-2/3"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                <div className="h-3 bg-slate-100 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-2xl border border-red-200 text-sm">
          {error}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Store className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No restaurants found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find any restaurants matching your current search or filters. Try resetting the filters.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCuisine('All');
              setMinRating(null);
            }}
            className="px-4 py-2 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => {
            const primaryBranch = restaurant.branches[0];
            const deliveryMin = primaryBranch?.deliveryZone?.minMinutes || 25;
            const deliveryMax = primaryBranch?.deliveryZone?.maxMinutes || 45;
            const fee = primaryBranch?.deliveryFee ?? 35;

            return (
              <div
                key={restaurant.id}
                onClick={() => onSelectRestaurant(restaurant.id)}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-orange-300 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                {/* Cover Image Banner */}
                <div className="h-48 relative overflow-hidden bg-slate-100">
                  <img
                    src={restaurant.coverImageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'}
                    alt={restaurant.businessName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>

                  {/* Operational Status Badge */}
                  {primaryBranch && !primaryBranch.isAcceptingOrders && (
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-amber-500 text-white rounded-md text-[10px] font-bold shadow-md">
                      Not Accepting Orders
                    </div>
                  )}

                  {/* Rating Tag */}
                  <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg shadow-sm flex items-center gap-1 text-xs font-bold text-slate-900">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>
                      {restaurant.averageRating > 0 && restaurant.totalReviews > 0
                        ? restaurant.averageRating
                        : 'New'}
                    </span>
                  </div>

                  {/* Delivery Info Pill */}
                  <div className="absolute bottom-3 left-3 text-white flex items-center gap-2 text-xs font-medium">
                    <span className="flex items-center gap-1 bg-slate-900/70 backdrop-blur-sm px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3 text-orange-400" />
                      {deliveryMin}-{deliveryMax} mins
                    </span>
                    <span className="bg-slate-900/70 backdrop-blur-sm px-2 py-0.5 rounded-md">
                      ₹{fee} delivery
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-orange-600 transition-colors leading-snug">
                        {restaurant.businessName}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {restaurant.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {/* Cuisine Tags */}
                    <div className="flex items-center gap-1.5 overflow-hidden text-[11px] text-slate-600">
                      {restaurant.cuisineTags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {primaryBranch && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {primaryBranch.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && restaurants.length > 0 && totalPages > 1 && (
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold">{restaurants.length}</span> of{' '}
            <span className="font-semibold">{totalCount}</span> restaurants
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="px-3 py-1 text-xs font-bold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

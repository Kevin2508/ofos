import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useCart } from '../../context/CartContext';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Plus,
  Check,
  X,
  Award,
  ChevronRight,
  Info,
  AlertCircle,
} from 'lucide-react';

interface ModifierOption {
  id: string;
  optionName: string;
  additionalPrice: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  minSelection: number;
  maxSelection: number;
  options: ModifierOption[];
}

interface MenuItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  foodType: string;
  isBestseller: boolean;
  isAvailable: boolean;
  modifierGroups: ModifierGroup[];
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  items: MenuItem[];
}

interface RestaurantDetails {
  id: string;
  businessName: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  cuisineTags: string[];
  averageRating: number;
  totalReviews: number;
  branches: Array<{
    id: string;
    branchName: string;
    addressLine1: string;
    city: string;
    deliveryFee: number;
    minimumOrderValue: number;
    isAcceptingOrders: boolean;
    deliveryZone?: {
      minMinutes: number;
      maxMinutes: number;
    } | null;
  }>;
}

interface RestaurantDetailPageProps {
  restaurantId: string;
  onBack: () => void;
}

export const RestaurantDetailPage: React.FC<RestaurantDetailPageProps> = ({
  restaurantId,
  onBack,
}) => {
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Category filter
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Modifier Selection Modal
  const [selectedItemForMod, setSelectedItemForMod] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [restRes, menuRes] = await Promise.all([
          apiClient.get<RestaurantDetails>(`/restaurant/${restaurantId}`),
          apiClient.get<{ restaurant: RestaurantDetails; categories: MenuCategory[] }>(
            `/restaurant/${restaurantId}/menu`,
          ),
        ]);

        setRestaurant(restRes.data);
        const cats: MenuCategory[] = menuRes.data.categories || [];
        setCategories(cats);
        if (cats.length > 0) {
          setActiveCategory(cats[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load restaurant details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);

  // Open modifier modal or add directly
  const handleItemAddClick = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setModalError(null);

    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setSelectedItemForMod(item);

      // Pre-select first option for required groups
      const initialSelections: Record<string, string[]> = {};
      item.modifierGroups.forEach((group) => {
        if (group.isRequired && group.options.length > 0) {
          initialSelections[group.id] = [group.options[0].id];
        } else {
          initialSelections[group.id] = [];
        }
      });
      setSelectedOptions(initialSelections);
    } else {
      const activeBranch = restaurant?.branches?.[0];
      if (!activeBranch) return;
      addToCart({
        menuItemId: item.id,
        restaurantBranchId: activeBranch.id,
        quantity: 1,
      })
        .then((res) => {
          if (res.success) {
            showToast(`Added ${item.name} to cart!`);
          }
        })
        .catch((err) => {
          showToast(err.response?.data?.message || 'Failed to add item to cart');
        });
    }
  };

  const handleOptionToggle = (group: ModifierGroup, optionId: string) => {
    setModalError(null);
    const isSingleSelect = group.maxSelection === 1;

    setSelectedOptions((prev) => {
      const current = prev[group.id] || [];
      if (isSingleSelect) {
        return { ...prev, [group.id]: [optionId] };
      } else {
        const exists = current.includes(optionId);
        if (exists) {
          return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
        } else {
          if (group.maxSelection > 0 && current.length >= group.maxSelection) {
            setModalError(`You can select at most ${group.maxSelection} option(s) for "${group.name}".`);
            return prev;
          }
          return { ...prev, [group.id]: [...current, optionId] };
        }
      }
    });
  };

  // Compute calculated line price in modal
  const calculateModalPrice = (): number => {
    if (!selectedItemForMod) return 0;
    let total = selectedItemForMod.basePrice;

    selectedItemForMod.modifierGroups.forEach((group) => {
      const chosenIds = selectedOptions[group.id] || [];
      group.options.forEach((opt) => {
        if (chosenIds.includes(opt.id)) {
          total += opt.additionalPrice;
        }
      });
    });

    return total;
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { addToCart } = useCart();

  const handleConfirmModifiers = async () => {
    if (!selectedItemForMod || !restaurant) return;

    for (const group of selectedItemForMod.modifierGroups) {
      const chosen = selectedOptions[group.id] || [];
      const minRequired = group.minSelection > 0 ? group.minSelection : (group.isRequired ? 1 : 0);
      const maxAllowed = group.maxSelection > 0 ? group.maxSelection : Infinity;

      if (chosen.length < minRequired) {
        setModalError(`Please select at least ${minRequired} option(s) for "${group.name}".`);
        return;
      }
      if (chosen.length > maxAllowed) {
        setModalError(`Please select at most ${maxAllowed} option(s) for "${group.name}".`);
        return;
      }
    }

    setModalError(null);

    const activeBranch = restaurant.branches?.[0];
    if (!activeBranch) {
      setModalError('No active restaurant branch available.');
      return;
    }

    const modifierPayload: Array<{ modifierOptionId: string }> = [];
    Object.values(selectedOptions).forEach((optIds) => {
      optIds.forEach((id) => {
        modifierPayload.push({ modifierOptionId: id });
      });
    });

    try {
      const result = await addToCart({
        menuItemId: selectedItemForMod.id,
        restaurantBranchId: activeBranch.id,
        quantity: 1,
        modifiers: modifierPayload,
      });

      if (result.success) {
        showToast(`Added ${selectedItemForMod.name} to cart!`);
      }
      setSelectedItemForMod(null);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to add item to cart');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500">Loading delicious menu...</p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
          {error || 'Restaurant not found'}
        </div>
        <button
          onClick={onBack}
          className="text-xs font-semibold text-orange-600 hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to restaurants
        </button>
      </div>
    );
  }

  const primaryBranch = restaurant.branches[0];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      {primaryBranch && !primaryBranch.isAcceptingOrders && (
        <div className="bg-amber-500 text-white text-xs font-semibold py-2.5 px-4 text-center flex items-center justify-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>This restaurant is currently not accepting new orders. You can browse the menu.</span>
        </div>
      )}

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <button
            onClick={onBack}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Restaurants
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-100 border border-orange-200 overflow-hidden flex-shrink-0 shadow-sm">
                <img
                  src={restaurant.logoUrl || restaurant.coverImageUrl}
                  alt={restaurant.businessName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {restaurant.businessName}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{restaurant.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-bold text-slate-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    {restaurant.averageRating > 0 && restaurant.totalReviews > 0
                      ? `${restaurant.averageRating} (${restaurant.totalReviews} reviews)`
                      : 'New'}
                  </span>
                  <span>&bull;</span>
                  <span>{restaurant.cuisineTags.join(', ')}</span>
                </div>
              </div>
            </div>

            {primaryBranch && (
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Delivery</div>
                  <div className="font-bold text-slate-800">
                    {primaryBranch.deliveryZone?.minMinutes || 25}-{primaryBranch.deliveryZone?.maxMinutes || 45} mins
                  </div>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fee</div>
                  <div className="font-bold text-slate-800">₹{primaryBranch.deliveryFee}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="sticky top-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.name} ({cat.items.length})
            </button>
          ))}
        </div>
      </div>

      {/* Menu Categories and Dishes */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {categories.map((category) => (
          <section key={category.id} id={category.id} className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{category.name}</h2>
              {category.description && (
                <p className="text-xs text-slate-500 mt-0.5">{category.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.items.map((item) => {
                const isVeg = item.foodType === 'VEG' || item.foodType === 'VEGAN';

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm flex items-start justify-between gap-4 transition-all"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {/* Food Type Indicator Dot */}
                        <div
                          className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                            isVeg ? 'border-emerald-600' : 'border-red-600'
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isVeg ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          ></div>
                        </div>

                        {item.isBestseller && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-600" />
                            Bestseller
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-base leading-tight">
                          {item.name}
                        </h4>
                        <div className="text-sm font-black text-slate-900 mt-1">₹{item.basePrice}</div>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {item.modifierGroups.length > 0 && (
                        <div className="text-[11px] font-semibold text-orange-600">
                          Customisable &bull; {item.modifierGroups.length} options
                        </div>
                      )}
                    </div>

                    {/* Image and Add Button */}
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.isAvailable ? (
                        <button
                          onClick={() => handleItemAddClick(item)}
                          className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 font-extrabold text-xs rounded-lg shadow-md uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      ) : (
                        <button
                          disabled
                          className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-100 text-slate-400 border border-slate-200 font-extrabold text-[10px] rounded-lg shadow-none cursor-not-allowed uppercase tracking-wider"
                        >
                          Sold Out
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Interactive Customization / Modifier Modal */}
      {selectedItemForMod && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Customise {selectedItemForMod.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Base price: ₹{selectedItemForMod.basePrice}</p>
              </div>
              <button
                onClick={() => setSelectedItemForMod(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                  <span>{modalError}</span>
                </div>
              )}

              {selectedItemForMod.modifierGroups.map((group) => {
                const isSingleSelect = group.maxSelection === 1;
                const chosen = selectedOptions[group.id] || [];

                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">{group.name}</h4>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {group.isRequired
                          ? 'Required'
                          : `Optional (Max ${group.maxSelection || 'any'})`}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.options.map((opt) => {
                        const isChecked = chosen.includes(opt.id);

                        return (
                          <label
                            key={opt.id}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-orange-50/70 border-orange-300'
                                : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type={isSingleSelect ? 'radio' : 'checkbox'}
                                name={group.id}
                                checked={isChecked}
                                onChange={() => handleOptionToggle(group, opt.id)}
                                className="text-orange-600 focus:ring-orange-500 rounded border-slate-300"
                              />
                              <span className="text-xs font-semibold text-slate-800">
                                {opt.optionName}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-900">
                              {opt.additionalPrice > 0 ? `+₹${opt.additionalPrice}` : 'Free'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Amount</div>
                <div className="text-lg font-black text-slate-900">₹{calculateModalPrice()}</div>
              </div>

              <button
                onClick={handleConfirmModifiers}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>Add Item</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

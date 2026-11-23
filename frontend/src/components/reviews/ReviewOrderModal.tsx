import React, { useState } from 'react';
import { Star, X, MessageSquare, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { apiClient } from '../../api/client';

interface ReviewOrderModalProps {
  orderId: string;
  orderNumber: string;
  restaurantName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewOrderModal: React.FC<ReviewOrderModalProps> = ({
  orderId,
  orderNumber,
  restaurantName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [foodRating, setFoodRating] = useState<number>(5);
  const [deliveryRating, setDeliveryRating] = useState<number>(5);
  const [packagingRating, setPackagingRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddImage = () => {
    if (newImageUrl.trim() && imageUrls.length < 3) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiClient.post(`/reviews/orders/${orderId}`, {
        foodRating,
        deliveryRating,
        packagingRating,
        reviewText: reviewText.trim() || undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          (Array.isArray(err?.response?.data?.message)
            ? err.response.data.message.join(', ')
            : 'Failed to submit review. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarSelector = (
    label: string,
    currentValue: number,
    setter: (val: number) => void,
    subtitle: string
  ) => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-100 gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-800">{label}</h4>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setter(star)}
              className="p-1 hover:scale-110 transition-transform focus:outline-none"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  star <= currentValue
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-300'
                }`}
              />
            </button>
          ))}
          <span className="text-xs font-bold text-slate-600 ml-1.5 w-6 text-right">
            {currentValue}/5
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700">
                Delivered
              </span>
              <span className="text-xs font-semibold text-slate-400">#{orderNumber}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              Rate your meal {restaurantName ? `from ${restaurantName}` : ''}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-1">
            {renderStarSelector(
              'Food Taste & Quality',
              foodRating,
              setFoodRating,
              'Temperature, freshness, and flavor'
            )}
            {renderStarSelector(
              'Delivery Experience',
              deliveryRating,
              setDeliveryRating,
              'Rider punctuality and courtesy'
            )}
            {renderStarSelector(
              'Packaging & Hygiene',
              packagingRating,
              setPackagingRating,
              'Spill-free sealing and food condition'
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Your Review (Optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What did you like the most? Mention dishes, flavours, or delivery..."
              className="w-full text-sm border border-slate-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-800"
            />
            <div className="text-right text-[11px] text-slate-400 mt-1">
              {reviewText.length}/500
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Add Food Photos (Max 3)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste image URL (https://...)"
                disabled={imageUrls.length >= 3}
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={handleAddImage}
                disabled={!newImageUrl.trim() || imageUrls.length >= 3}
                className="px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 disabled:opacity-40 transition-colors"
              >
                Add
              </button>
            </div>
            {imageUrls.length > 0 && (
              <div className="flex gap-2 mt-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                    <img src={url} alt="Review attachment" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {submitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

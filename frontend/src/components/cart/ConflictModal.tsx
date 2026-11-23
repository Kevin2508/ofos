import React from 'react';
import { useCart } from '../../context/CartContext';
import { AlertTriangle, Trash2, ArrowRight } from 'lucide-react';

export const ConflictModal: React.FC = () => {
  const { conflictState, resolveConflict, loading } = useCart();

  if (!conflictState.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          Replace cart items?
        </h3>

        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Your cart currently contains dishes from{' '}
          <span className="font-bold text-slate-800">{conflictState.existingBranchName || 'another restaurant'}</span>.
          Each order must be from a single restaurant.
        </p>

        <p className="text-xs text-slate-500 mt-2">
          Would you like to discard your existing cart and start a new order?
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => resolveConflict(false)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Keep Existing Cart
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => resolveConflict(true)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard & Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

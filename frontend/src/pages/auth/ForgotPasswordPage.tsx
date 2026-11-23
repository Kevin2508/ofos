import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

interface ForgotPasswordResponse {
  message: string;
  simulatedResetToken?: string;
  simulatedOtp?: string;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [userIdentifier, setUserIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [simulatedInfo, setSimulatedInfo] = useState<{ token?: string; otp?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset phase
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', { userIdentifier });
      setMessage(res.data.message);
      if (res.data.simulatedResetToken || res.data.simulatedOtp) {
        setSimulatedInfo({
          token: res.data.simulatedResetToken,
          otp: res.data.simulatedOtp,
        });
        setResetToken(res.data.simulatedResetToken || res.data.simulatedOtp || '');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiClient.post(`/auth/reset-password/${resetToken}`, {
        password: newPassword,
        userIdentifier: userIdentifier.includes('@') ? undefined : userIdentifier,
      });
      setResetSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
        <button
          onClick={() => onNavigate('login')}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </button>

        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Reset Your Password</h2>
          <p className="text-xs text-slate-500">
            Enter your registered email or phone to receive instructions
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resetSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="text-sm font-bold text-emerald-900">Password Reset Complete!</div>
            <p className="text-xs text-emerald-700">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
            >
              Go to Sign In
            </button>
          </div>
        ) : !message ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email or Phone
              </label>
              <input
                type="text"
                required
                value={userIdentifier}
                onChange={(e) => setUserIdentifier(e.target.value)}
                placeholder="you@ofos.com or +919876543210"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-semibold">{message}</div>
              {simulatedInfo?.otp && (
                <div>
                  Dev OTP Code: <code className="font-bold bg-amber-100 px-1 rounded">{simulatedInfo.otp}</code>
                </div>
              )}
              {simulatedInfo?.token && (
                <div className="truncate">
                  Dev Token: <code className="font-mono text-[10px] bg-amber-100 px-1 rounded">{simulatedInfo.token}</code>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reset Code or Token
              </label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Enter 6-digit OTP or token"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

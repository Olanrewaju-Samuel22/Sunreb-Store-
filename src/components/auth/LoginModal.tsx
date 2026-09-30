import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Lock, Delete, Store } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { loginWithPin } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleLogin = async (pinToTry?: string) => {
    const finalPin = pinToTry || pin;
    if (!finalPin) {
      setError('Please enter your staff PIN');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await loginWithPin(finalPin);
    } catch (err: any) {
      setError(err.message || 'Invalid PIN. Please check and try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f2942] text-white p-5 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-white/10 mb-3">
            <Store className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-base font-bold tracking-tight uppercase leading-snug">
            SUNREB GEO-VISION &amp; GROCERIES
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">Multiventure Drinks &amp; Groceries POS</p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
              Staff Authorization
            </div>
            <p className="text-xs text-slate-600">Enter your 4-digit PIN to access register</p>
          </div>

          {/* PIN Display */}
          <div className="mb-4">
            <div className="h-12 bg-slate-50 border border-slate-300 rounded-lg flex items-center justify-center px-4 font-mono text-xl tracking-[0.5em] text-slate-800">
              {pin ? '•'.repeat(pin.length) : <span className="text-slate-400 text-sm tracking-normal">Enter PIN</span>}
            </div>
            {error && (
              <div className="mt-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded p-2 text-center">
                {error}
              </div>
            )}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="h-12 text-lg font-medium bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg transition-colors text-slate-800"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 text-xs font-semibold uppercase bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg text-slate-600"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-12 text-lg font-medium bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg transition-colors text-slate-800"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-lg text-slate-600"
              title="Backspace"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Login Action Button */}
          <button
            type="button"
            onClick={() => handleLogin()}
            disabled={isLoading || pin.length === 0}
            className="w-full py-2.5 bg-[#0f2942] hover:bg-[#153a5b] disabled:bg-slate-300 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Authorize &amp; Sign In</span>
              </>
            )}
          </button>

          {/* Default Demo Credentials Quick Access */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-500 block mb-2 font-medium">Quick Sign In Profiles</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleLogin('1234')}
                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded border border-slate-200 text-left leading-tight transition-colors cursor-pointer"
              >
                <div className="font-semibold text-slate-900">Admin</div>
                <div className="text-[10px] text-slate-500">PIN: 1234</div>
              </button>
              <button
                type="button"
                onClick={() => handleLogin('0000')}
                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded border border-slate-200 text-left leading-tight transition-colors cursor-pointer"
              >
                <div className="font-semibold text-slate-900">Cashier Desk 1</div>
                <div className="text-[10px] text-slate-500">PIN: 0000</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

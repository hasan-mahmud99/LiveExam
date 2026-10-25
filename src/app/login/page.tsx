'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  LogIn, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, show direct dashboard link
  if (user) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">আপনি ইতোমধ্যে লগইন আছেন</h2>
        <p className="text-sm text-gray-600">
          ইউজার: <strong className="text-gray-900">{user.display_name}</strong> ({user.role})
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl text-sm shadow hover:bg-emerald-700 transition flex items-center justify-center gap-2 active:scale-98"
        >
          <span>ড্যাশবোর্ডে প্রবেশ করুন</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('ইউজারনেম এবং পাসওয়ার্ড আবশ্যক');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await login(username.trim(), password.trim(), rememberMe);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'ভুল ইউজারনেম অথবা পাসওয়ার্ড');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-14 px-3 sm:px-0">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <LogIn className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">স্টাডি গ্রুপ লগইন</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            আপনার ইউজার আইডি ও পাসওয়ার্ড দিয়ে প্রবেশ করুন
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 text-center animate-shake">
            {error}
          </div>
        )}

        {/* Standard Proper Login Form - No 1-click bypass */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              ইউজার আইডি / ইউজারনেম:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="ইউজারনেম দিন (e.g. admin / kona / hasan)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              পাসওয়ার্ড:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-gray-700 font-semibold">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 accent-emerald-600 cursor-pointer"
              />
              <span>আমাকে মনে রাখুন (Keep me signed in until sign out)</span>
            </label>
            <p className="text-[11px] text-gray-400 mt-1 pl-6">
              যতদিন পর্যন্ত নিজে সাইন আউট না করবেন, ততদিন স্বয়ংক্রিয়ভাবে লগইন থাকবে।
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black rounded-xl text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন (Sign In)'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-500 font-medium">
            স্টাডি গ্রুপ একাউন্টসমূহ: <strong className="text-gray-700">admin</strong> (এডমিন) • <strong className="text-gray-700">kona</strong> (কণা) • <strong className="text-gray-700">hasan</strong> (হাসান)
          </p>
        </div>
      </div>
    </div>
  );
}

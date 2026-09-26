'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Sparkles, Eye, EyeOff, ArrowRight, Shield, Zap } from 'lucide-react';

export default function LoginPage() {
  const { user, isLoading, login, quickLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already logged in → redirect
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Login failed.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-700 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-lg">
            F
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Fathom AI Clone</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white leading-tight mb-4">
            Your meetings,<br />
            <span className="text-indigo-200">intelligently analyzed.</span>
          </h1>
          <p className="text-indigo-200 text-sm leading-relaxed max-w-sm">
            Instantly extract executive summaries, action items, key decisions, and memorable highlights from any meeting.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { icon: Sparkles, text: 'AI-powered meeting intelligence' },
              { icon: Shield, text: 'Bring your own API key — data stays private' },
              { icon: Zap, text: 'Results in seconds, persisted for every session' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-indigo-100 text-sm">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
        <p className="text-indigo-300/60 text-xs">24-hour product challenge build</p>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile Brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-sm">
              F
            </div>
            <span className="font-bold text-slate-900">Fathom AI Clone</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-8">Access your meeting intelligence dashboard.</p>

          {/* 1-Click Demo Switcher */}
          <div className="mb-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-2.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Quick Demo — Sign in as:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin('user-1')}
                disabled={isSubmitting}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">SC</div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 leading-tight">Sarah Chen</p>
                  <p className="text-[10px] text-slate-500 leading-tight">Head of Product</p>
                </div>
              </button>
              <button
                onClick={() => quickLogin('user-2')}
                disabled={isSubmitting}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">AR</div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 leading-tight">Alex Rivera</p>
                  <p className="text-[10px] text-slate-500 leading-tight">Lead Engineer</p>
                </div>
              </button>
            </div>
          </div>

          {/* Google OAuth Button */}
          <a
            href="/api/auth/google"
            className="w-full mb-4 flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </a>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-400">or sign in with credentials</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@fathom.ai"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password123"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 hover:shadow-indigo-200 hover:shadow-md"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  Sign in <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

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
      <div className="min-h-screen flex items-center justify-center bg-[#010102]">
        <div className="w-8 h-8 rounded-full border-2 border-[#23252a] border-t-[#7170ff] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#010102] p-12 flex-col justify-between">
        {/* Brand Monogram */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 flex items-center justify-center bg-white">
            <span className="text-[#010102] font-black text-sm leading-none">F</span>
          </div>
          <span className="text-[#f7f8f8] font-semibold text-xl">Fathom AI</span>
        </div>

        {/* Center Content */}
        <div className="max-w-md">
          <h1
            className="text-5xl text-white mb-5 leading-tight"
            style={{ fontWeight: 590, letterSpacing: '-0.022em' }}
          >
            Engineered Meeting Intelligence
          </h1>
          <p className="text-[#8a8f98] text-lg leading-relaxed mb-10">
            Instantly extract executive summaries, action items, key decisions, and memorable highlights from any meeting.
          </p>

          <div className="space-y-4">
            {[
              { icon: Sparkles, text: 'AI-powered meeting intelligence' },
              { icon: Shield, text: 'Bring your own API key — data stays private' },
              { icon: Zap, text: 'Results in seconds, persisted for every session' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-[#d0d6e0]">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-[#23252a] flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[#7170ff]" />
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[#62666d] text-xs">24-hour product challenge build</p>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#08090a]">
        <div className="w-full max-w-sm">
          {/* Mobile Brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-6 h-6 flex items-center justify-center bg-white">
              <span className="text-[#010102] font-black text-xs leading-none">F</span>
            </div>
            <span className="text-[#f7f8f8] font-semibold text-lg">Fathom AI</span>
          </div>

          {/* Heading */}
          <h2
            className="text-[#f7f8f8] mb-1"
            style={{ fontSize: '24px', fontWeight: 600 }}
          >
            Sign in
          </h2>
          <p className="text-[#8a8f98] mb-8" style={{ fontSize: '15px' }}>
            Access your meeting intelligence dashboard.
          </p>

          {/* Quick Demo Box */}
          <div className="mb-6 p-4 bg-[#0f1011] border border-[#23252a] rounded-xl">
            <p className="text-xs font-semibold text-[#8a8f98] mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#d4b144]" />
              Quick Demo — Sign in as:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin('user-1')}
                disabled={isSubmitting}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#34343a] bg-[#232326] hover:border-[#3e3e44] transition-colors text-left disabled:opacity-50"
              >
                <div className="w-7 h-7 rounded-full bg-[#68cc58]/20 border border-[#68cc58]/30 flex items-center justify-center text-[10px] font-bold text-[#68cc58] shrink-0">
                  SC
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#f7f8f8] leading-tight">Sarah Chen</p>
                  <p className="text-[10px] text-[#62666d] leading-tight">Head of Product</p>
                </div>
              </button>
              <button
                onClick={() => quickLogin('user-2')}
                disabled={isSubmitting}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#34343a] bg-[#232326] hover:border-[#3e3e44] transition-colors text-left disabled:opacity-50"
              >
                <div className="w-7 h-7 rounded-full bg-[#7170ff]/20 border border-[#7170ff]/30 flex items-center justify-center text-[10px] font-bold text-[#7170ff] shrink-0">
                  AR
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#f7f8f8] leading-tight">Alex Rivera</p>
                  <p className="text-[10px] text-[#62666d] leading-tight">Lead Engineer</p>
                </div>
              </button>
            </div>
          </div>

          {/* Google OAuth Button */}
          <a
            href="/api/auth/google"
            className="w-full mb-5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-[#34343a] bg-[#1c1c1f] hover:border-[#3e3e44] text-sm text-[#d0d6e0] transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Sign in with Google
          </a>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#23252a]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#08090a] px-3 text-xs text-[#62666d]">or sign in with credentials</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@fathom.ai"
                required
                className="w-full bg-[#1c1c1f] border border-[#34343a] rounded-lg px-3.5 py-2.5 h-[36px] text-[#f7f8f8] placeholder:text-[#62666d] focus:border-[#7170ff] focus:outline-none focus:ring-1 focus:ring-[#7170ff] text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8a8f98] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password123"
                  required
                  className="w-full bg-[#1c1c1f] border border-[#34343a] rounded-lg px-3.5 py-2.5 pr-10 h-[36px] text-[#f7f8f8] placeholder:text-[#62666d] focus:border-[#7170ff] focus:outline-none focus:ring-1 focus:ring-[#7170ff] text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#62666d] hover:text-[#8a8f98] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[#93000a]/20 border border-[#eb5757]/30 text-[#eb5757] rounded-lg px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-white text-[#08090a] rounded-lg h-[36px] px-4 font-medium text-sm hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-[#23252a] border-t-[#7170ff] animate-spin rounded-full" />
              ) : (
                <>
                  Sign in <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#62666d]">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="text-[#828fff] hover:text-[#7170ff] transition-colors">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create account.');
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setIsSubmitting(false);
        return;
      }

      // Successful signup automatically logs in and sets session cookie
      window.location.href = '/dashboard';
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-slate-100">
      {/* Brand Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-950 p-12 flex-col justify-between border-r border-indigo-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20">
            F
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Fathom AI</span>
        </div>

        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Meeting Notetaker
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4 tracking-tight">
            Supercharge your meetings with structured AI memory.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Create an account to automatically generate executive summaries, track action items, record decisions, and bookmark key moments.
          </p>

          <div className="space-y-3">
            {[
              'Enterprise-grade password encryption (bcrypt)',
              'Single sign-on with Google OAuth',
              'Fast, real-time searchable transcripts',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} Fathom AI Clone. Secure session auth enabled.
        </div>
      </div>

      {/* Signup Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-white">Create your account</h2>
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Google OAuth Button */}
          <a
            href="/api/auth/google"
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-sm font-medium text-slate-200 transition-colors shadow-xs"
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
            Continue with Google
          </a>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-950 px-3 text-xs text-slate-500 uppercase tracking-wider">
              or sign up with email
            </span>
          </div>

          {error && (
            <div className="p-3 text-xs bg-red-950/50 border border-red-800/60 rounded-xl text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Chen"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-hidden text-sm text-white placeholder-slate-500"
              />
              {fieldErrors.name && (
                <p className="text-[11px] text-red-400 mt-1">{fieldErrors.name[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@fathom.ai"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-hidden text-sm text-white placeholder-slate-500"
              />
              {fieldErrors.email && (
                <p className="text-[11px] text-red-400 mt-1">{fieldErrors.email[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-hidden text-sm text-white placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-red-400 mt-1">{fieldErrors.password[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-hidden text-sm text-white placeholder-slate-500"
              />
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-red-400 mt-1">{fieldErrors.confirmPassword[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

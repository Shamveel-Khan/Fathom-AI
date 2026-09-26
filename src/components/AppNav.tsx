'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { LogOut, Key, ChevronDown, Users, Sparkles, Search } from 'lucide-react';
import { ApiKeyModal } from './ApiKeyModal';
import { SearchModal } from './SearchModal';

const LOCAL_STORAGE_KEY = 'fathom_ai_api_key';
const LOCAL_STORAGE_BASE_URL = 'fathom_ai_base_url';
const LOCAL_STORAGE_MODEL = 'fathom_ai_model';

interface AppNavProps {
  apiKey: string;
  onSaveApiKey: (key: string, baseUrl?: string, model?: string) => void;
  baseUrl?: string;
  model?: string;
}

export function AppNav({ apiKey, onSaveApiKey, baseUrl = '', model = 'gpt-4o-mini' }: AppNavProps) {
  const { user, logout, quickLogin } = useAuth();
  const pathname = usePathname();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-200">
              F
            </div>
            <span className="font-bold text-slate-900 tracking-tight hidden sm:block">Fathom</span>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              AI Clone
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Meetings
            </Link>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Global Search Button */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs font-medium transition-all shadow-2xs"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.2 rounded-md shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* API Key Status */}
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                apiKey
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{apiKey ? 'Key Configured' : 'Add API Key'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${apiKey ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                      user.avatarColor || 'bg-slate-600'
                    }`}
                  >
                    {initials}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{user.role}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-20 overflow-hidden">
                    <div className="p-3 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-500">{user.email}</p>
                    </div>

                    <div className="p-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-2 pt-1 pb-1.5 flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        Switch Demo User
                      </p>
                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await quickLogin('user-1');
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 text-left transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">SC</div>
                        <div>
                          <p className="text-xs font-medium text-slate-900">Sarah Chen</p>
                          <p className="text-[10px] text-slate-500">Head of Product</p>
                        </div>
                        {user.id === 'user-1' && <Sparkles className="w-3 h-3 text-indigo-500 ml-auto" />}
                      </button>
                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await quickLogin('user-2');
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 text-left transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">AR</div>
                        <div>
                          <p className="text-xs font-medium text-slate-900">Alex Rivera</p>
                          <p className="text-[10px] text-slate-500">Lead Frontend Engineer</p>
                        </div>
                        {user.id === 'user-2' && <Sparkles className="w-3 h-3 text-indigo-500 ml-auto" />}
                      </button>
                    </div>

                    <div className="p-2 border-t border-slate-100">
                      <button
                        onClick={() => { setIsUserMenuOpen(false); logout(); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-rose-50 text-rose-600 text-xs font-medium transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveKey={onSaveApiKey}
        baseUrl={baseUrl}
        model={model}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
}

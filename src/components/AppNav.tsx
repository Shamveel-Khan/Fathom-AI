'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { LogOut, ChevronDown, Users, Sparkles, Search, Upload } from 'lucide-react';
import { ApiKeyModal } from './ApiKeyModal';
import { SearchModal } from './SearchModal';
import { ImportMeetingModal } from './ImportMeetingModal';

const LOCAL_STORAGE_KEY = 'fathom_ai_api_key';
const LOCAL_STORAGE_BASE_URL = 'fathom_ai_base_url';
const LOCAL_STORAGE_MODEL = 'fathom_ai_model';

interface AppNavProps {
  apiKey: string;
  onSaveApiKey: (key: string, baseUrl?: string, model?: string) => void;
  baseUrl?: string;
  model?: string;
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/meetings', label: 'Meetings' },
  { href: '/action-items', label: 'Actions' },
  { href: '/decisions', label: 'Decisions' },
  { href: '/settings', label: 'Settings' },
];

export function AppNav({ apiKey, onSaveApiKey, baseUrl = '', model = 'gpt-4o-mini' }: AppNavProps) {
  const { user, logout, quickLogin } = useAuth();
  const pathname = usePathname();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [switchingUserId, setSwitchingUserId] = useState<string | null>(null);
  const [shortcutLabel, setShortcutLabel] = useState('⌘K');

  // Detect platform for shortcut hint (macOS vs Windows/Linux)
  useEffect(() => {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/i.test(navigator.userAgent || navigator.platform || '');
    setShortcutLabel(isMac ? '⌘K' : 'Ctrl+K');
  }, []);

  // Global keyboard shortcut listener for Cmd+K and Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <nav
        className="sticky top-0 z-40 w-full border-b"
        style={{
          background: 'rgba(11, 11, 11, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: '#23252a',
        }}
      >
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: '#ffffff', color: '#08090a' }}
              >
                F
              </div>
              <span className="font-semibold text-sm hidden sm:block" style={{ color: '#f7f8f8', letterSpacing: '-0.012em' }}>
                Fathom AI
              </span>
            </Link>

            {/* Divider */}
            <div className="hidden md:block w-px h-4" style={{ background: '#23252a' }} />

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150"
                    style={{
                      color: active ? '#f7f8f8' : '#8a8f98',
                      background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: active ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors duration-150 cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.08)',
                color: '#8a8f98',
              }}
              title={`Global Search (${shortcutLabel})`}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-sm">Search...</span>
              <kbd
                className="hidden lg:inline-flex items-center text-[11px] px-1.5 py-0.5 rounded"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: '#232326',
                  border: '1px solid #34343a',
                  color: '#62666d',
                  letterSpacing: '0.02em',
                }}
              >
                {shortcutLabel}
              </kbd>
            </button>

            {/* Mobile search */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="sm:hidden p-2 rounded-lg cursor-pointer"
              style={{ color: '#8a8f98' }}
              title={`Global Search (${shortcutLabel})`}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Import Meeting */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity duration-150 hover:opacity-90 cursor-pointer"
              style={{ background: '#ffffff', color: '#08090a' }}
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Import</span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer"
                style={{ color: '#d0d6e0' }}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${user.avatarColor || 'bg-slate-600'}`}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium" style={{ color: '#d0d6e0' }}>
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150`}
                  style={{ color: '#62666d', transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-2xl z-20 overflow-hidden"
                    style={{ background: '#0f1011', borderColor: '#23252a' }}
                  >
                    <div className="p-3 border-b" style={{ borderColor: '#23252a' }}>
                      <p className="text-xs font-semibold" style={{ color: '#f7f8f8' }}>{user.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#62666d' }}>{user.email}</p>
                    </div>

                    <div className="p-2">
                      <p
                        className="text-[10px] uppercase tracking-wider px-2 pt-1 pb-1.5 flex items-center gap-1.5"
                        style={{ color: '#62666d', letterSpacing: '0.06em' }}
                      >
                        <Users className="w-3 h-3" />
                        Switch Demo User
                      </p>
                      {[
                        { id: 'user-1', initials: 'SC', name: 'Sarah Chen', role: 'Head of Product', color: '#27a644' },
                        { id: 'user-2', initials: 'AR', name: 'Alex Rivera', role: 'Lead Engineer', color: '#7170ff' },
                      ].map((u) => {
                        const isSwitchingThis = switchingUserId === u.id;
                        return (
                          <button
                            key={u.id}
                            disabled={Boolean(switchingUserId)}
                            onClick={async () => {
                              if (switchingUserId) return;
                              setSwitchingUserId(u.id);
                              try {
                                await quickLogin(u.id);
                              } finally {
                                setSwitchingUserId(null);
                                setIsUserMenuOpen(false);
                              }
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ color: '#d0d6e0' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                              style={{ background: u.color }}
                            >
                              {isSwitchingThis ? (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                              ) : (
                                u.initials
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate" style={{ color: '#f7f8f8' }}>
                                {isSwitchingThis ? 'Switching…' : u.name}
                              </p>
                              <p className="text-[10px] truncate" style={{ color: '#62666d' }}>{u.role}</p>
                            </div>
                            {user.id === u.id && !isSwitchingThis && <Sparkles className="w-3 h-3 shrink-0" style={{ color: '#7170ff' }} />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-2 border-t" style={{ borderColor: '#23252a' }}>
                      <button
                        onClick={() => { setIsUserMenuOpen(false); logout(); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
                        style={{ color: '#eb5757' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(235,87,87,0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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

      <ImportMeetingModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {}}
      />
    </>
  );
}

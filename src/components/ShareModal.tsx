'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Link2, Users, Copy, Check, Search, Trash2, Loader2 } from 'lucide-react';

interface SharedUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarColor?: string;
  sharedAt: string;
}

interface ShareModalProps {
  meetingId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ meetingId, isOpen, onClose }: ShareModalProps) {
  const [tab, setTab] = useState<'public' | 'people'>('public');
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; email: string; avatarColor?: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchShares = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/shares`);
      const data = await res.json();
      if (data.success) {
        setPublicToken(data.publicShare?.token ?? null);
        setSharedUsers(data.sharedUsers ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    if (isOpen) {
      fetchShares();
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, fetchShares]);

  // Debounced user search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) setSearchResults(data.users);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleCreatePublicLink = async () => {
    const res = await fetch(`/api/meetings/${meetingId}/shares/public`, { method: 'POST' });
    const data = await res.json();
    if (data.success) setPublicToken(data.token);
  };

  const handleRevokePublicLink = async () => {
    await fetch(`/api/meetings/${meetingId}/shares/public`, { method: 'DELETE' });
    setPublicToken(null);
  };

  const handleCopy = () => {
    if (!publicToken) return;
    const url = `${window.location.origin}/share/${publicToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWithUser = async (targetUserId: string) => {
    const res = await fetch(`/api/meetings/${meetingId}/shares/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: targetUserId }),
    });
    const data = await res.json();
    if (data.success) {
      setSharedUsers(data.sharedUsers);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleRemoveUser = async (targetUserId: string) => {
    await fetch(`/api/meetings/${meetingId}/shares/users/${targetUserId}`, { method: 'DELETE' });
    setSharedUsers((prev) => prev.filter((u) => u.userId !== targetUserId));
  };

  if (!isOpen) return null;

  const publicUrl = publicToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${publicToken}` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Share Meeting</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {(['public', 'people'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                tab === t
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'public' ? <Link2 className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
              {t === 'public' ? 'Public Link' : 'Share with People'}
            </button>
          ))}
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : tab === 'public' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Anyone with the link can view this meeting. The real meeting ID is never exposed.
              </p>
              {publicToken ? (
                <>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <span className="flex-1 text-xs text-slate-600 truncate">{publicUrl}</span>
                    <button onClick={handleCopy} className="shrink-0 text-indigo-600 hover:text-indigo-800 transition-colors">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    onClick={handleRevokePublicLink}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Revoke Link
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCreatePublicLink}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Generate Public Link
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                />
                {isSearching && <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {searchResults.map((u) => {
                    const alreadyShared = sharedUsers.some((s) => s.userId === u.id);
                    return (
                      <div key={u.id} className="flex items-center gap-3 px-3 py-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${u.avatarColor || 'bg-indigo-500'}`}>
                          {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                        </div>
                        <button
                          onClick={() => !alreadyShared && handleShareWithUser(u.id)}
                          disabled={alreadyShared}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                            alreadyShared
                              ? 'bg-slate-100 text-slate-400 cursor-default'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {alreadyShared ? 'Shared' : 'Share'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Already shared with */}
              {sharedUsers.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Shared with</p>
                  <div className="space-y-1">
                    {sharedUsers.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${u.avatarColor || 'bg-indigo-400'}`}>
                          {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveUser(u.userId)}
                          className="text-slate-300 hover:text-rose-500 transition-colors"
                          title="Remove access"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sharedUsers.length === 0 && searchResults.length === 0 && searchQuery.length < 2 && (
                <p className="text-xs text-slate-400 text-center py-4">Search for a person to share this meeting with.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

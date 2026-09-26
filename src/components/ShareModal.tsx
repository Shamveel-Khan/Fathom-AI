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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(1, 1, 2, 0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl border shadow-2xl w-full max-w-md overflow-hidden"
        style={{ background: '#0f1011', borderColor: '#23252a' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#23252a' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#f7f8f8' }}>Share Meeting</h2>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: '#62666d' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f7f8f8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#62666d')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: '#23252a' }}>
          {(['public', 'people'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors"
              style={{
                color: tab === t ? '#f7f8f8' : '#8a8f98',
                borderBottom: tab === t ? '2px solid #7170ff' : '2px solid transparent',
                background: tab === t ? 'rgba(113,112,255,0.05)' : 'transparent',
              }}
            >
              {t === 'public' ? <Link2 className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
              {t === 'public' ? 'Public Link' : 'Share with People'}
            </button>
          ))}
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#7170ff' }} />
            </div>
          ) : tab === 'public' ? (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed" style={{ color: '#8a8f98' }}>
                Anyone with the link can view this meeting. The real meeting ID is never exposed.
              </p>
              {publicToken ? (
                <>
                  <div
                    className="flex items-center gap-2 border rounded-xl px-3 py-2"
                    style={{ background: '#141516', borderColor: '#23252a' }}
                  >
                    <span
                      className="flex-1 text-xs truncate"
                      style={{ color: '#d0d6e0', fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {publicUrl}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 transition-colors"
                      style={{ color: '#828fff' }}
                      title="Copy link"
                    >
                      {copied ? <Check className="w-4 h-4" style={{ color: '#68cc58' }} /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={handleRevokePublicLink}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-medium transition-colors"
                    style={{ background: 'rgba(235,87,87,0.08)', borderColor: 'rgba(235,87,87,0.3)', color: '#eb5757' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Revoke Link
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCreatePublicLink}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
                  style={{ background: '#ffffff', color: '#08090a' }}
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
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#62666d' }} />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border rounded-lg focus:outline-none transition-colors"
                  style={{ background: '#1c1c1f', borderColor: '#34343a', color: '#f7f8f8' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
                />
                {isSearching && <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: '#7170ff' }} />}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border rounded-xl overflow-hidden divide-y" style={{ borderColor: '#23252a' }}>
                  {searchResults.map((u) => {
                    const alreadyShared = sharedUsers.some((s) => s.userId === u.id);
                    return (
                      <div key={u.id} className="flex items-center gap-3 px-3 py-2.5" style={{ background: '#141516', borderColor: '#23252a' }}>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${u.avatarColor || 'bg-indigo-500'}`}
                        >
                          {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: '#f7f8f8' }}>{u.name}</p>
                          <p className="text-[10px] truncate" style={{ color: '#8a8f98' }}>{u.email}</p>
                        </div>
                        <button
                          onClick={() => !alreadyShared && handleShareWithUser(u.id)}
                          disabled={alreadyShared}
                          className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors"
                          style={{
                            background: alreadyShared ? '#232326' : '#7170ff',
                            color: alreadyShared ? '#62666d' : '#ffffff',
                          }}
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
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: '#62666d', letterSpacing: '0.06em' }}
                  >
                    Shared with
                  </p>
                  <div className="space-y-1">
                    {sharedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg border"
                        style={{ background: '#141516', borderColor: '#23252a' }}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${u.avatarColor || 'bg-indigo-400'}`}
                        >
                          {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: '#f7f8f8' }}>{u.name}</p>
                          <p className="text-[10px] truncate" style={{ color: '#8a8f98' }}>{u.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveUser(u.userId)}
                          className="transition-colors"
                          style={{ color: '#62666d' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#eb5757')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#62666d')}
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
                <p className="text-xs text-center py-4" style={{ color: '#62666d' }}>
                  Search for a person to share this meeting with.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

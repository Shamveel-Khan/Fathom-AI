'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { AppNav } from '@/components/AppNav';
import { Scale, ArrowUpRight, Users, Calendar, Search } from 'lucide-react';
import Link from 'next/link';

const LOCAL_STORAGE_KEY = 'fathom_ai_api_key';
const LOCAL_STORAGE_BASE_URL = 'fathom_ai_base_url';
const LOCAL_STORAGE_MODEL = 'fathom_ai_model';

interface Decision {
  id: string;
  decision: string;
  rationale?: string;
  madeBy?: string;
  timestamp?: string;
  timestampSeconds?: number;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  participants: string[];
}

export default function DecisionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');

  useEffect(() => {
    try {
      setApiKey(localStorage.getItem(LOCAL_STORAGE_KEY) || '');
      setBaseUrl(localStorage.getItem(LOCAL_STORAGE_BASE_URL) || '');
      setModel(localStorage.getItem(LOCAL_STORAGE_MODEL) || 'gpt-4o-mini');
    } catch {}
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Single dedicated backend fetch
  const fetchDecisions = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch('/api/decisions');
      const data = await res.json();
      if (data.success && data.decisions) {
        setDecisions(data.decisions);
      }
    } catch (err) {
      console.error('Failed to fetch decisions:', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchDecisions();
  }, [user, fetchDecisions]);

  const handleSaveApiKey = (key: string, newBaseUrl?: string, newModel?: string) => {
    setApiKey(key);
    setBaseUrl(newBaseUrl || '');
    setModel(newModel || 'gpt-4o-mini');
    try {
      key ? localStorage.setItem(LOCAL_STORAGE_KEY, key) : localStorage.removeItem(LOCAL_STORAGE_KEY);
      newBaseUrl ? localStorage.setItem(LOCAL_STORAGE_BASE_URL, newBaseUrl) : localStorage.removeItem(LOCAL_STORAGE_BASE_URL);
      newModel ? localStorage.setItem(LOCAL_STORAGE_MODEL, newModel) : localStorage.removeItem(LOCAL_STORAGE_MODEL);
    } catch {}
  };

  const filteredDecisions = decisions.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.decision.toLowerCase().includes(q) ||
      (d.rationale && d.rationale.toLowerCase().includes(q)) ||
      (d.madeBy && d.madeBy.toLowerCase().includes(q)) ||
      d.meetingTitle.toLowerCase().includes(q)
    );
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08090a' }}>
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: '#23252a', borderTopColor: '#7170ff' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#08090a' }}>
      <AppNav apiKey={apiKey} onSaveApiKey={handleSaveApiKey} baseUrl={baseUrl} model={model} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold mb-1" style={{ color: '#f7f8f8', letterSpacing: '-0.012em' }}>
              Decisions Log
            </h1>
            <p className="text-sm" style={{ color: '#8a8f98' }}>
              Architectural and strategic decisions recorded across your team meetings.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#62666d' }} />
            <input
              type="text"
              placeholder="Search decisions…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none transition-colors"
              style={{
                background: '#0f1011',
                borderColor: '#23252a',
                color: '#f7f8f8',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#23252a')}
            />
          </div>
        </div>

        {/* Content */}
        {isFetching ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl border animate-pulse"
                style={{ background: '#0f1011', borderColor: '#23252a' }}
              />
            ))}
          </div>
        ) : filteredDecisions.length === 0 ? (
          <div
            className="text-center py-20 rounded-xl border border-dashed p-8"
            style={{ background: '#0f1011', borderColor: '#23252a' }}
          >
            <Scale className="w-10 h-10 mx-auto mb-3" style={{ color: '#3e3e44' }} />
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#f7f8f8' }}>No decisions found</h3>
            <p className="text-xs mb-4 max-w-sm mx-auto" style={{ color: '#8a8f98' }}>
              {searchQuery
                ? `No decisions matching "${searchQuery}".`
                : 'Decisions are automatically extracted when you run AI analysis on meetings.'}
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
              style={{ background: '#ffffff', color: '#08090a' }}
            >
              Go to Meetings
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDecisions.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-xl border transition-all duration-150 hover:border-[#3e3e44]"
                style={{ background: '#0f1011', borderColor: '#23252a' }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold leading-snug" style={{ color: '#f7f8f8' }}>
                    {item.decision}
                  </h3>
                  {item.madeBy && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded border shrink-0"
                      style={{
                        background: 'rgba(212,177,68,0.1)',
                        borderColor: 'rgba(212,177,68,0.3)',
                        color: '#d4b144',
                      }}
                    >
                      {item.madeBy}
                    </span>
                  )}
                </div>

                {item.rationale && (
                  <p
                    className="text-xs leading-relaxed p-3 rounded-lg border mb-3"
                    style={{ background: '#141516', borderColor: '#23252a', color: '#d0d6e0' }}
                  >
                    <strong className="font-semibold" style={{ color: '#f7f8f8' }}>Rationale: </strong>
                    {item.rationale}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t" style={{ borderColor: '#1c1c1f' }}>
                  <div className="flex items-center gap-3" style={{ color: '#8a8f98' }}>
                    <span className="flex items-center gap-1 text-[11px] font-mono">
                      <Calendar className="w-3 h-3" />
                      {item.meetingDate}
                    </span>
                    {item.participants.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Users className="w-3 h-3" />
                        {item.participants.slice(0, 3).join(', ')}
                        {item.participants.length > 3 && ` +${item.participants.length - 3}`}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/meetings/${item.meetingId}${item.timestampSeconds ? `?t=${item.timestampSeconds}` : ''}`}
                    className="inline-flex items-center gap-1 text-[11px] transition-colors group"
                    style={{ color: '#828fff' }}
                  >
                    <span>{item.meetingTitle}</span>
                    <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

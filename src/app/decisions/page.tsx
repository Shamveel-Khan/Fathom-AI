'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { AppNav } from '@/components/AppNav';
import { MeetingSummary } from '@/lib/schemas/meeting';
import { Scale, ArrowUpRight, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

const LOCAL_STORAGE_KEY = 'fathom_ai_api_key';
const LOCAL_STORAGE_BASE_URL = 'fathom_ai_base_url';
const LOCAL_STORAGE_MODEL = 'fathom_ai_model';

interface Decision {
  id: string;
  decision: string;
  rationale?: string;
  impact?: string;
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

  const fetchDecisions = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch('/api/meetings');
      const data = await res.json();
      if (data.success && data.meetings) {
        const allDecisions: Decision[] = [];
        for (const meeting of data.meetings as MeetingSummary[]) {
          if (meeting.hasAnalysis) {
            try {
              const mRes = await fetch(`/api/meetings/${meeting.id}`);
              const mData = await mRes.json();
              if (mData.success && mData.meeting?.analysis?.decisions) {
                for (const d of mData.meeting.analysis.decisions) {
                  allDecisions.push({
                    id: d.id || `${meeting.id}-${Math.random()}`,
                    decision: d.decision,
                    rationale: d.rationale,
                    impact: d.impact,
                    meetingId: meeting.id,
                    meetingTitle: meeting.title,
                    meetingDate: meeting.date,
                    participants: meeting.participants.map((p) => p.name),
                  });
                }
              }
            } catch {}
          }
        }
        setDecisions(allDecisions);
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

  const filtered = decisions.filter((d) => {
    const q = searchQuery.toLowerCase();
    return !q || d.decision.toLowerCase().includes(q) || d.meetingTitle.toLowerCase().includes(q);
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08090a' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#23252a', borderTopColor: '#7170ff' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#08090a' }}>
      <AppNav apiKey={apiKey} onSaveApiKey={handleSaveApiKey} baseUrl={baseUrl} model={model} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#f7f8f8', letterSpacing: '-0.012em' }}>
            Decisions Database
          </h1>
          <p className="text-sm" style={{ color: '#8a8f98' }}>
            Key architectural and strategic decisions logged across all meetings
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Scale className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#62666d' }} />
          <input
            type="text"
            placeholder="Search decisions…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-9 text-sm rounded-lg border focus:outline-none"
            style={{ background: '#1c1c1f', borderColor: '#34343a', color: '#f7f8f8' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
          />
        </div>

        {/* Summary count */}
        {!isFetching && (
          <p className="text-xs mb-4" style={{ color: '#62666d' }}>
            {filtered.length} decision{filtered.length !== 1 ? 's' : ''} logged
          </p>
        )}

        {/* Content */}
        {isFetching ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border p-5 animate-pulse" style={{ background: '#0f1011', borderColor: '#23252a' }}>
                <div className="h-4 w-3/4 rounded mb-3" style={{ background: '#232326' }} />
                <div className="h-3 w-full rounded mb-2" style={{ background: '#1c1c1f' }} />
                <div className="h-3 w-2/3 rounded" style={{ background: '#1c1c1f' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed p-16 text-center" style={{ borderColor: '#34343a' }}>
            <Scale className="w-10 h-10 mx-auto mb-3" style={{ color: '#3e3e44' }} />
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#f7f8f8' }}>No decisions logged</h3>
            <p className="text-xs" style={{ color: '#8a8f98' }}>
              {searchQuery ? `No results for "${searchQuery}".` : 'Analyze your meetings with AI to automatically log key decisions.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border p-5 transition-colors"
                style={{ background: '#0f1011', borderColor: '#23252a' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(212,177,68,0.1)' }}
                  >
                    <Scale className="w-4 h-4" style={{ color: '#d4b144' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug mb-2" style={{ color: '#f7f8f8' }}>
                      {d.decision}
                    </p>
                    {d.rationale && (
                      <p className="text-xs leading-relaxed mb-3" style={{ color: '#8a8f98' }}>{d.rationale}</p>
                    )}
                    {d.impact && (
                      <p
                        className="text-xs px-2 py-1 rounded border mb-3 inline-block"
                        style={{ color: '#d4b144', background: 'rgba(212,177,68,0.08)', borderColor: 'rgba(212,177,68,0.2)' }}
                      >
                        Impact: {d.impact}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className="inline-flex items-center gap-1 text-xs"
                        style={{ color: '#8a8f98', fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        <Calendar className="w-3 h-3" />
                        {d.meetingDate}
                      </span>
                      {d.participants.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#8a8f98' }}>
                          <Users className="w-3 h-3" />
                          {d.participants.slice(0, 3).join(', ')}
                          {d.participants.length > 3 ? ` +${d.participants.length - 3}` : ''}
                        </span>
                      )}
                      <Link
                        href={`/meetings/${d.meetingId}`}
                        className="inline-flex items-center gap-1 text-xs transition-colors"
                        style={{ color: '#8a8f98' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#828fff')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8f98')}
                      >
                        <ArrowUpRight className="w-3 h-3" />
                        {d.meetingTitle}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

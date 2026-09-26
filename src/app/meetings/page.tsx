'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { AppNav } from '@/components/AppNav';
import { MeetingCard } from '@/components/MeetingCard';
import { MeetingSummary } from '@/lib/schemas/meeting';
import { DashboardSkeleton } from '@/components/Skeletons';
import { ImportMeetingModal } from '@/components/ImportMeetingModal';
import { MEETING_TEMPLATES } from '@/lib/templates/definitions';
import {
  Search, Video, Upload, CheckCircle2, ArrowRight, X, LayoutGrid, List,
  Calendar, Clock, Users, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

const LOCAL_STORAGE_KEY = 'fathom_ai_api_key';
const LOCAL_STORAGE_BASE_URL = 'fathom_ai_base_url';
const LOCAL_STORAGE_MODEL = 'fathom_ai_model';

export default function MeetingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'dense'>('grid');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedNotice, setImportedNotice] = useState<{ id: string; title: string } | null>(null);
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

  const fetchMeetings = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch('/api/meetings');
      const data = await res.json();
      if (data.success) setMeetings(data.meetings);
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchMeetings();
  }, [user, fetchMeetings]);

  const handleImportSuccess = (newMeeting: unknown) => {
    const m = newMeeting as { id?: string; title?: string };
    if (m?.id && m?.title) setImportedNotice({ id: m.id, title: m.title });
    fetchMeetings();
  };

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

  const filteredMeetings = meetings.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = m.title.toLowerCase().includes(q) || m.participants.some((p) => p.name.toLowerCase().includes(q));
    const matchesTemplate = templateFilter === 'all' || m.template === templateFilter;
    return matchesSearch && matchesTemplate;
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

      {isFetching && meetings.length === 0 ? (
        <DashboardSkeleton />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold mb-1" style={{ color: '#f7f8f8', letterSpacing: '-0.012em' }}>
                Meetings Library
              </h1>
              <p className="text-sm" style={{ color: '#8a8f98' }}>
                {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} in your workspace
              </p>
            </div>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 self-start sm:self-auto"
              style={{ background: '#ffffff', color: '#08090a' }}
            >
              <Upload className="w-3.5 h-3.5" />
              Import Meeting
            </button>
          </div>

          {/* Import success banner */}
          {importedNotice && (
            <div
              className="mb-6 p-4 rounded-xl border flex items-center justify-between gap-3"
              style={{ background: '#0f1011', borderColor: 'rgba(39,166,68,0.3)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#27a644' }} />
                <div className="truncate">
                  <p className="text-xs font-semibold" style={{ color: '#f7f8f8' }}>Meeting imported!</p>
                  <p className="text-xs truncate" style={{ color: '#8a8f98' }}>{importedNotice.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/meetings/${importedNotice.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ color: '#828fff', background: '#18182f' }}
                >
                  Open <ArrowRight className="w-3 h-3" />
                </Link>
                <button onClick={() => setImportedNotice(null)} style={{ color: '#8a8f98' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Search + filters + view toggle */}
          <div className="space-y-3 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#62666d' }} />
                <input
                  type="text"
                  placeholder="Search meetings…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 h-9 text-sm rounded-lg border focus:outline-none"
                  style={{ background: '#1c1c1f', borderColor: '#34343a', color: '#f7f8f8' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
                />
              </div>
              {/* View toggle */}
              <div className="flex items-center gap-1 rounded-lg border p-1 ml-auto" style={{ background: '#0f1011', borderColor: '#23252a' }}>
                <button
                  onClick={() => setView('grid')}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ background: view === 'grid' ? '#232326' : 'transparent', color: view === 'grid' ? '#f7f8f8' : '#8a8f98' }}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('dense')}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ background: view === 'dense' ? '#232326' : 'transparent', color: view === 'dense' ? '#f7f8f8' : '#8a8f98' }}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Template pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setTemplateFilter('all')}
                className="px-3 py-1 rounded-lg text-xs font-medium border transition-all shrink-0"
                style={{
                  background: templateFilter === 'all' ? '#232326' : 'transparent',
                  color: templateFilter === 'all' ? '#f7f8f8' : '#8a8f98',
                  borderColor: templateFilter === 'all' ? '#34343a' : '#23252a',
                }}
              >
                All Templates
              </button>
              {Object.values(MEETING_TEMPLATES).map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setTemplateFilter(tpl.id)}
                  className="px-3 py-1 rounded-lg text-xs font-medium border transition-all shrink-0"
                  style={{
                    background: templateFilter === tpl.id ? '#232326' : 'transparent',
                    color: templateFilter === tpl.id ? '#f7f8f8' : '#8a8f98',
                    borderColor: templateFilter === tpl.id ? '#34343a' : '#23252a',
                  }}
                >
                  {tpl.badge}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {filteredMeetings.length === 0 ? (
            <div className="rounded-xl border border-dashed p-16 text-center" style={{ borderColor: '#34343a' }}>
              <Video className="w-10 h-10 mx-auto mb-3" style={{ color: '#3e3e44' }} />
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#f7f8f8' }}>No meetings found</h3>
              <p className="text-xs mb-4 max-w-sm mx-auto" style={{ color: '#8a8f98' }}>
                {searchQuery ? `No results for "${searchQuery}".` : 'Import a JSON meeting to get started.'}
              </p>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border"
                style={{ background: '#18182f', color: '#828fff', borderColor: 'rgba(113,112,255,0.3)' }}
              >
                <Upload className="w-3.5 h-3.5" /> Import JSON Meeting
              </button>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            /* Dense table view */
            <div className="rounded-xl border overflow-hidden" style={{ background: '#0f1011', borderColor: '#23252a' }}>
              <div
                className="grid gap-4 px-4 py-2.5 border-b text-[11px] font-medium uppercase tracking-wider"
                style={{ borderColor: '#23252a', color: '#62666d', letterSpacing: '0.06em', gridTemplateColumns: '1fr auto auto auto' }}
              >
                <span>Meeting</span>
                <span>Date</span>
                <span>Duration</span>
                <span>Status</span>
              </div>
              {filteredMeetings.map((meeting) => (
                <Link
                  key={meeting.id}
                  href={`/meetings/${meeting.id}`}
                  className="group flex items-center gap-4 px-4 py-3 border-b transition-colors"
                  style={{ borderColor: '#1c1c1f' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate transition-colors" style={{ color: '#d0d6e0' }}>
                      {meeting.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-3 h-3" style={{ color: '#62666d' }} />
                      <span className="text-xs" style={{ color: '#62666d' }}>{meeting.participants.length} participants</span>
                    </div>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: '#8a8f98', fontFamily: "'JetBrains Mono', monospace" }}>
                    {meeting.date}
                  </span>
                  <span className="text-xs shrink-0" style={{ color: '#8a8f98', fontFamily: "'JetBrains Mono', monospace" }}>
                    {meeting.durationMinutes}m
                  </span>
                  <div className="shrink-0">
                    {meeting.hasAnalysis ? (
                      <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#18182f', color: '#828fff' }}>
                        AI Ready
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(212,177,68,0.1)', color: '#d4b144' }}>
                        Pending
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#8a8f98' }} />
                </Link>
              ))}
            </div>
          )}
        </main>
      )}

      <ImportMeetingModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}

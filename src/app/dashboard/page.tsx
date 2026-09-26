'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { AppNav } from '@/components/AppNav';
import { MeetingCard } from '@/components/MeetingCard';
import { MeetingSummary } from '@/lib/schemas/meeting';
import { DashboardSkeleton } from '@/components/Skeletons';
import { MEETING_TEMPLATES } from '@/lib/templates/definitions';
import { Search, Sparkles, Video, CheckSquare, ShieldAlert, LayoutTemplate, Filter } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'fathom_ai_api_key';
const LOCAL_STORAGE_BASE_URL = 'fathom_ai_base_url';
const LOCAL_STORAGE_MODEL = 'fathom_ai_model';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardFilter, setDashboardFilter] = useState<'all' | 'mine' | 'shared'>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');

  // Load credentials from localStorage
  useEffect(() => {
    try {
      setApiKey(localStorage.getItem(LOCAL_STORAGE_KEY) || '');
      setBaseUrl(localStorage.getItem(LOCAL_STORAGE_BASE_URL) || '');
      setModel(localStorage.getItem(LOCAL_STORAGE_MODEL) || 'gpt-4o-mini');
    } catch {}
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
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
    const matchesSearch = (
      m.title.toLowerCase().includes(q) ||
      m.participants.some((p) => p.name.toLowerCase().includes(q))
    );
    const matchesTab =
      dashboardFilter === 'all' ||
      (dashboardFilter === 'mine' && !m.isShared) ||
      (dashboardFilter === 'shared' && m.isShared);

    const matchesTemplate =
      templateFilter === 'all' || m.template === templateFilter;

    return matchesSearch && matchesTab && matchesTemplate;
  });

  const analyzedCount = meetings.filter((m) => m.hasAnalysis).length;
  const reviewCount = meetings.filter((m) => m.hasReview).length;
  const totalActionItems = meetings.reduce((sum, m) => sum + m.actionItemsCount, 0);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav apiKey={apiKey} onSaveApiKey={handleSaveApiKey} baseUrl={baseUrl} model={model} />

      {isFetching && meetings.length === 0 ? (
        <DashboardSkeleton />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Greeting */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-0.5">
                Good to see you, {user.name.split(' ')[0]} 👋
              </h1>
              <p className="text-sm text-slate-500">Your executive meeting intelligence workspace.</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-1">
                <Video className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">Total Meetings</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{meetings.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="text-xs text-slate-500 font-medium">AI Intelligence</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {analyzedCount}
                <span className="text-xs font-normal text-slate-400 ml-1.5">({reviewCount} audited)</span>
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-1">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-slate-500 font-medium">Open Action Items</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{totalActionItems}</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-3 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search meetings, speakers, or topics…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all shadow-2xs"
                />
              </div>

              {/* Tab Selector */}
              <div className="flex items-center gap-1 bg-slate-200/60 rounded-xl p-1">
                {(['all', 'mine', 'shared'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setDashboardFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      dashboardFilter === f
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f === 'all' ? 'All Meetings' : f === 'mine' ? 'My Meetings' : 'Shared with Me'}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Template:
              </span>
              <button
                onClick={() => setTemplateFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors shrink-0 ${
                  templateFilter === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              {Object.values(MEETING_TEMPLATES).map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setTemplateFilter(tpl.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors shrink-0 ${
                    templateFilter === tpl.id
                      ? `${tpl.bgLight} ${tpl.color} border border-current font-semibold`
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tpl.badge}
                </button>
              ))}
            </div>
          </div>

          {/* Meetings Grid */}
          {filteredMeetings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <Video className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-900 mb-1">No meetings found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No meetings matching "${searchQuery}". Try adjusting your filters.`
                  : 'No meetings found in this view.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  );
}

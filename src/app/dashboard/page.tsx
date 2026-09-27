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
  Search,
  Sparkles,
  Video,
  CheckSquare,
  ShieldAlert,
  Upload,
  CheckCircle2,
  ArrowRight,
  X,
} from 'lucide-react';
import Link from 'next/link';

const LOCAL_STORAGE_KEY = 'fathom_ai_api_key';
const LOCAL_STORAGE_BASE_URL = 'fathom_ai_base_url';
const LOCAL_STORAGE_MODEL = 'fathom_ai_model';

const TEMPLATE_PILL_COLORS: Record<string, { activeBg: string; activeText: string; activeBorder: string }> = {
  general:   { activeBg: '#18182f', activeText: '#828fff', activeBorder: 'rgba(113,112,255,0.4)' },
  sales:     { activeBg: 'rgba(104,204,88,0.1)', activeText: '#68cc58', activeBorder: 'rgba(104,204,88,0.4)' },
  project:   { activeBg: 'rgba(212,177,68,0.1)', activeText: '#d4b144', activeBorder: 'rgba(212,177,68,0.4)' },
  interview: { activeBg: 'rgba(122,127,173,0.1)', activeText: '#7a7fad', activeBorder: 'rgba(122,127,173,0.4)' },
  one_on_one:{ activeBg: 'rgba(189,194,255,0.1)', activeText: '#bdc2ff', activeBorder: 'rgba(189,194,255,0.4)' },
};

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    analyzedCount: 0,
    reviewCount: 0,
    totalActionItems: 0,
    completedActionItems: 0,
  });
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardFilter, setDashboardFilter] = useState<'all' | 'mine' | 'shared'>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
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

  // Single dedicated dashboard fetch
  const fetchDashboardData = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (data.success) {
        setMeetings(data.meetings || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user, fetchDashboardData]);

  const handleImportSuccess = (newMeeting: unknown) => {
    const m = newMeeting as { id?: string; title?: string };
    if (m?.id && m?.title) setImportedNotice({ id: m.id, title: m.title });
    fetchDashboardData();
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
    const matchesSearch =
      m.title.toLowerCase().includes(q) ||
      m.participants.some((p) => p.name.toLowerCase().includes(q));
    const matchesTab =
      dashboardFilter === 'all' ||
      (dashboardFilter === 'mine' && !m.isShared) ||
      (dashboardFilter === 'shared' && m.isShared);
    const matchesTemplate = templateFilter === 'all' || m.template === templateFilter;
    return matchesSearch && matchesTab && matchesTemplate;
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

      {isFetching && meetings.length === 0 ? (
        <DashboardSkeleton />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold mb-1" style={{ color: '#f7f8f8', letterSpacing: '-0.012em' }}>
                Good to see you, {user.name.split(' ')[0]}
              </h1>
              <p className="text-sm" style={{ color: '#8a8f98' }}>Your executive meeting intelligence workspace.</p>
            </div>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
              style={{ background: '#ffffff', color: '#08090a' }}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Meeting</span>
            </button>
          </div>

          {/* Import Notification Banner */}
          {importedNotice && (
            <div
              className="mb-6 p-4 rounded-xl border flex items-center justify-between gap-3 animate-in fade-in duration-200"
              style={{ background: '#0f1011', borderColor: 'rgba(39,166,68,0.3)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#27a644' }} />
                <p className="text-xs truncate" style={{ color: '#d0d6e0' }}>
                  Meeting <strong style={{ color: '#f7f8f8' }}>&ldquo;{importedNotice.title}&rdquo;</strong> successfully imported!
                </p>
                <Link
                  href={`/meetings/${importedNotice.id}`}
                  className="text-xs font-semibold flex items-center gap-1 shrink-0 ml-2"
                  style={{ color: '#828fff' }}
                >
                  Open Meeting <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <button
                onClick={() => setImportedNotice(null)}
                className="transition-colors p-1"
                style={{ color: '#8a8f98' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f7f8f8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8f98')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              {
                label: 'Total Meetings',
                value: stats.totalMeetings,
                icon: Video,
                iconColor: '#7170ff',
                iconBg: '#18182f',
              },
              {
                label: 'AI Analyzed',
                value: stats.analyzedCount,
                icon: Sparkles,
                iconColor: '#68cc58',
                iconBg: 'rgba(104,204,88,0.1)',
              },
              {
                label: 'AI Audited',
                value: stats.reviewCount,
                icon: ShieldAlert,
                iconColor: '#7a7fad',
                iconBg: 'rgba(122,127,173,0.1)',
              },
              {
                label: 'Open Actions',
                value: Math.max(0, stats.totalActionItems - stats.completedActionItems),
                icon: CheckSquare,
                iconColor: '#d4b144',
                iconBg: 'rgba(212,177,68,0.1)',
              },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border p-4 flex items-center justify-between gap-3 transition-colors hover:border-[#3e3e44]"
                  style={{ background: '#0f1011', borderColor: '#23252a' }}
                >
                  <div>
                    <p
                      className="text-[11px] font-semibold uppercase tracking-wider mb-1"
                      style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
                    >
                      {stat.label}
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: '#f7f8f8', fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: stat.iconBg, color: stat.iconColor }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search & Filter Bar */}
          <div
            className="rounded-xl border p-3 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
            style={{ background: '#0f1011', borderColor: '#23252a' }}
          >
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#62666d' }} />
              <input
                type="text"
                placeholder="Search meetings by title or attendee…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none transition-colors"
                style={{
                  background: '#1c1c1f',
                  borderColor: '#34343a',
                  color: '#f7f8f8',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
              />
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg border shrink-0" style={{ background: '#141516', borderColor: '#23252a' }}>
              {(['all', 'mine', 'shared'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDashboardFilter(tab)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors"
                  style={{
                    background: dashboardFilter === tab ? '#232326' : 'transparent',
                    color: dashboardFilter === tab ? '#f7f8f8' : '#8a8f98',
                  }}
                >
                  {tab === 'mine' ? 'My Meetings' : tab === 'shared' ? 'Shared' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Template Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-4 text-xs">
            <button
              onClick={() => setTemplateFilter('all')}
              className="px-3 py-1.5 rounded-lg font-medium border transition-colors shrink-0"
              style={{
                background: templateFilter === 'all' ? '#232326' : 'transparent',
                borderColor: templateFilter === 'all' ? '#34343a' : '#23252a',
                color: templateFilter === 'all' ? '#f7f8f8' : '#8a8f98',
              }}
            >
              All Types
            </button>
            {Object.entries(MEETING_TEMPLATES).map(([key, tpl]) => {
              const isSelected = templateFilter === key;
              const pillTheme = TEMPLATE_PILL_COLORS[key] || { activeBg: '#232326', activeText: '#f7f8f8', activeBorder: '#34343a' };
              return (
                <button
                  key={key}
                  onClick={() => setTemplateFilter(key)}
                  className="px-3 py-1.5 rounded-lg font-medium border transition-colors shrink-0"
                  style={{
                    background: isSelected ? pillTheme.activeBg : 'transparent',
                    borderColor: isSelected ? pillTheme.activeBorder : '#23252a',
                    color: isSelected ? pillTheme.activeText : '#8a8f98',
                  }}
                >
                  {tpl.name}
                </button>
              );
            })}
          </div>

          {/* Meeting Grid */}
          {filteredMeetings.length === 0 ? (
            <div
              className="text-center py-20 rounded-xl border border-dashed p-8"
              style={{ background: '#0f1011', borderColor: '#23252a' }}
            >
              <Video className="w-10 h-10 mx-auto mb-3" style={{ color: '#3e3e44' }} />
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#f7f8f8' }}>No meetings found</h3>
              <p className="text-xs mb-4 max-w-sm mx-auto" style={{ color: '#8a8f98' }}>
                {searchQuery || templateFilter !== 'all' || dashboardFilter !== 'all'
                  ? 'Try clearing your filters or search query.'
                  : 'Import your first meeting JSON file to extract executive intelligence and verifiable action items.'}
              </p>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                style={{ background: '#ffffff', color: '#08090a' }}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Meeting</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </main>
      )}

      {/* Import Modal */}
      <ImportMeetingModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { AppNav } from '@/components/AppNav';
import { MeetingSummary } from '@/lib/schemas/meeting';
import { CheckSquare, User, Calendar, ArrowUpRight, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

const LOCAL_STORAGE_KEY = 'fathom_ai_api_key';
const LOCAL_STORAGE_BASE_URL = 'fathom_ai_base_url';
const LOCAL_STORAGE_MODEL = 'fathom_ai_model';

interface ActionItem {
  id: string;
  task: string;
  assignee?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
}

export default function ActionItemsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'done'>('all');
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

  const fetchActionItems = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch('/api/meetings');
      const data = await res.json();
      if (data.success && data.meetings) {
        const allItems: ActionItem[] = [];
        for (const meeting of data.meetings as MeetingSummary[]) {
          if (meeting.hasAnalysis) {
            try {
              const mRes = await fetch(`/api/meetings/${meeting.id}`);
              const mData = await mRes.json();
              if (mData.success && mData.meeting?.analysis?.actionItems) {
                for (const item of mData.meeting.analysis.actionItems) {
                  allItems.push({
                    id: item.id || `${meeting.id}-${Math.random()}`,
                    task: item.task,
                    assignee: item.assignee,
                    dueDate: item.dueDate,
                    priority: item.priority,
                    status: item.status || 'pending',
                    meetingId: meeting.id,
                    meetingTitle: meeting.title,
                    meetingDate: meeting.date,
                  });
                }
              }
            } catch {}
          }
        }
        setActionItems(allItems);
      }
    } catch (err) {
      console.error('Failed to fetch action items:', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchActionItems();
  }, [user, fetchActionItems]);

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

  const filtered = actionItems.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  const getPriorityStyle = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return { color: '#eb5757', bg: 'rgba(235,87,87,0.1)' };
      case 'medium': return { color: '#d4b144', bg: 'rgba(212,177,68,0.1)' };
      default: return { color: '#8a8f98', bg: 'rgba(255,255,255,0.05)' };
    }
  };

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
            Action Items
          </h1>
          <p className="text-sm" style={{ color: '#8a8f98' }}>
            All commitments and tasks extracted across your meetings
          </p>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 rounded-lg border p-1 mb-6 w-fit" style={{ background: '#0f1011', borderColor: '#23252a' }}>
          {([
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'done', label: 'Done' },
          ] as const).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: statusFilter === tab.value ? '#232326' : 'transparent',
                color: statusFilter === tab.value ? '#f7f8f8' : '#8a8f98',
                border: statusFilter === tab.value ? '1px solid #34343a' : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isFetching ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border p-4 animate-pulse" style={{ background: '#0f1011', borderColor: '#23252a' }}>
                <div className="h-4 w-3/4 rounded mb-3" style={{ background: '#232326' }} />
                <div className="flex gap-3">
                  <div className="h-3 w-20 rounded" style={{ background: '#1c1c1f' }} />
                  <div className="h-3 w-24 rounded" style={{ background: '#1c1c1f' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed p-16 text-center" style={{ borderColor: '#34343a' }}>
            <CheckSquare className="w-10 h-10 mx-auto mb-3" style={{ color: '#3e3e44' }} />
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#f7f8f8' }}>No action items found</h3>
            <p className="text-xs" style={{ color: '#8a8f98' }}>
              Analyze your meetings with AI to extract action items automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const pStyle = getPriorityStyle(item.priority);
              const isDone = item.status === 'done';
              return (
                <div
                  key={item.id}
                  className="rounded-xl border p-4 transition-colors"
                  style={{ background: '#0f1011', borderColor: '#23252a' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5" style={{ color: '#27a644' }} />
                      ) : (
                        <Circle className="w-5 h-5" style={{ color: '#3e3e44' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium leading-snug mb-2"
                        style={{ color: isDone ? '#62666d' : '#d0d6e0', textDecoration: isDone ? 'line-through' : 'none' }}
                      >
                        {item.task}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        {item.assignee && (
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ background: '#18182f', color: '#828fff' }}
                          >
                            <User className="w-3 h-3" />
                            {item.assignee}
                          </span>
                        )}
                        {item.priority && (
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded"
                            style={{ background: pStyle.bg, color: pStyle.color }}
                          >
                            {item.priority}
                          </span>
                        )}
                        {item.dueDate && (
                          <span
                            className="inline-flex items-center gap-1 text-xs"
                            style={{ color: '#d4b144', fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            <Calendar className="w-3 h-3" />
                            {item.dueDate}
                          </span>
                        )}
                        <Link
                          href={`/meetings/${item.meetingId}`}
                          className="inline-flex items-center gap-1 text-xs transition-colors"
                          style={{ color: '#8a8f98' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#828fff')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8f98')}
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          {item.meetingTitle}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

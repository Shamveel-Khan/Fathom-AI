'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { AppNav } from '@/components/AppNav';
import { CheckSquare, User, Calendar, ArrowUpRight, CheckCircle2, Circle, Clock } from 'lucide-react';
import Link from 'next/link';

const LOCAL_STORAGE_KEY = 'fathom_ai_api_key';
const LOCAL_STORAGE_BASE_URL = 'fathom_ai_base_url';
const LOCAL_STORAGE_MODEL = 'fathom_ai_model';

interface ActionItem {
  id: string;
  task: string;
  assignee?: string;
  dueDate?: string;
  context?: string;
  priority?: string;
  completed: boolean;
  status: 'pending' | 'in_progress' | 'done';
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
}

export default function ActionItemsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'done'>('all');
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
  const fetchActionItems = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch('/api/action-items');
      const data = await res.json();
      if (data.success && data.actionItems) {
        setActionItems(data.actionItems);
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

  const handleToggleStatus = async (item: ActionItem) => {
    const nextCompleted = !item.completed;
    // Optimistic UI update
    setActionItems((prev) =>
      prev.map((a) =>
        a.id === item.id
          ? { ...a, completed: nextCompleted, status: nextCompleted ? 'done' : 'pending' }
          : a
      )
    );

    try {
      await fetch(`/api/meetings/${item.meetingId}/action-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: nextCompleted }),
      });
    } catch (err) {
      console.error('Failed to toggle status:', err);
      // Revert on error
      setActionItems((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, completed: item.completed, status: item.status } : a))
      );
    }
  };

  const filteredItems = actionItems.filter((item) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'done') return item.completed;
    if (statusFilter === 'pending') return !item.completed;
    return true;
  });

  const pendingCount = actionItems.filter((a) => !a.completed).length;
  const doneCount = actionItems.filter((a) => a.completed).length;

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
              Action Items
            </h1>
            <p className="text-sm" style={{ color: '#8a8f98' }}>
              Cross-meeting verifiable deliverables, assignees, and deadlines.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg border" style={{ background: '#0f1011', borderColor: '#23252a' }}>
            <button
              onClick={() => setStatusFilter('all')}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{
                background: statusFilter === 'all' ? '#232326' : 'transparent',
                color: statusFilter === 'all' ? '#f7f8f8' : '#8a8f98',
              }}
            >
              All ({actionItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{
                background: statusFilter === 'pending' ? '#232326' : 'transparent',
                color: statusFilter === 'pending' ? '#f7f8f8' : '#8a8f98',
              }}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('done')}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{
                background: statusFilter === 'done' ? '#232326' : 'transparent',
                color: statusFilter === 'done' ? '#f7f8f8' : '#8a8f98',
              }}
            >
              Done ({doneCount})
            </button>
          </div>
        </div>

        {/* Content */}
        {isFetching ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl border animate-pulse"
                style={{ background: '#0f1011', borderColor: '#23252a' }}
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div
            className="text-center py-20 rounded-xl border border-dashed p-8"
            style={{ background: '#0f1011', borderColor: '#23252a' }}
          >
            <CheckSquare className="w-10 h-10 mx-auto mb-3" style={{ color: '#3e3e44' }} />
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#f7f8f8' }}>No action items found</h3>
            <p className="text-xs mb-4 max-w-sm mx-auto" style={{ color: '#8a8f98' }}>
              {statusFilter !== 'all'
                ? `No ${statusFilter} items in your meetings.`
                : 'Action items are automatically extracted when you analyze your recorded or imported meetings.'}
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
          <div className="space-y-2.5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border flex items-start gap-3.5 transition-all duration-150 hover:border-[#3e3e44]"
                style={{
                  background: '#0f1011',
                  borderColor: '#23252a',
                  opacity: item.completed ? 0.65 : 1,
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleStatus(item)}
                  className="mt-0.5 shrink-0 transition-transform active:scale-90"
                  title={item.completed ? 'Mark pending' : 'Mark done'}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#27a644' }} />
                  ) : (
                    <Circle className="w-5 h-5" style={{ color: '#62666d' }} />
                  )}
                </button>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p
                      className="text-sm font-medium leading-snug"
                      style={{
                        color: item.completed ? '#8a8f98' : '#f7f8f8',
                        textDecoration: item.completed ? 'line-through' : 'none',
                      }}
                    >
                      {item.task}
                    </p>
                  </div>

                  {item.context && (
                    <p className="text-xs italic mb-2 leading-relaxed" style={{ color: '#8a8f98' }}>
                      &ldquo;{item.context}&rdquo;
                    </p>
                  )}

                  {/* Metadata & source meeting */}
                  <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                    {item.assignee && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border"
                        style={{ background: '#18182f', borderColor: 'rgba(113,112,255,0.2)', color: '#828fff' }}
                      >
                        <User className="w-3 h-3" />
                        {item.assignee}
                      </span>
                    )}

                    {item.dueDate && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border"
                        style={{ background: 'rgba(212,177,68,0.1)', borderColor: 'rgba(212,177,68,0.2)', color: '#d4b144' }}
                      >
                        <Clock className="w-3 h-3" />
                        {item.dueDate}
                      </span>
                    )}

                    <Link
                      href={`/meetings/${item.meetingId}`}
                      className="inline-flex items-center gap-1 text-[11px] transition-colors ml-auto group"
                      style={{ color: '#8a8f98' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#828fff')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8f98')}
                    >
                      <span className="truncate max-w-[200px]">{item.meetingTitle}</span>
                      <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
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

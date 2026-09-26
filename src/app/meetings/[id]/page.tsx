'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { AppNav } from '@/components/AppNav';
import { TranscriptViewer } from '@/components/TranscriptViewer';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { Meeting } from '@/lib/schemas/meeting';
import { MeetingAnalysis } from '@/lib/schemas/analysis';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Sparkles,
  RefreshCw,
  Play,
  AlertCircle,
  Key,
  X,
} from 'lucide-react';
import Link from 'next/link';

const LOCAL_STORAGE_KEY = 'fathom_ai_api_key';
const LOCAL_STORAGE_BASE_URL = 'fathom_ai_base_url';
const LOCAL_STORAGE_MODEL = 'fathom_ai_model';

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [highlightedTimestamp, setHighlightedTimestamp] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');

  // Load credentials
  useEffect(() => {
    try {
      setApiKey(localStorage.getItem(LOCAL_STORAGE_KEY) || '');
      setBaseUrl(localStorage.getItem(LOCAL_STORAGE_BASE_URL) || '');
      setModel(localStorage.getItem(LOCAL_STORAGE_MODEL) || 'gpt-4o-mini');
    } catch {}
  }, []);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Fetch meeting
  const fetchMeeting = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}`);
      const data = await res.json();
      if (data.success) {
        setMeeting(data.meeting);
      } else {
        setError({ message: data.error || 'Meeting not found.' });
      }
    } catch {
      setError({ message: 'Failed to load meeting.' });
    } finally {
      setIsFetching(false);
    }
  }, [meetingId]);

  useEffect(() => {
    if (user) fetchMeeting();
  }, [user, fetchMeeting]);

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

  const handleRunAnalysis = async (useMock = false) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-api-key'] = apiKey;
      if (baseUrl) headers['x-base-url'] = baseUrl;

      const res = await fetch(`/api/meetings/${meetingId}/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ useMock, model }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const msg = typeof data.error === 'object' ? data.error?.message : data.error;
        throw new Error(msg || 'Analysis failed.');
      }
      // Update meeting with persisted analysis
      setMeeting(data.meeting);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      const isMissingKey = msg.includes('No OpenAI API key') || msg.includes('NO_API_KEY');
      setError({ code: isMissingKey ? 'NO_API_KEY' : 'ANALYSIS_ERROR', message: msg });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectTimestamp = (timestamp: string) => {
    setHighlightedTimestamp(timestamp);
    if (!meeting) return;
    const utterance = meeting.transcript.find((u) => u.timestamp === timestamp);
    if (utterance) {
      document.getElementById(`transcript-${utterance.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppNav apiKey={apiKey} onSaveApiKey={handleSaveApiKey} baseUrl={baseUrl} model={model} />

      {/* Meeting Sub-Header */}
      <div className="border-b border-slate-200 bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Meetings
          </Link>

          {isFetching ? (
            <div className="space-y-2">
              <div className="h-6 w-80 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-56 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : meeting ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{meeting.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> {meeting.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {meeting.durationMinutes}m
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> {meeting.participants.length} participants
                  </span>
                  {meeting.analysis?.analyzedAt && (
                    <span className="text-indigo-600 font-medium">
                      AI analyzed {new Date(meeting.analysis.analyzedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRunAnalysis(true)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <Play className="w-3 h-3 text-indigo-600" />
                  Instant Demo
                </button>
                <button
                  onClick={() => handleRunAnalysis(false)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {meeting.analysis ? 'Re-generate' : 'Generate AI Summary'}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4">
        {/* Error Banner */}
        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start justify-between gap-3 text-rose-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Analysis Notice</p>
                <p className="text-xs text-rose-700 mt-0.5">{error.message}</p>
                {error.code === 'NO_API_KEY' && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleRunAnalysis(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
                    >
                      <Key className="w-3.5 h-3.5" />
                      Try Instant Demo
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2-Column Workspace */}
        {meeting && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[620px] pb-8">
            <div className="lg:col-span-5 h-[650px] lg:h-[calc(100vh-260px)] min-h-[500px]">
              <TranscriptViewer
                transcript={meeting.transcript}
                participants={meeting.participants}
                highlightedTimestamp={highlightedTimestamp}
              />
            </div>
            <div className="lg:col-span-7 h-[650px] lg:h-[calc(100vh-260px)] min-h-[500px]">
              <AnalysisPanel
                analysis={meeting.analysis ?? null}
                isLoading={isAnalyzing}
                onSelectTimestamp={handleSelectTimestamp}
                onTriggerAnalyze={() => handleRunAnalysis(false)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

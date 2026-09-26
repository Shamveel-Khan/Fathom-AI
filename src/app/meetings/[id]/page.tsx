'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { AppNav } from '@/components/AppNav';
import { MeetingPlayer } from '@/components/MeetingPlayer';
import { MeetingTimeline } from '@/components/MeetingTimeline';
import { TranscriptViewer } from '@/components/TranscriptViewer';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { HighlightModal } from '@/components/HighlightModal';
import { ShareModal } from '@/components/ShareModal';
import { ExportModal } from '@/components/ExportModal';
import { MeetingDetailSkeleton } from '@/components/Skeletons';
import { getTemplateDefinition } from '@/lib/templates/definitions';
import { Meeting, TranscriptUtterance, MeetingHighlight } from '@/lib/schemas/meeting';
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
  Highlighter,
  Share2,
  Download,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

const LOCAL_STORAGE_KEY = 'fathom_ai_api_key';
const LOCAL_STORAGE_BASE_URL = 'fathom_ai_base_url';
const LOCAL_STORAGE_MODEL = 'fathom_ai_model';

function MeetingDetailPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [highlightedTimestamp, setHighlightedTimestamp] = useState<string | null>(null);

  // Playback state
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Deep link ?t= parameter on mount
  const initialT = searchParams?.get('t');
  useEffect(() => {
    if (initialT) {
      const sec = parseInt(initialT, 10);
      if (!isNaN(sec) && sec >= 0) {
        setCurrentTimeSeconds(sec);
      }
    }
  }, [initialT]);

  // Modal states
  const [isHighlightModalOpen, setIsHighlightModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [selectedSnippet, setSelectedSnippet] = useState<{
    quote: string;
    speaker: string;
    timestamp: string;
  } | null>(null);

  // BYOK Credentials
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');

  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Simulated playback loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 1000 / playbackSpeed;
      playbackTimerRef.current = setInterval(() => {
        setCurrentTimeSeconds((prev) => {
          const maxSeconds = (meeting?.durationMinutes || 30) * 60;
          if (prev >= maxSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
    }

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, meeting?.durationMinutes]);

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

  const handleSeek = (seconds: number) => {
    setCurrentTimeSeconds(seconds);
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
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

  const handleHighlightSnippet = (utterance: TranscriptUtterance) => {
    setSelectedSnippet({
      quote: utterance.text,
      speaker: utterance.speaker,
      timestamp: utterance.timestamp,
    });
    setIsHighlightModalOpen(true);
  };

  const handleSaveCustomHighlight = async (highlight: MeetingHighlight) => {
    const res = await fetch(`/api/meetings/${meetingId}/highlights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(highlight),
    });
    const data = await res.json();
    if (data.success) {
      // Re-fetch meeting to refresh highlights list
      await fetchMeeting();
    }
  };

  const handleDeleteHighlight = async (highlightId: string) => {
    const res = await fetch(`/api/meetings/${meetingId}/highlights?highlightId=${highlightId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (data.success) {
      await fetchMeeting();
    }
  };

  const handleToggleActionItem = async (actionId: string, completed: boolean) => {
    await fetch(`/api/meetings/${meetingId}/action-items/${actionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
  };

  const handleUpdateActionItem = async (
    actionId: string,
    updates: { completed?: boolean; assignee?: string; dueDate?: string }
  ) => {
    await fetch(`/api/meetings/${meetingId}/action-items/${actionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  };

  const handleRunReview = async () => {
    if (!meeting) return;
    setIsReviewLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-api-key': apiKey } : {}),
          ...(baseUrl ? { 'x-base-url': baseUrl } : {}),
        },
        body: JSON.stringify({ model, useMock: false }),
      });
      const data = await res.json();
      if (data.success && data.review) {
        setMeeting((prev) => (prev ? { ...prev, review: data.review } : prev));
      }
    } catch (err) {
      console.error('Failed to run AI review:', err);
    } finally {
      setIsReviewLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isFetching && !meeting) {
    return <MeetingDetailSkeleton />;
  }

  const tpl = getTemplateDefinition(meeting?.template);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppNav apiKey={apiKey} onSaveApiKey={handleSaveApiKey} baseUrl={baseUrl} model={model} />

      {/* Meeting Header */}
      <div className="border-b border-slate-200 bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Meetings
          </Link>

          {meeting ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900">{meeting.title}</h1>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tpl.bgLight} ${tpl.color} ${tpl.borderLight}`}>
                    {tpl.badge}
                  </span>
                </div>
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

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                  title="Export report, transcript, or markdown"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedSnippet({
                      quote: meeting.transcript[0]?.text || '',
                      speaker: meeting.transcript[0]?.speaker || 'Speaker',
                      timestamp: '00:00',
                    });
                    setIsHighlightModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span>Highlight</span>
                </button>

                {meeting.isOwner !== false && (
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                )}

                <button
                  onClick={() => handleRunAnalysis(true)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <Play className="w-3 h-3 text-indigo-600" />
                  <span>Demo Mode</span>
                </button>

                <button
                  onClick={() => handleRunAnalysis(false)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{meeting.analysis ? 'Re-analyze' : 'Analyze AI'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
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

        {meeting && (
          <>
            {/* Top Row: Video Player & Visual Timeline */}
            <div className="space-y-4">
              <MeetingPlayer
                durationMinutes={meeting.durationMinutes}
                participants={meeting.participants}
                transcript={meeting.transcript}
                currentTimeSeconds={currentTimeSeconds}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                onTogglePlay={handleTogglePlay}
                onSeek={handleSeek}
                onChangeSpeed={setPlaybackSpeed}
              />

              <MeetingTimeline
                durationMinutes={meeting.durationMinutes}
                participants={meeting.participants}
                transcript={meeting.transcript}
                highlights={meeting.analysis?.highlights || []}
                currentTimeSeconds={currentTimeSeconds}
                onSeek={handleSeek}
              />
            </div>

            {/* Bottom Row: 2-Column Split (Transcript + AI Intelligence) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[620px] pb-8">
              <div className="lg:col-span-5 h-[650px] lg:h-[calc(100vh-280px)] min-h-[500px]">
                <TranscriptViewer
                  transcript={meeting.transcript}
                  participants={meeting.participants}
                  highlightedTimestamp={highlightedTimestamp}
                  currentTimeSeconds={currentTimeSeconds}
                  onSeek={handleSeek}
                  onHighlightSnippet={handleHighlightSnippet}
                />
              </div>
              <div className="lg:col-span-7 h-[650px] lg:h-[calc(100vh-280px)] min-h-[500px]">
                <AnalysisPanel
                  analysis={meeting.analysis ?? null}
                  review={meeting.review ?? null}
                  isLoading={isAnalyzing}
                  isReviewLoading={isReviewLoading}
                  isOwner={meeting.isOwner !== false}
                  onSelectTimestamp={handleSelectTimestamp}
                  onSeek={handleSeek}
                  onTriggerAnalyze={() => handleRunAnalysis(false)}
                  onTriggerReview={handleRunReview}
                  onOpenExportModal={() => setIsExportModalOpen(true)}
                  onToggleActionItem={handleToggleActionItem}
                  onUpdateActionItem={handleUpdateActionItem}
                  onDeleteHighlight={handleDeleteHighlight}
                  onOpenCreateHighlight={() => {
                    setSelectedSnippet({
                      quote: meeting.transcript[0]?.text || '',
                      speaker: meeting.transcript[0]?.speaker || 'Speaker',
                      timestamp: '00:00',
                    });
                    setIsHighlightModalOpen(true);
                  }}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Custom Highlight Creation Modal */}
      <HighlightModal
        isOpen={isHighlightModalOpen}
        onClose={() => {
          setIsHighlightModalOpen(false);
          setSelectedSnippet(null);
        }}
        initialQuote={selectedSnippet?.quote || ''}
        initialSpeaker={selectedSnippet?.speaker || ''}
        initialTimestamp={selectedSnippet?.timestamp || '00:00'}
        onSaveHighlight={handleSaveCustomHighlight}
      />

      {/* Share Modal */}
      <ShareModal
        meetingId={meetingId}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Export Modal */}
      {meeting && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          meeting={meeting}
        />
      )}
    </div>
  );
}

export default function MeetingDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <MeetingDetailPageContent />
    </Suspense>
  );
}

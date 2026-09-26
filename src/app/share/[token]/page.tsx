'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Meeting, TranscriptUtterance } from '@/lib/schemas/meeting';
import { MeetingPlayer } from '@/components/MeetingPlayer';
import { MeetingTimeline } from '@/components/MeetingTimeline';
import { TranscriptViewer } from '@/components/TranscriptViewer';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { ExportModal } from '@/components/ExportModal';
import { MeetingDetailSkeleton } from '@/components/Skeletons';
import { getTemplateDefinition } from '@/lib/templates/definitions';
import {
  Sparkles,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  Download,
  Share2,
} from 'lucide-react';
import Link from 'next/link';

function PublicShareContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Playback state
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [highlightedTimestamp, setHighlightedTimestamp] = useState<string | null>(null);

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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

  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/share/${token}`);
        const data = await res.json();
        if (data.success && data.meeting) {
          // Provide a sanitized client-side ID for local UI operations without revealing real DB ID
          setMeeting({
            ...data.meeting,
            id: `shared-${token.slice(0, 8)}`,
            isOwner: false,
            isShared: true,
          });
        } else {
          setError(data.error || 'This share link is invalid or has been revoked.');
        }
      } catch {
        setError('Failed to load shared meeting.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [token]);

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 1000 / playbackSpeed;
      playbackTimerRef.current = setInterval(() => {
        setCurrentTimeSeconds((prev) => {
          const maxSecs = (meeting?.durationMinutes || 30) * 60;
          if (prev >= maxSecs) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    }
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, meeting?.durationMinutes]);

  const handleTogglePlay = () => setIsPlaying(!isPlaying);
  const handleSeek = (seconds: number) => setCurrentTimeSeconds(seconds);

  const handleSelectTimestamp = (timestamp: string) => {
    setHighlightedTimestamp(timestamp);
    const utterance = meeting?.transcript.find((u) => u.timestamp === timestamp);
    if (utterance && utterance.timestampSeconds !== undefined) {
      setCurrentTimeSeconds(utterance.timestampSeconds);
    }
  };

  if (isLoading) {
    return <MeetingDetailSkeleton />;
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 mb-1">Shared Link Unavailable</h1>
            <p className="text-xs text-slate-500">{error || 'This meeting link has expired or been revoked by the owner.'}</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Sign in to Fathom
          </Link>
        </div>
      </div>
    );
  }

  const tpl = getTemplateDefinition(meeting.template);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Public Share Minimal Nav */}
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-xs shadow-xs">
              F
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">Fathom</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <Share2 className="w-3 h-3 text-indigo-500" />
              Shared Meeting View
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Try Fathom Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Meeting Header */}
      <div className="border-b border-slate-200 bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{meeting.title}</h1>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tpl.bgLight} ${tpl.color} ${tpl.borderLight}`}>
                  {tpl.badge}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {meeting.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {meeting.durationMinutes}m
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> {meeting.participants.length} participants
                </span>
              </div>
            </div>

            {/* Participants avatars */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {meeting.participants.map((p, i) => (
                  <div
                    key={i}
                    title={`${p.name}${p.role ? ` (${p.role})` : ''}`}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white shadow-2xs ${
                      p.avatarColor || 'bg-slate-500'
                    }`}
                  >
                    {p.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                ))}
              </div>
              <span className="text-xs text-slate-500 font-medium ml-1">
                {meeting.participants.map((p) => p.name.split(' ')[0]).join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Top: Video Player & Timeline scrubber */}
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

        {/* Bottom: 2-Column Split (Live Synced Transcript + AI Intelligence Panel) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[620px] pb-8">
          <div className="lg:col-span-5 h-[650px] lg:h-[calc(100vh-280px)] min-h-[500px]">
            <TranscriptViewer
              transcript={meeting.transcript}
              participants={meeting.participants}
              highlightedTimestamp={highlightedTimestamp}
              currentTimeSeconds={currentTimeSeconds}
              onSeek={handleSeek}
            />
          </div>

          <div className="lg:col-span-7 h-[650px] lg:h-[calc(100vh-280px)] min-h-[500px]">
            <AnalysisPanel
              analysis={meeting.analysis ?? null}
              review={meeting.review ?? null}
              isLoading={false}
              isOwner={false}
              readOnly={true}
              onSelectTimestamp={handleSelectTimestamp}
              onSeek={handleSeek}
              onTriggerAnalyze={() => {}}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        meeting={meeting}
      />
    </div>
  );
}

export default function PublicSharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <PublicShareContent />
    </Suspense>
  );
}

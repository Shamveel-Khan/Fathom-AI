'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Meeting } from '@/lib/schemas/meeting';
import { MeetingPlayer } from '@/components/MeetingPlayer';
import { MeetingTimeline } from '@/components/MeetingTimeline';
import { TranscriptViewer } from '@/components/TranscriptViewer';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { ExportModal } from '@/components/ExportModal';
import { MeetingDetailSkeleton } from '@/components/Skeletons';
import { getTemplateDefinition } from '@/lib/templates/definitions';
import {
  Calendar,
  Clock,
  Users,
  AlertCircle,
  Download,
  Share2,
} from 'lucide-react';
import Link from 'next/link';

const TEMPLATE_ACCENT: Record<string, string> = {
  general:   '#7170ff',
  one_on_one:'#bdc2ff',
  sales:     '#68cc58',
  interview: '#7a7fad',
  project:   '#d4b144',
};

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
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#08090a' }}>
        <div
          className="max-w-md w-full rounded-2xl border p-8 text-center space-y-4"
          style={{ background: '#0f1011', borderColor: '#23252a' }}
        >
          <div
            className="w-12 h-12 rounded-xl border flex items-center justify-center mx-auto"
            style={{ background: 'rgba(235,87,87,0.1)', borderColor: 'rgba(235,87,87,0.3)', color: '#eb5757' }}
          >
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-semibold mb-1" style={{ color: '#f7f8f8' }}>Shared Link Unavailable</h1>
            <p className="text-xs" style={{ color: '#8a8f98' }}>{error || 'This meeting link has expired or been revoked by the owner.'}</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#ffffff', color: '#08090a' }}
          >
            Sign in to Fathom AI
          </Link>
        </div>
      </div>
    );
  }

  const tpl = getTemplateDefinition(meeting.template);
  const accent = TEMPLATE_ACCENT[meeting.template || 'general'] || '#7170ff';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#08090a' }}>
      {/* Public Share Minimal Nav */}
      <nav
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'rgba(11, 11, 11, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: '#23252a',
          height: '56px',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
              style={{ background: '#ffffff', color: '#08090a' }}
            >
              F
            </div>
            <span className="font-semibold text-sm" style={{ color: '#f7f8f8', letterSpacing: '-0.012em' }}>
              Fathom AI
            </span>
            <span style={{ color: '#34343a' }}>/</span>
            <span
              className="text-xs font-medium flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border"
              style={{ background: '#18182f', borderColor: 'rgba(113,112,255,0.2)', color: '#828fff' }}
            >
              <Share2 className="w-3 h-3" />
              Shared Meeting View
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer"
              style={{ background: '#1c1c1f', borderColor: '#34343a', color: '#d0d6e0' }}
            >
              <Download className="w-3.5 h-3.5" style={{ color: '#8a8f98' }} />
              <span>Export</span>
            </button>
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#ffffff', color: '#08090a' }}
            >
              Get Fathom AI
            </Link>
          </div>
        </div>
      </nav>

      {/* Meeting Header */}
      <div className="border-b" style={{ background: '#0f1011', borderColor: '#23252a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: '#f7f8f8', letterSpacing: '-0.012em' }}>
                  {meeting.title}
                </h1>
                <span
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-md border"
                  style={{ background: `${accent}15`, color: accent, borderColor: `${accent}30` }}
                >
                  {tpl.badge}
                </span>
              </div>
              <div
                className="flex flex-wrap items-center gap-4 mt-2 text-xs"
                style={{ color: '#8a8f98', fontFamily: "'JetBrains Mono', monospace" }}
              >
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
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ${
                      p.avatarColor || 'bg-slate-500'
                    }`}
                    style={{ ringColor: '#0f1011' } as React.CSSProperties}
                  >
                    {p.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                ))}
              </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[620px] pb-8">
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
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#08090a' }}>
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#23252a', borderTopColor: '#7170ff' }} />
        </div>
      }
    >
      <PublicShareContent />
    </Suspense>
  );
}

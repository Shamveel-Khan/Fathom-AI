'use client';

import React, { useState, useRef } from 'react';
import { Participant, TranscriptUtterance } from '@/lib/schemas/meeting';
import { secondsToTimestamp } from '@/lib/utils/time';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Tv, Activity } from 'lucide-react';

interface MeetingPlayerProps {
  durationMinutes: number;
  participants: Participant[];
  transcript: TranscriptUtterance[];
  currentTimeSeconds: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onChangeSpeed: (speed: number) => void;
}

// Speaker domain colors for waveform segments
const SPEAKER_COLORS = ['#7170ff', '#68cc58', '#d4b144', '#7a7fad', '#bdc2ff', '#828fff'];

export const MeetingPlayer: React.FC<MeetingPlayerProps> = ({
  durationMinutes,
  participants,
  transcript,
  currentTimeSeconds,
  isPlaying,
  playbackSpeed,
  onTogglePlay,
  onSeek,
  onChangeSpeed,
}) => {
  const totalSeconds = Math.max(1, durationMinutes * 60);
  const progressPercent = Math.min(100, Math.max(0, (currentTimeSeconds / totalSeconds) * 100));

  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState<'video' | 'waveform'>('waveform');
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  const timelineRef = useRef<HTMLDivElement>(null);

  const currentUtterance = transcript.find((u, idx) => {
    const next = transcript[idx + 1];
    const uSecs = u.timestampSeconds ?? 0;
    const nextSecs = next?.timestampSeconds ?? totalSeconds;
    return currentTimeSeconds >= uSecs && currentTimeSeconds < nextSecs;
  }) || transcript[0];

  const activeSpeaker = participants.find((p) => p.name === currentUtterance?.speaker) || {
    name: currentUtterance?.speaker || 'Speaker',
    role: currentUtterance?.speakerRole,
    avatarColor: 'bg-indigo-600',
  };

  const speakerColorMap: Record<string, string> = {};
  participants.forEach((p, i) => { speakerColorMap[p.name] = SPEAKER_COLORS[i % SPEAKER_COLORS.length]; });

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(Math.floor(percent * totalSeconds));
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverTime(Math.floor(percent * totalSeconds));
    setHoverPosition(hoverX);
  };

  const speedOptions = [1, 1.25, 1.5, 2];

  // Build waveform bars with speaker-colored segments
  const waveformBars = Array.from({ length: 60 }).map((_, i) => {
    const heights = [15, 30, 50, 70, 45, 25, 55, 75, 40, 20, 60, 80, 35, 25, 50, 65, 40, 20, 45, 70];
    const h = heights[i % heights.length];
    const progressI = (i / 60) * totalSeconds;
    // Determine speaker at this bar position
    let barColor = '#34343a';
    if (progressI <= currentTimeSeconds) {
      const barUtterance = transcript.find((u, idx) => {
        const next = transcript[idx + 1];
        const uSecs = u.timestampSeconds ?? 0;
        const nextSecs = next?.timestampSeconds ?? totalSeconds;
        return progressI >= uSecs && progressI < nextSecs;
      });
      barColor = speakerColorMap[barUtterance?.speaker || ''] || '#7170ff';
    }
    return { h, color: barColor };
  });

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: '#0f1011', borderColor: '#23252a' }}
    >
      {/* View Mode Toggle + Main Canvas */}
      <div className="relative p-4" style={{ background: '#141516' }}>
        {/* Toggle */}
        <div
          className="absolute top-3 right-3 z-10 flex items-center gap-0.5 rounded-lg p-0.5 border"
          style={{ background: '#0f1011', borderColor: '#23252a' }}
        >
          <button
            onClick={() => setViewMode('video')}
            className="p-1.5 rounded-md transition-colors"
            style={{ background: viewMode === 'video' ? '#232326' : 'transparent', color: viewMode === 'video' ? '#f7f8f8' : '#62666d' }}
            title="Speaker View"
          >
            <Tv className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('waveform')}
            className="p-1.5 rounded-md transition-colors"
            style={{ background: viewMode === 'waveform' ? '#232326' : 'transparent', color: viewMode === 'waveform' ? '#f7f8f8' : '#62666d' }}
            title="Waveform View"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Waveform View */}
        {viewMode === 'waveform' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${activeSpeaker.avatarColor || 'bg-indigo-600'}`}
              >
                {activeSpeaker.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#f7f8f8' }}>{activeSpeaker.name}</p>
                <p className="text-xs" style={{ color: '#8a8f98' }}>{activeSpeaker.role || 'Speaking'}</p>
              </div>
            </div>
            {/* Waveform bars */}
            <div className="flex items-center gap-0.5 h-14">
              {waveformBars.map((bar, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all duration-150"
                  style={{
                    height: `${bar.h}%`,
                    background: bar.color,
                    opacity: i <= Math.floor((currentTimeSeconds / totalSeconds) * 60) ? 0.9 : 0.25,
                  }}
                />
              ))}
            </div>
            {/* Speaker legend */}
            <div className="flex items-center gap-4 text-[10px]">
              {participants.slice(0, 4).map((p, i) => (
                <span key={p.name} className="flex items-center gap-1" style={{ color: '#8a8f98' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: SPEAKER_COLORS[i % SPEAKER_COLORS.length] }} />
                  {p.name.split(' ')[0]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Video View: Speaker tiles */}
        {viewMode === 'video' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-h-[96px]">
            {participants.map((p, idx) => {
              const isSpeaking = isPlaying && p.name === activeSpeaker.name;
              return (
                <div
                  key={idx}
                  className="relative rounded-xl p-3 flex flex-col items-center justify-center transition-all duration-300 border"
                  style={{
                    background: isSpeaking ? '#232326' : '#1c1c1f',
                    borderColor: isSpeaking ? SPEAKER_COLORS[idx % SPEAKER_COLORS.length] : '#23252a',
                    boxShadow: isSpeaking ? `0 0 12px ${SPEAKER_COLORS[idx % SPEAKER_COLORS.length]}20` : 'none',
                  }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white mb-2 ${p.avatarColor || 'bg-slate-600'}`}
                  >
                    {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <p className="text-xs font-medium truncate max-w-full text-center" style={{ color: '#f7f8f8' }}>{p.name}</p>
                  <p className="text-[10px] truncate max-w-full text-center" style={{ color: '#62666d' }}>{p.role || 'Participant'}</p>
                  {isSpeaking && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5">
                      {[3, 4, 2].map((h, i) => (
                        <span
                          key={i}
                          className="w-0.5 rounded-full animate-pulse"
                          style={{ height: `${h * 3}px`, background: SPEAKER_COLORS[idx % SPEAKER_COLORS.length] }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Big play overlay when paused */}
        {!isPlaying && (
          <button
            onClick={onTogglePlay}
            className="absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.9)', color: '#08090a' }}
            title="Play"
          >
            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
          </button>
        )}
      </div>

      {/* Scrubber */}
      <div className="px-4 pt-3 pb-1" style={{ background: '#0f1011' }}>
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseLeave={() => setHoverTime(null)}
          onMouseMove={handleTimelineMouseMove}
          className="relative h-1.5 rounded-full cursor-pointer group transition-all hover:h-2.5"
          style={{ background: '#23252a' }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 rounded-full"
            style={{ width: `${progressPercent}%`, background: '#7170ff' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -ml-2 w-3.5 h-3.5 rounded-full border-2 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progressPercent}%`, background: '#ffffff', borderColor: '#7170ff' }}
          />
          {hoverTime !== null && (
            <div
              className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] border pointer-events-none"
              style={{
                left: `${hoverPosition}px`,
                background: '#232326',
                borderColor: '#34343a',
                color: '#f7f8f8',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {secondsToTimestamp(hoverTime)}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ background: '#0f1011' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: '#ffffff', color: '#08090a' }}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" fill="currentColor" /> : <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />}
          </button>
          <button
            onClick={() => onSeek(Math.max(0, currentTimeSeconds - 10))}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#62666d' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f7f8f8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#62666d')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSeek(Math.min(totalSeconds, currentTimeSeconds + 10))}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#62666d' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f7f8f8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#62666d')}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#8a8f98' }}>
            <span style={{ color: '#f7f8f8', fontWeight: 600 }}>{secondsToTimestamp(currentTimeSeconds)}</span>
            {' / '}{secondsToTimestamp(totalSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-0.5 rounded-md border p-0.5"
            style={{ background: '#141516', borderColor: '#23252a' }}
          >
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => onChangeSpeed(speed)}
                className="px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
                style={{
                  background: playbackSpeed === speed ? '#232326' : 'transparent',
                  color: playbackSpeed === speed ? '#f7f8f8' : '#62666d',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {speed}x
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: isMuted ? '#eb5757' : '#62666d' }}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

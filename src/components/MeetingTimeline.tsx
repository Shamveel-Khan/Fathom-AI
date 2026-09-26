'use client';

import React from 'react';
import { Participant, TranscriptUtterance, MeetingHighlight } from '@/lib/schemas/meeting';
import { timestampToSeconds, secondsToTimestamp } from '@/lib/utils/time';
import { Sparkles, MessageSquare } from 'lucide-react';

interface MeetingTimelineProps {
  durationMinutes: number;
  participants: Participant[];
  transcript: TranscriptUtterance[];
  highlights?: MeetingHighlight[];
  currentTimeSeconds: number;
  onSeek: (seconds: number) => void;
}

export const MeetingTimeline: React.FC<MeetingTimelineProps> = ({
  durationMinutes,
  participants,
  transcript,
  highlights = [],
  currentTimeSeconds,
  onSeek,
}) => {
  const totalSeconds = Math.max(1, durationMinutes * 60);

  // Map participants to background colors
  const colorMap: Record<string, string> = {
    'Sarah Chen': '#10b981', // emerald-500
    'Alex Rivera': '#6366f1', // indigo-500
    'Marcus Brody': '#f59e0b', // amber-500
    'Elena Rostova': '#f43f5e', // rose-500
    'James Morton': '#8b5cf6', // violet-500
    'Linda Park': '#0ea5e9', // sky-500
    'Priya Nair': '#d946ef', // fuchsia-500
    'Leo Hartman': '#14b8a6', // teal-500
  };

  // Build segments from transcript utterances
  const segments = transcript.map((u, idx) => {
    const startSecs = u.timestampSeconds ?? timestampToSeconds(u.timestamp);
    const nextU = transcript[idx + 1];
    const endSecs = nextU
      ? nextU.timestampSeconds ?? timestampToSeconds(nextU.timestamp)
      : totalSeconds;
    const duration = Math.max(1, endSecs - startSecs);
    const widthPercent = (duration / totalSeconds) * 100;
    const leftPercent = (startSecs / totalSeconds) * 100;

    return {
      utteranceId: u.id,
      speaker: u.speaker,
      startSecs,
      endSecs,
      leftPercent,
      widthPercent,
      color: colorMap[u.speaker] || '#64748b',
    };
  });

  const currentPercent = Math.min(100, Math.max(0, (currentTimeSeconds / totalSeconds) * 100));

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Meeting Timeline & Speaker Segments
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          {secondsToTimestamp(currentTimeSeconds)} / {secondsToTimestamp(totalSeconds)}
        </span>
      </div>

      {/* Visual Timeline Track */}
      <div className="relative pt-4 pb-2">
        {/* Highlight Pin Markers */}
        <div className="relative h-4 mb-1">
          {highlights.map((h) => {
            const hSecs = timestampToSeconds(h.timestamp);
            const pinLeft = Math.min(98, Math.max(1, (hSecs / totalSeconds) * 100));
            return (
              <button
                key={h.id}
                onClick={() => onSeek(hSecs)}
                title={`[${h.timestamp}] ${h.speaker}: "${h.quote}"`}
                className="absolute -top-1 -translate-x-1/2 p-0.5 rounded-full hover:scale-125 transition-transform z-10 group"
                style={{ left: `${pinLeft}%` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white shadow-xs group-hover:bg-amber-500" />
              </button>
            );
          })}
        </div>

        {/* Multi-speaker Segment Bar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percent = Math.max(0, Math.min(1, clickX / rect.width));
            onSeek(Math.floor(percent * totalSeconds));
          }}
          className="relative h-3.5 bg-slate-100 rounded-full overflow-hidden cursor-pointer flex"
        >
          {segments.map((seg, i) => (
            <div
              key={i}
              style={{
                width: `${seg.widthPercent}%`,
                backgroundColor: seg.color,
              }}
              className="h-full opacity-80 hover:opacity-100 transition-opacity border-r border-white/20"
              title={`${seg.speaker} (${secondsToTimestamp(seg.startSecs)} - ${secondsToTimestamp(seg.endSecs)})`}
            />
          ))}

          {/* Current Playhead Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-slate-900 shadow-md z-20 pointer-events-none"
            style={{ left: `${currentPercent}%` }}
          />
        </div>
      </div>

      {/* Speaker Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {participants.map((p, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: colorMap[p.name] || '#64748b' }}
            />
            <span>{p.name}</span>
          </div>
        ))}
        {highlights.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 ml-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
            <span>{highlights.length} Highlights</span>
          </div>
        )}
      </div>
    </div>
  );
};

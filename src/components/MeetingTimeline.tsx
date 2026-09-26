'use client';

import React from 'react';
import { Participant, TranscriptUtterance, MeetingHighlight } from '@/lib/schemas/meeting';
import { timestampToSeconds, secondsToTimestamp } from '@/lib/utils/time';
import { MessageSquare } from 'lucide-react';

interface MeetingTimelineProps {
  durationMinutes: number;
  participants: Participant[];
  transcript: TranscriptUtterance[];
  highlights?: MeetingHighlight[];
  currentTimeSeconds: number;
  onSeek: (seconds: number) => void;
}

const SPEAKER_COLORS = ['#7170ff', '#68cc58', '#d4b144', '#7a7fad', '#bdc2ff', '#828fff'];

export const MeetingTimeline: React.FC<MeetingTimelineProps> = ({
  durationMinutes,
  participants,
  transcript,
  highlights = [],
  currentTimeSeconds,
  onSeek,
}) => {
  const totalSeconds = Math.max(1, durationMinutes * 60);

  const colorMap: Record<string, string> = {};
  participants.forEach((p, i) => {
    colorMap[p.name] = SPEAKER_COLORS[i % SPEAKER_COLORS.length];
  });

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
      color: colorMap[u.speaker] || '#7170ff',
    };
  });

  const currentPercent = Math.min(100, Math.max(0, (currentTimeSeconds / totalSeconds) * 100));

  return (
    <div
      className="rounded-xl p-4 border space-y-3"
      style={{ background: '#0f1011', borderColor: '#23252a' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5" style={{ color: '#7170ff' }} />
          <h3
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
          >
            Speaker Activity & Timeline
          </h3>
        </div>
        <span
          className="text-xs"
          style={{ color: '#8a8f98', fontFamily: "'JetBrains Mono', monospace" }}
        >
          {secondsToTimestamp(currentTimeSeconds)} / {secondsToTimestamp(totalSeconds)}
        </span>
      </div>

      {/* Visual Timeline Track */}
      <div className="relative pt-3 pb-1">
        {/* Highlight Pin Markers */}
        <div className="relative h-3 mb-1">
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
                <div
                  className="w-2.5 h-2.5 rounded-full border shadow-xs"
                  style={{ background: '#d4b144', borderColor: '#08090a' }}
                />
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
          className="relative h-3 rounded-full overflow-hidden cursor-pointer flex"
          style={{ background: '#1c1c1f' }}
        >
          {segments.map((seg, i) => (
            <div
              key={i}
              className="h-full opacity-75 hover:opacity-100 transition-opacity border-r"
              style={{
                width: `${seg.widthPercent}%`,
                backgroundColor: seg.color,
                borderColor: '#0f1011',
              }}
              title={`${seg.speaker} (${secondsToTimestamp(seg.startSecs)} - ${secondsToTimestamp(seg.endSecs)})`}
            />
          ))}

          {/* Current Playhead Line */}
          <div
            className="absolute top-0 bottom-0 w-1 shadow-md z-20 pointer-events-none"
            style={{ left: `${currentPercent}%`, background: '#ffffff' }}
          />
        </div>
      </div>

      {/* Speaker Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {participants.map((p, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-xs" style={{ color: '#8a8f98' }}>
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colorMap[p.name] || '#7170ff' }}
            />
            <span>{p.name}</span>
          </div>
        ))}
        {highlights.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs ml-auto" style={{ color: '#8a8f98' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: '#d4b144' }} />
            <span>{highlights.length} Highlights</span>
          </div>
        )}
      </div>
    </div>
  );
};

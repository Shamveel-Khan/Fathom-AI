'use client';

import React, { useState } from 'react';
import { TranscriptUtterance, Participant } from '@/lib/schemas/meeting';
import { timestampToSeconds } from '@/lib/utils/time';
import { Search, MessageSquare, Copy, Check, Highlighter, Play } from 'lucide-react';

interface TranscriptViewerProps {
  transcript: TranscriptUtterance[];
  participants: Participant[];
  highlightedTimestamp?: string | null;
  currentTimeSeconds?: number;
  onSeek?: (seconds: number) => void;
  onHighlightSnippet?: (utterance: TranscriptUtterance) => void;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
  participants,
  highlightedTimestamp,
  currentTimeSeconds = 0,
  onSeek,
  onHighlightSnippet,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const participantColorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    participants.forEach((p) => {
      map[p.name] = p.avatarColor || 'bg-slate-600';
    });
    return map;
  }, [participants]);

  const filteredTranscript = transcript.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.text.toLowerCase().includes(query) ||
      u.speaker.toLowerCase().includes(query) ||
      (u.speakerRole && u.speakerRole.toLowerCase().includes(query))
    );
  });

  const handleCopyLine = (u: TranscriptUtterance) => {
    const text = `[${u.timestamp}] ${u.speaker}: "${u.text}"`;
    navigator.clipboard.writeText(text);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div
      className="flex flex-col h-full rounded-xl border overflow-hidden"
      style={{ background: '#0f1011', borderColor: '#23252a' }}
    >
      {/* Header & Search */}
      <div
        className="p-3.5 sm:p-4 border-b flex items-center justify-between gap-3"
        style={{ background: '#141516', borderColor: '#23252a' }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" style={{ color: '#7170ff' }} />
          <h2 className="text-sm font-semibold" style={{ color: '#f7f8f8' }}>
            Transcript
          </h2>
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: '#232326', color: '#8a8f98' }}
          >
            {transcript.length} turns
          </span>
        </div>

        <div className="relative w-44 sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#62666d' }} />
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none transition-colors"
            style={{
              background: '#1c1c1f',
              borderColor: '#34343a',
              color: '#f7f8f8',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
          />
        </div>
      </div>

      {/* Transcript Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTranscript.length === 0 ? (
          <div className="text-center py-12 text-xs" style={{ color: '#62666d' }}>
            No matching transcript utterances found for &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredTranscript.map((u, idx) => {
            const avatarColor = participantColorMap[u.speaker] || 'bg-slate-600';
            const isManualHighlighted = highlightedTimestamp === u.timestamp;
            const uSecs = u.timestampSeconds ?? timestampToSeconds(u.timestamp);
            const nextU = transcript[idx + 1];
            const nextSecs = nextU
              ? nextU.timestampSeconds ?? timestampToSeconds(nextU.timestamp)
              : 999999;
            const isCurrentlyPlaying =
              currentTimeSeconds >= uSecs && currentTimeSeconds < nextSecs;

            return (
              <div
                key={u.id}
                id={`transcript-${u.id}`}
                className="group relative rounded-xl p-3.5 transition-all duration-150 border"
                style={{
                  background: isManualHighlighted
                    ? 'rgba(212,177,68,0.1)'
                    : isCurrentlyPlaying
                    ? '#18182f'
                    : '#141516',
                  borderColor: isManualHighlighted
                    ? 'rgba(212,177,68,0.4)'
                    : isCurrentlyPlaying
                    ? '#7170ff'
                    : '#23252a',
                  borderLeft: isCurrentlyPlaying ? '3px solid #7170ff' : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs ${avatarColor}`}
                    >
                      {u.speaker
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: '#f7f8f8' }}>
                      {u.speaker}
                    </span>
                    {u.speakerRole && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ background: '#232326', color: '#8a8f98' }}
                      >
                        {u.speakerRole}
                      </span>
                    )}
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex items-center gap-1.5">
                    {onHighlightSnippet && (
                      <button
                        onClick={() => onHighlightSnippet(u)}
                        title="Highlight this snippet"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                        style={{ color: '#8a8f98' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#828fff')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8f98')}
                      >
                        <Highlighter className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleCopyLine(u)}
                      title="Copy line"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                      style={{ color: '#8a8f98' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#f7f8f8')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8f98')}
                    >
                      {copiedId === u.id ? (
                        <Check className="w-3.5 h-3.5" style={{ color: '#27a644' }} />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => onSeek?.(uSecs)}
                      title="Seek to timestamp"
                      className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        background: isCurrentlyPlaying ? '#7170ff' : '#1c1c1f',
                        borderColor: isCurrentlyPlaying ? '#7170ff' : '#34343a',
                        color: isCurrentlyPlaying ? '#ffffff' : '#8a8f98',
                      }}
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      {u.timestamp}
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed pl-8" style={{ color: '#d0d6e0' }}>
                  {u.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

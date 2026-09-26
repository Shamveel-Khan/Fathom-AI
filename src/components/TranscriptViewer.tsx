'use client';

import React, { useState } from 'react';
import { TranscriptUtterance, Participant } from '@/lib/schemas/meeting';
import { Search, MessageSquare, Copy, Check } from 'lucide-react';

interface TranscriptViewerProps {
  transcript: TranscriptUtterance[];
  participants: Participant[];
  highlightedTimestamp?: string | null;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
  participants,
  highlightedTimestamp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Map participant name to color
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
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-900">Transcript</h2>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
            {transcript.length} turns
          </span>
        </div>

        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Transcript Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {filteredTranscript.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No matching transcript utterances found for &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredTranscript.map((u) => {
            const avatarColor = participantColorMap[u.speaker] || 'bg-slate-600';
            const isHighlighted = highlightedTimestamp === u.timestamp;

            return (
              <div
                key={u.id}
                id={`transcript-${u.id}`}
                className={`group relative rounded-xl p-3.5 transition-all duration-200 border ${
                  isHighlighted
                    ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-200'
                    : 'bg-white hover:bg-slate-50 border-slate-100'
                }`}
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
                    <span className="text-xs font-semibold text-slate-900">{u.speaker}</span>
                    {u.speakerRole && (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {u.speakerRole}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      {u.timestamp}
                    </span>
                    <button
                      onClick={() => handleCopyLine(u)}
                      title="Copy line"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded"
                    >
                      {copiedId === u.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-8">
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

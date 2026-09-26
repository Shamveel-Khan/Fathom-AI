'use client';

import React from 'react';
import { Meeting } from '@/lib/schemas/meeting';
import { Sparkles, Calendar, Clock, Key, Users, RefreshCw, Play } from 'lucide-react';

interface MeetingHeaderProps {
  meeting: Meeting;
  hasApiKey: boolean;
  onOpenApiKeyModal: () => void;
  onAnalyze: (useMock?: boolean) => void;
  isLoading: boolean;
  hasAnalysis: boolean;
}

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  meeting,
  hasApiKey,
  onOpenApiKeyModal,
  onAnalyze,
  isLoading,
  hasAnalysis,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white shadow-xs">
      {/* Top Brand & Global Actions Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-200">
            F
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-base">Fathom</span>
            <span className="text-xs ml-1.5 px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              AI Clone
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* API Key Status / Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              hasApiKey
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasApiKey ? 'API Key Configured' : 'Configure API Key'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                hasApiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
          </button>

          {/* Quick Demo Preview Button */}
          <button
            onClick={() => onAnalyze(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
            title="Generate instant preview without calling external LLM"
          >
            <Play className="w-3 h-3 text-indigo-600" />
            <span>Instant Demo</span>
          </button>

          {/* Primary AI Analyze Button */}
          <button
            onClick={() => onAnalyze(false)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 hover:shadow-indigo-200 hover:shadow-md active:scale-98"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Meeting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{hasAnalysis ? 'Re-generate AI Summary' : 'Generate AI Summary'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Meeting Metadata Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {meeting.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {meeting.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {meeting.durationMinutes} mins
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {meeting.participants.length} Participants
              </span>
            </div>
          </div>

          {/* Participants Avatar Pill Stack */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Attendees:</span>
            <div className="flex -space-x-1.5 overflow-hidden">
              {meeting.participants.map((p, idx) => (
                <div
                  key={idx}
                  title={`${p.name} (${p.role || 'Participant'})`}
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold text-white ring-2 ring-white ${
                    p.avatarColor || 'bg-slate-600'
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
          </div>
        </div>
      </div>
    </header>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Clock, Users, Sparkles, AlertCircle } from 'lucide-react';
import { Meeting } from '@/lib/schemas/meeting';

export default function PublicSharePage() {
  const params = useParams();
  const token = params.token as string;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/share/${token}`);
        const data = await res.json();
        if (data.success) {
          setMeeting(data.meeting);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h1 className="text-sm font-semibold text-slate-900 mb-1">Link not available</h1>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Minimal header */}
      <div className="border-b border-slate-200 bg-white shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">Fathom</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500">Shared Meeting</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Meeting header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h1 className="text-xl font-bold text-slate-900 mb-3">{meeting.title}</h1>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{meeting.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{meeting.durationMinutes}m</span>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{meeting.participants.length} participants</span>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-2 mt-4">
            {meeting.participants.map((p, i) => (
              <div
                key={i}
                title={p.name}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white ${p.avatarColor || 'bg-slate-500'}`}
              >
                {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
            ))}
            <span className="text-xs text-slate-500 ml-1">{meeting.participants.map((p) => p.name).join(', ')}</span>
          </div>
        </div>

        {/* AI Summary */}
        {meeting.analysis && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              AI Summary
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{meeting.analysis.executiveSummary}</p>
            {meeting.analysis.keyTakeaways?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">Key Takeaways</p>
                <ul className="space-y-1">
                  {meeting.analysis.keyTakeaways.map((t, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">•</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Transcript */}
        {meeting.transcript?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Transcript</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {meeting.transcript.map((u) => (
                <div key={u.id} className="flex gap-3">
                  <span className="text-[10px] text-slate-400 mt-0.5 shrink-0 w-10">{u.timestamp}</span>
                  <div>
                    <span className="text-xs font-semibold text-slate-700">{u.speaker}</span>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{u.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

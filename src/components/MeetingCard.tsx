'use client';

import React from 'react';
import Link from 'next/link';
import { MeetingSummary } from '@/lib/schemas/meeting';
import { Calendar, Clock, Users, CheckSquare, Scale, ChevronRight, Sparkles } from 'lucide-react';

interface MeetingCardProps {
  meeting: MeetingSummary;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const hasAnalysis = meeting.hasAnalysis;

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="group relative block bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 shadow-xs hover:shadow-md hover:shadow-indigo-100/50 transition-all duration-200 overflow-hidden"
    >
      {/* Analysis status left border accent */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-colors ${
          hasAnalysis ? 'bg-indigo-500' : 'bg-amber-400'
        }`}
      />

      <div className="p-4 pl-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
              {meeting.title}
            </h3>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 shrink-0 mt-0.5 transition-colors" />
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {meeting.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {meeting.durationMinutes}m
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {meeting.participants.length}
          </span>
        </div>

        {/* Participants avatars */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {meeting.participants.slice(0, 4).map((p, idx) => (
              <div
                key={idx}
                title={p.name}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white ${
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
            {meeting.participants.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 ring-2 ring-white">
                +{meeting.participants.length - 4}
              </div>
            )}
          </div>

          {/* AI Status badge */}
          {hasAnalysis ? (
            <div className="flex items-center gap-2">
              {meeting.actionItemsCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckSquare className="w-3 h-3" />
                  {meeting.actionItemsCount}
                </span>
              )}
              {meeting.decisionsCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Scale className="w-3 h-3" />
                  {meeting.decisionsCount}
                </span>
              )}
              <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                <Sparkles className="w-3 h-3" />
                AI Ready
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Needs Analysis
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

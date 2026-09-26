'use client';

import React from 'react';
import Link from 'next/link';
import { MeetingSummary } from '@/lib/schemas/meeting';
import { getTemplateDefinition } from '@/lib/templates/definitions';
import { Calendar, Clock, Users, CheckSquare, Scale, ChevronRight, Sparkles, ShieldAlert } from 'lucide-react';

interface MeetingCardProps {
  meeting: MeetingSummary;
}

const TEMPLATE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  general:   { bg: '#18182f', text: '#828fff', border: 'rgba(113,112,255,0.2)' },
  one_on_one:{ bg: 'rgba(189,194,255,0.08)', text: '#bdc2ff', border: 'rgba(189,194,255,0.2)' },
  sales:     { bg: 'rgba(104,204,88,0.08)', text: '#68cc58', border: 'rgba(104,204,88,0.2)' },
  interview: { bg: 'rgba(122,127,173,0.08)', text: '#7a7fad', border: 'rgba(122,127,173,0.2)' },
  project:   { bg: 'rgba(212,177,68,0.08)', text: '#d4b144', border: 'rgba(212,177,68,0.2)' },
};

export function MeetingCard({ meeting }: MeetingCardProps) {
  const hasAnalysis = meeting.hasAnalysis;
  const tpl = getTemplateDefinition(meeting.template);
  const templateColor = TEMPLATE_COLORS[meeting.template || 'general'] || TEMPLATE_COLORS.general;

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="group relative block overflow-hidden rounded-xl border transition-all duration-150"
      style={{
        background: '#0f1011',
        borderColor: '#23252a',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#34343a';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#23252a';
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
        style={{ background: hasAnalysis ? '#7170ff' : '#d4b144' }}
      />

      <div className="p-4 pl-5">
        {/* Badge row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-md border"
            style={{
              background: templateColor.bg,
              color: templateColor.text,
              borderColor: templateColor.border,
            }}
          >
            {tpl.badge}
          </span>
          {meeting.hasReview && (
            <span
              className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border"
              style={{ background: 'rgba(122,127,173,0.08)', color: '#7a7fad', borderColor: 'rgba(122,127,173,0.2)' }}
            >
              <ShieldAlert className="w-2.5 h-2.5" />
              Audited
            </span>
          )}
        </div>

        {/* Title */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3
            className="text-sm font-medium leading-snug line-clamp-2 flex-1 transition-colors duration-150"
            style={{ color: '#f7f8f8', letterSpacing: '-0.012em' }}
          >
            {meeting.title}
          </h3>
          <ChevronRight
            className="w-4 h-4 shrink-0 mt-0.5 transition-colors duration-150"
            style={{ color: '#3e3e44' }}
          />
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: '#8a8f98' }}>
            <Calendar className="w-3 h-3" />
            {meeting.date}
          </span>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: '#8a8f98' }}>
            <Clock className="w-3 h-3" />
            {meeting.durationMinutes}m
          </span>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: '#8a8f98' }}>
            <Users className="w-3 h-3" />
            {meeting.participants.length}
          </span>
          {meeting.isShared && meeting.sharedBy && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border"
              style={{ background: '#18182f', color: '#828fff', borderColor: 'rgba(113,112,255,0.2)' }}
            >
              Shared by {meeting.sharedBy.name.split(' ')[0]}
            </span>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#1c1c1f' }}>
          {/* Participant avatars */}
          <div className="flex -space-x-1.5">
            {meeting.participants.slice(0, 4).map((p, idx) => (
              <div
                key={idx}
                title={p.name}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-[#0f1011] ${p.avatarColor || 'bg-slate-600'}`}
              >
                {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
            ))}
            {meeting.participants.length > 4 && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ring-1 ring-[#0f1011]"
                style={{ background: '#232326', color: '#8a8f98' }}
              >
                +{meeting.participants.length - 4}
              </div>
            )}
          </div>

          {/* AI status badges */}
          <div className="flex items-center gap-1.5">
            {hasAnalysis ? (
              <>
                {meeting.actionItemsCount > 0 && (
                  <span
                    className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(104,204,88,0.1)', color: '#68cc58' }}
                  >
                    <CheckSquare className="w-2.5 h-2.5" />
                    {meeting.actionItemsCount}
                  </span>
                )}
                {meeting.decisionsCount > 0 && (
                  <span
                    className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(212,177,68,0.1)', color: '#d4b144' }}
                  >
                    <Scale className="w-2.5 h-2.5" />
                    {meeting.decisionsCount}
                  </span>
                )}
                <span
                  className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ background: '#18182f', color: '#828fff' }}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  AI
                </span>
              </>
            ) : (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded border"
                style={{ background: 'rgba(212,177,68,0.08)', color: '#d4b144', borderColor: 'rgba(212,177,68,0.2)' }}
              >
                Needs Analysis
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

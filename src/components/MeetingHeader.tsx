'use client';

import React from 'react';
import { Meeting } from '@/lib/schemas/meeting';
import { getTemplateDefinition } from '@/lib/templates/definitions';
import { Sparkles, Calendar, Clock, Users, RefreshCw, Play, ArrowLeft, ShieldAlert, Share2, Download, Highlighter } from 'lucide-react';
import Link from 'next/link';

const TEMPLATE_ACCENT: Record<string, string> = {
  general:   '#7170ff',
  one_on_one:'#bdc2ff',
  sales:     '#68cc58',
  interview: '#7a7fad',
  project:   '#d4b144',
};

interface MeetingHeaderProps {
  meeting: Meeting;
  hasApiKey: boolean;
  onOpenApiKeyModal: () => void;
  onAnalyze: (useMock?: boolean) => void;
  isLoading: boolean;
  hasAnalysis: boolean;
  isReviewLoading?: boolean;
  hasReview?: boolean;
  onGetReview?: () => void;
  onOpenShareModal?: () => void;
  onOpenExportModal?: () => void;
  onOpenHighlightModal?: () => void;
}

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  meeting,
  hasApiKey,
  onOpenApiKeyModal,
  onAnalyze,
  isLoading,
  hasAnalysis,
  isReviewLoading,
  hasReview,
  onGetReview,
  onOpenShareModal,
  onOpenExportModal,
  onOpenHighlightModal,
}) => {
  const tpl = getTemplateDefinition(meeting.template);
  const accent = TEMPLATE_ACCENT[meeting.template || 'general'] || '#7170ff';

  return (
    <header className="border-b" style={{ background: '#0f1011', borderColor: '#23252a' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4">
          {/* Top row: back + actions */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: '#8a8f98' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#d0d6e0')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8f98')}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Highlight */}
              {onOpenHighlightModal && hasAnalysis && (
                <button
                  onClick={onOpenHighlightModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#d0d6e0' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Highlight</span>
                </button>
              )}

              {/* Share */}
              {onOpenShareModal && (
                <button
                  onClick={onOpenShareModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#d0d6e0' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}

              {/* Export */}
              {onOpenExportModal && (
                <button
                  onClick={onOpenExportModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#d0d6e0' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}

              {/* AI Review */}
              {onGetReview && (
                <button
                  onClick={onGetReview}
                  disabled={isReviewLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50"
                  style={{
                    background: '#18182f',
                    borderColor: 'rgba(113,112,255,0.3)',
                    color: '#828fff',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(113,112,255,0.3)')}
                >
                  {isReviewLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{hasReview ? 'Re-Audit' : 'AI Review'}</span>
                </button>
              )}

              {/* Demo / Analyze */}
              {!hasAnalysis && (
                <button
                  onClick={() => onAnalyze(true)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#d0d6e0' }}
                >
                  <Play className="w-3.5 h-3.5" />
                  Demo
                </button>
              )}

              <button
                onClick={() => onAnalyze(false)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#ffffff', color: '#08090a' }}
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isLoading ? 'Analyzing…' : hasAnalysis ? 'Re-analyze' : 'Analyze'}
              </button>
            </div>
          </div>

          {/* Meeting metadata row */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md border"
                  style={{
                    background: `${accent}15`,
                    color: accent,
                    borderColor: `${accent}30`,
                  }}
                >
                  {tpl.badge}
                </span>
                {(hasReview || Boolean(meeting.review)) && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(122,127,173,0.1)', color: '#7a7fad' }}
                  >
                    Audited
                  </span>
                )}
              </div>
              <h1
                className="text-xl sm:text-2xl font-semibold leading-tight mb-2"
                style={{ color: '#f7f8f8', letterSpacing: '-0.012em' }}
              >
                {meeting.title}
              </h1>
              <div
                className="flex flex-wrap items-center gap-4 text-xs"
                style={{ color: '#8a8f98', fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {meeting.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {meeting.durationMinutes}m
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {meeting.participants.length} participants
                </span>
              </div>
            </div>

            {/* Participant avatars */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {meeting.participants.map((p, idx) => (
                  <div
                    key={idx}
                    title={`${p.name}${p.role ? ` (${p.role})` : ''}`}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white ring-2 ${p.avatarColor || 'bg-slate-600'}`}
                    style={{ ringColor: '#0f1011' } as React.CSSProperties}
                  >
                    {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

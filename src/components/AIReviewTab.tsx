'use client';

import React from 'react';
import { AIReview } from '@/lib/schemas/review';
import {
  ShieldAlert,
  HelpCircle,
  UserX,
  ClockAlert,
  GitFork,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

interface AIReviewTabProps {
  review?: AIReview | null;
  isLoading?: boolean;
  isOwner?: boolean;
  onGenerateReview?: () => void;
  onSelectTimestamp?: (timestamp: string) => void;
}

export const AIReviewTab: React.FC<AIReviewTabProps> = ({
  review,
  isLoading = false,
  isOwner = false,
  onGenerateReview,
}) => {
  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-500 animate-spin" />
            <div className="h-4 w-40 bg-slate-200 rounded-md" />
          </div>
          <div className="h-6 w-16 bg-slate-200 rounded-full" />
        </div>
        <div className="h-16 bg-slate-100 rounded-xl" />
        <div className="space-y-3">
          <div className="h-20 bg-slate-100 rounded-xl" />
          <div className="h-20 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-2xs">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">No AI Review Generated Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
          Audit this meeting for unresolved questions, unowned commitments, missing deadlines, dependencies, contradictions, and execution risks.
        </p>
        {isOwner && onGenerateReview && (
          <button
            onClick={onGenerateReview}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run AI Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'stroke-emerald-500' };
    if (score >= 75) return { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', ring: 'stroke-indigo-500' };
    if (score >= 60) return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'stroke-amber-500' };
    return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', ring: 'stroke-rose-500' };
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const scoreTheme = getScoreColor(review.overallScore ?? 85);
  const totalGaps =
    (review.unresolvedQuestions?.length || 0) +
    (review.unassignedResponsibilities?.length || 0) +
    (review.missingDeadlines?.length || 0) +
    (review.missingDependencies?.length || 0) +
    (review.contradictions?.length || 0) +
    (review.potentialRisks?.length || 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-280px)]">
      {/* Header score & summary */}
      <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-lg">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Meeting Quality & Risk Audit</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{review.summary}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <div className={`px-3.5 py-2 rounded-xl border ${scoreTheme.bg} ${scoreTheme.border} flex items-center gap-2`}>
            <div className="text-right">
              <span className={`text-lg font-black tracking-tight ${scoreTheme.text}`}>{review.overallScore}</span>
              <span className="text-[10px] font-bold text-slate-400">/100</span>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${scoreTheme.bg} ${scoreTheme.text}`}>
              {review.overallScore >= 85 ? 'High Clarity' : review.overallScore >= 70 ? 'Moderate Gaps' : 'Attention Needed'}
            </span>
          </div>

          {isOwner && onGenerateReview && (
            <button
              onClick={onGenerateReview}
              title="Re-run AI Review"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {totalGaps === 0 ? (
        <div className="p-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h4 className="text-xs font-bold text-emerald-900">Zero Execution Gaps Detected</h4>
          <p className="text-xs text-emerald-700">All tasks have designated assignees, deadlines, and clear dependencies.</p>
        </div>
      ) : null}

      {/* 1. Unresolved Questions */}
      {review.unresolvedQuestions && review.unresolvedQuestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Unresolved Questions ({review.unresolvedQuestions.length})
            </h4>
          </div>
          <div className="space-y-2">
            {review.unresolvedQuestions.map((q) => (
              <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900 leading-snug">{q.question}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border shrink-0 ${getSeverityBadge(q.severity)}`}>
                    {q.severity}
                  </span>
                </div>
                {q.context && <p className="text-[11px] text-slate-500">{q.context}</p>}
                {q.raisedBy && (
                  <p className="text-[10px] text-slate-400">
                    Raised by: <span className="font-semibold text-slate-600">{q.raisedBy}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Unassigned Responsibilities */}
      {review.unassignedResponsibilities && review.unassignedResponsibilities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Unassigned Responsibilities ({review.unassignedResponsibilities.length})
            </h4>
          </div>
          <div className="space-y-2">
            {review.unassignedResponsibilities.map((u) => (
              <div key={u.id} className="p-3.5 rounded-xl border border-amber-200/70 bg-amber-50/40 shadow-2xs space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-amber-950">{u.task}</p>
                  {u.suggestedRole && (
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300/50 shrink-0">
                      Suggested: {u.suggestedRole}
                    </span>
                  )}
                </div>
                {u.context && <p className="text-[11px] text-amber-900/70">{u.context}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Missing Deadlines */}
      {review.missingDeadlines && review.missingDeadlines.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ClockAlert className="w-4 h-4 text-rose-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Missing Deadlines ({review.missingDeadlines.length})
            </h4>
          </div>
          <div className="space-y-2">
            {review.missingDeadlines.map((m) => (
              <div key={m.id} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-900">{m.task}</p>
                  {m.assignee && (
                    <p className="text-[10px] text-slate-500">
                      Owner: <span className="font-semibold text-slate-700">@{m.assignee}</span>
                    </p>
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border shrink-0 ${getSeverityBadge(m.urgency)}`}>
                  {m.urgency} urgency
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Missing Dependencies */}
      {review.missingDependencies && review.missingDependencies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Dependencies & Blockers ({review.missingDependencies.length})
            </h4>
          </div>
          <div className="space-y-2">
            {review.missingDependencies.map((d) => (
              <div key={d.id} className="p-3.5 rounded-xl border border-purple-200/70 bg-purple-50/40 shadow-2xs space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-purple-950">{d.blocker}</p>
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 shrink-0">
                    Impacts: {d.impactedArea}
                  </span>
                </div>
                {d.description && <p className="text-[11px] text-purple-900/70">{d.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Contradictions */}
      {review.contradictions && review.contradictions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Contradictions ({review.contradictions.length})
            </h4>
          </div>
          <div className="space-y-2">
            {review.contradictions.map((c) => (
              <div key={c.id} className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 shadow-2xs space-y-2">
                <p className="text-xs font-bold text-amber-950">Topic: {c.topic}</p>
                <ul className="space-y-1 text-[11px] text-amber-900/80 list-disc list-inside">
                  {c.statements.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Potential Risks */}
      {review.potentialRisks && review.potentialRisks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Potential Risks & Mitigations ({review.potentialRisks.length})
            </h4>
          </div>
          <div className="space-y-2">
            {review.potentialRisks.map((r) => (
              <div key={r.id} className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/40 shadow-2xs space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-rose-950">{r.risk}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border shrink-0 ${getSeverityBadge(r.severity)}`}>
                    {r.severity}
                  </span>
                </div>
                {r.mitigation && (
                  <p className="text-[11px] text-rose-900/80 bg-white/70 p-2 rounded-lg border border-rose-200/50">
                    <span className="font-bold text-rose-950">Mitigation: </span>
                    {r.mitigation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

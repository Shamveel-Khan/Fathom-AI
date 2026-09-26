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
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: '#23252a' }}>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 animate-spin" style={{ color: '#7170ff' }} />
            <div className="h-4 w-40 rounded" style={{ background: '#232326' }} />
          </div>
          <div className="h-6 w-16 rounded-full" style={{ background: '#232326' }} />
        </div>
        <div className="h-16 rounded-xl" style={{ background: '#141516' }} />
        <div className="space-y-3">
          <div className="h-20 rounded-xl" style={{ background: '#141516' }} />
          <div className="h-20 rounded-xl" style={{ background: '#141516' }} />
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <div
          className="w-12 h-12 rounded-xl border flex items-center justify-center mb-3"
          style={{ background: '#18182f', borderColor: 'rgba(113,112,255,0.3)', color: '#828fff' }}
        >
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold mb-1" style={{ color: '#f7f8f8' }}>
          No AI Review Generated Yet
        </h3>
        <p className="text-xs max-w-sm mb-5 leading-relaxed" style={{ color: '#8a8f98' }}>
          Audit this meeting for unresolved questions, unowned commitments, missing deadlines, dependencies, contradictions, and execution risks.
        </p>
        {isOwner && onGenerateReview && (
          <button
            onClick={onGenerateReview}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: '#ffffff', color: '#08090a' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run AI Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  const getScoreTheme = (score: number) => {
    if (score >= 90) return { text: '#68cc58', bg: 'rgba(104,204,88,0.1)', border: 'rgba(104,204,88,0.3)', label: 'High Clarity' };
    if (score >= 75) return { text: '#828fff', bg: '#18182f', border: 'rgba(113,112,255,0.3)', label: 'Moderate Clarity' };
    if (score >= 60) return { text: '#d4b144', bg: 'rgba(212,177,68,0.1)', border: 'rgba(212,177,68,0.3)', label: 'Moderate Gaps' };
    return { text: '#eb5757', bg: 'rgba(235,87,87,0.1)', border: 'rgba(235,87,87,0.3)', label: 'Attention Needed' };
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
      case 'high':
        return { color: '#eb5757', bg: 'rgba(235,87,87,0.1)', border: 'rgba(235,87,87,0.2)' };
      case 'medium':
        return { color: '#d4b144', bg: 'rgba(212,177,68,0.1)', border: 'rgba(212,177,68,0.2)' };
      default:
        return { color: '#8a8f98', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)' };
    }
  };

  const scoreTheme = getScoreTheme(review.overallScore ?? 85);
  const totalGaps =
    (review.unresolvedQuestions?.length || 0) +
    (review.unassignedResponsibilities?.length || 0) +
    (review.missingDeadlines?.length || 0) +
    (review.missingDependencies?.length || 0) +
    (review.contradictions?.length || 0) +
    (review.potentialRisks?.length || 0);

  return (
    <div className="p-4 sm:p-5 space-y-6 overflow-y-auto max-h-[calc(100vh-280px)]">
      {/* Header score & summary */}
      <div
        className="rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: '#141516', borderColor: '#23252a' }}
      >
        <div className="space-y-1 max-w-lg">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" style={{ color: '#7170ff' }} />
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
            >
              Meeting Quality & Risk Audit
            </h3>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#d0d6e0' }}>{review.summary}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <div
            className="px-3.5 py-2 rounded-xl border flex items-center gap-2"
            style={{ background: scoreTheme.bg, borderColor: scoreTheme.border }}
          >
            <div className="text-right">
              <span
                className="text-lg font-bold"
                style={{ color: scoreTheme.text, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {review.overallScore}
              </span>
              <span className="text-[10px]" style={{ color: '#62666d' }}>/100</span>
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: scoreTheme.bg, color: scoreTheme.text }}
            >
              {scoreTheme.label}
            </span>
          </div>

          {isOwner && onGenerateReview && (
            <button
              onClick={onGenerateReview}
              title="Re-run AI Review"
              className="p-2 rounded-lg border transition-colors cursor-pointer"
              style={{ background: '#1c1c1f', borderColor: '#34343a', color: '#8a8f98' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f7f8f8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8f98')}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {totalGaps === 0 ? (
        <div
          className="p-6 rounded-xl border text-center space-y-2"
          style={{ background: 'rgba(104,204,88,0.06)', borderColor: 'rgba(104,204,88,0.2)' }}
        >
          <CheckCircle2 className="w-8 h-8 mx-auto" style={{ color: '#68cc58' }} />
          <h4 className="text-xs font-semibold" style={{ color: '#f7f8f8' }}>Zero Execution Gaps Detected</h4>
          <p className="text-xs" style={{ color: '#68cc58' }}>All tasks have designated assignees, deadlines, and clear dependencies.</p>
        </div>
      ) : null}

      {/* 1. Unresolved Questions */}
      {review.unresolvedQuestions && review.unresolvedQuestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" style={{ color: '#828fff' }} />
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8a8f98' }}>
              Unresolved Questions ({review.unresolvedQuestions.length})
            </h4>
          </div>
          <div className="space-y-2">
            {review.unresolvedQuestions.map((q) => {
              const sev = getSeverityBadge(q.severity);
              return (
                <div
                  key={q.id}
                  className="p-3.5 rounded-xl border space-y-1.5"
                  style={{ background: '#141516', borderColor: '#23252a' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold leading-snug" style={{ color: '#f7f8f8' }}>{q.question}</p>
                    <span
                      className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded border shrink-0"
                      style={{ background: sev.bg, color: sev.color, borderColor: sev.border }}
                    >
                      {q.severity}
                    </span>
                  </div>
                  {q.context && <p className="text-[11px]" style={{ color: '#8a8f98' }}>{q.context}</p>}
                  {q.raisedBy && (
                    <p className="text-[10px]" style={{ color: '#62666d' }}>
                      Raised by: <span style={{ color: '#d0d6e0' }}>{q.raisedBy}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Unassigned Responsibilities */}
      {review.unassignedResponsibilities && review.unassignedResponsibilities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4" style={{ color: '#d4b144' }} />
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8a8f98' }}>
              Unassigned Responsibilities ({review.unassignedResponsibilities.length})
            </h4>
          </div>
          <div className="space-y-2">
            {review.unassignedResponsibilities.map((u) => (
              <div
                key={u.id}
                className="p-3.5 rounded-xl border space-y-1.5"
                style={{ background: '#141516', borderColor: 'rgba(212,177,68,0.2)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold" style={{ color: '#f7f8f8' }}>{u.task}</p>
                  {u.suggestedRole && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0"
                      style={{ background: 'rgba(212,177,68,0.1)', color: '#d4b144', borderColor: 'rgba(212,177,68,0.3)' }}
                    >
                      Suggested: {u.suggestedRole}
                    </span>
                  )}
                </div>
                {u.context && <p className="text-[11px]" style={{ color: '#8a8f98' }}>{u.context}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Missing Deadlines */}
      {review.missingDeadlines && review.missingDeadlines.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ClockAlert className="w-4 h-4" style={{ color: '#eb5757' }} />
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8a8f98' }}>
              Missing Deadlines ({review.missingDeadlines.length})
            </h4>
          </div>
          <div className="space-y-2">
            {review.missingDeadlines.map((m) => {
              const sev = getSeverityBadge(m.urgency);
              return (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
                  style={{ background: '#141516', borderColor: '#23252a' }}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold" style={{ color: '#f7f8f8' }}>{m.task}</p>
                    {m.assignee && (
                      <p className="text-[10px]" style={{ color: '#62666d' }}>
                        Owner: <span style={{ color: '#828fff' }}>@{m.assignee}</span>
                      </p>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded border shrink-0"
                    style={{ background: sev.bg, color: sev.color, borderColor: sev.border }}
                  >
                    {m.urgency} urgency
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Missing Dependencies */}
      {review.missingDependencies && review.missingDependencies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4" style={{ color: '#7a7fad' }} />
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8a8f98' }}>
              Dependencies & Blockers ({review.missingDependencies.length})
            </h4>
          </div>
          <div className="space-y-2">
            {review.missingDependencies.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-xl border space-y-1"
                style={{ background: '#141516', borderColor: 'rgba(122,127,173,0.2)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold" style={{ color: '#f7f8f8' }}>{d.blocker}</p>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0"
                    style={{ background: 'rgba(122,127,173,0.1)', color: '#7a7fad', borderColor: 'rgba(122,127,173,0.3)' }}
                  >
                    Impacts: {d.impactedArea}
                  </span>
                </div>
                {d.description && <p className="text-[11px]" style={{ color: '#8a8f98' }}>{d.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Contradictions */}
      {review.contradictions && review.contradictions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: '#d4b144' }} />
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8a8f98' }}>
              Contradictions ({review.contradictions.length})
            </h4>
          </div>
          <div className="space-y-2">
            {review.contradictions.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl border space-y-2"
                style={{ background: '#141516', borderColor: 'rgba(212,177,68,0.2)' }}
              >
                <p className="text-xs font-semibold" style={{ color: '#d4b144' }}>Topic: {c.topic}</p>
                <ul className="space-y-1 text-[11px] list-disc list-inside" style={{ color: '#d0d6e0' }}>
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
            <Flame className="w-4 h-4" style={{ color: '#eb5757' }} />
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8a8f98' }}>
              Potential Risks & Mitigations ({review.potentialRisks.length})
            </h4>
          </div>
          <div className="space-y-2">
            {review.potentialRisks.map((r) => {
              const sev = getSeverityBadge(r.severity);
              return (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl border space-y-1.5"
                  style={{ background: '#141516', borderColor: 'rgba(235,87,87,0.2)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold" style={{ color: '#f7f8f8' }}>{r.risk}</p>
                    <span
                      className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded border shrink-0"
                      style={{ background: sev.bg, color: sev.color, borderColor: sev.border }}
                    >
                      {r.severity}
                    </span>
                  </div>
                  {r.mitigation && (
                    <p
                      className="text-[11px] p-2 rounded-lg border"
                      style={{ background: '#1c1c1f', borderColor: '#23252a', color: '#d0d6e0' }}
                    >
                      <span className="font-semibold" style={{ color: '#eb5757' }}>Mitigation: </span>
                      {r.mitigation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { StoredMeetingAnalysis, MeetingHighlight } from '@/lib/schemas/meeting';
import { ActionItem } from '@/lib/schemas/analysis';
import { AIReview } from '@/lib/schemas/review';
import { AIReviewTab } from './AIReviewTab';
import { timestampToSeconds } from '@/lib/utils/time';
import {
  Sparkles,
  CheckSquare,
  Scale,
  Highlighter,
  Copy,
  Check,
  User,
  Quote,
  Clock,
  ArrowRight,
  Trash2,
  Plus,
  Play,
  ShieldAlert,
  Download,
} from 'lucide-react';

interface AnalysisPanelProps {
  analysis: StoredMeetingAnalysis | null;
  review?: AIReview | null;
  isLoading: boolean;
  isReviewLoading?: boolean;
  isOwner?: boolean;
  readOnly?: boolean;
  onSelectTimestamp?: (timestamp: string) => void;
  onSeek?: (seconds: number) => void;
  onTriggerAnalyze: () => void;
  onTriggerReview?: () => void;
  onOpenExportModal?: () => void;
  onToggleActionItem?: (actionId: string, completed: boolean) => Promise<void>;
  onUpdateActionItem?: (actionId: string, updates: { completed?: boolean; assignee?: string; dueDate?: string }) => Promise<void>;
  onDeleteHighlight?: (highlightId: string) => Promise<void>;
  onOpenCreateHighlight?: () => void;
}

type TabType = 'summary' | 'review' | 'actionItems' | 'decisions' | 'highlights';

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis,
  review,
  isLoading,
  isReviewLoading = false,
  isOwner = true,
  readOnly = false,
  onSelectTimestamp,
  onSeek,
  onTriggerAnalyze,
  onTriggerReview,
  onOpenExportModal,
  onToggleActionItem,
  onUpdateActionItem,
  onDeleteHighlight,
  onOpenCreateHighlight,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [highlightFilter, setHighlightFilter] = useState<string>('all');
  const [actionItemsState, setActionItemsState] = useState<ActionItem[]>([]);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editAssignee, setEditAssignee] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  React.useEffect(() => {
    if (analysis?.actionItems) {
      setActionItemsState(analysis.actionItems);
    }
  }, [analysis]);

  const handleToggleAction = async (id: string, currentCompleted: boolean) => {
    if (readOnly) return;
    const nextCompleted = !currentCompleted;
    setActionItemsState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: nextCompleted } : item))
    );
    if (onToggleActionItem) {
      try {
        await onToggleActionItem(id, nextCompleted);
      } catch (err) {
        console.error('Failed to toggle action item:', err);
        setActionItemsState((prev) =>
          prev.map((item) => (item.id === id ? { ...item, completed: currentCompleted } : item))
        );
      }
    }
  };

  const handleStartEditAction = (e: React.MouseEvent, item: ActionItem) => {
    if (readOnly) return;
    e.stopPropagation();
    setEditingActionId(item.id);
    setEditAssignee(item.assignee || '');
    setEditDueDate(item.dueDate || '');
  };

  const handleSaveActionEdit = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const assigneeVal = editAssignee.trim() || undefined;
    const dueDateVal = editDueDate.trim() || undefined;

    setActionItemsState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, assignee: assigneeVal, dueDate: dueDateVal } : item))
    );
    setEditingActionId(null);

    if (onUpdateActionItem) {
      try {
        await onUpdateActionItem(id, { assignee: assigneeVal, dueDate: dueDateVal });
      } catch (err) {
        console.error('Failed to update action item:', err);
      }
    }
  };

  const handleCancelActionEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingActionId(null);
  };

  const handleCopyMarkdown = () => {
    if (!analysis) return;

    let md = `# Meeting Intelligence Summary\n\n`;
    md += `## Executive Summary\n${analysis.executiveSummary}\n\n`;

    md += `## Key Takeaways\n`;
    analysis.keyTakeaways.forEach((k) => {
      md += `* ${k}\n`;
    });
    md += `\n`;

    md += `## Action Items\n`;
    actionItemsState.forEach((a) => {
      const status = a.completed ? '[x]' : '[ ]';
      const assigneeStr = a.assignee ? ` (@${a.assignee})` : '';
      md += `- ${status} **${a.task}**${assigneeStr}\n`;
    });
    md += `\n`;

    md += `## Decisions\n`;
    analysis.decisions.forEach((d) => {
      md += `* **${d.decision}**\n  * Rationale: ${d.rationale || 'N/A'}\n  * Made by: ${d.madeBy || 'Team'}\n`;
    });
    md += `\n`;

    md += `## Key Highlights\n`;
    (analysis.highlights || []).forEach((h) => {
      md += `* [${h.timestamp}] *"${h.quote}"* — **${h.speaker}** (${h.significance})\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const highlightsList = analysis?.highlights || [];
  const filteredHighlights = highlightsList.filter((h) => {
    if (highlightFilter === 'all') return true;
    if (highlightFilter === 'user_saved') return h.isUserSaved;
    return h.category === highlightFilter;
  });

  const getCategoryBadge = (cat?: string, isUserSaved?: boolean) => {
    switch (cat) {
      case 'decision':
        return { label: 'Decision', bg: 'rgba(212,177,68,0.1)', text: '#d4b144', border: 'rgba(212,177,68,0.3)' };
      case 'action':
        return { label: 'Action Item', bg: 'rgba(104,204,88,0.1)', text: '#68cc58', border: 'rgba(104,204,88,0.3)' };
      case 'risk':
        return { label: 'Risk', bg: 'rgba(235,87,87,0.1)', text: '#eb5757', border: 'rgba(235,87,87,0.3)' };
      case 'question':
        return { label: 'Question', bg: 'rgba(130,143,255,0.1)', text: '#828fff', border: 'rgba(130,143,255,0.3)' };
      case 'user_saved':
      default:
        return isUserSaved
          ? { label: 'User Saved', bg: '#18182f', text: '#828fff', border: 'rgba(113,112,255,0.3)' }
          : { label: 'Key Moment', bg: 'rgba(189,194,255,0.1)', text: '#bdc2ff', border: 'rgba(189,194,255,0.3)' };
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex flex-col h-full rounded-xl border p-6 space-y-6"
        style={{ background: '#0f1011', borderColor: '#23252a' }}
      >
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: '#23252a' }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 animate-spin" style={{ color: '#7170ff' }} />
            <h2 className="text-sm font-semibold" style={{ color: '#f7f8f8' }}>Analyzing Meeting Intelligence...</h2>
          </div>
          <div className="h-4 w-20 rounded-full animate-pulse" style={{ background: '#232326' }} />
        </div>
        <div className="space-y-4">
          <div className="h-4 rounded-md w-3/4 animate-pulse" style={{ background: '#1c1c1f' }} />
          <div className="h-4 rounded-md w-full animate-pulse" style={{ background: '#1c1c1f' }} />
          <div className="h-4 rounded-md w-5/6 animate-pulse" style={{ background: '#1c1c1f' }} />
          <div className="h-24 rounded-xl animate-pulse" style={{ background: '#141516' }} />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full rounded-xl border border-dashed p-8 text-center"
        style={{ background: '#0f1011', borderColor: '#34343a' }}
      >
        <div
          className="w-12 h-12 rounded-xl border flex items-center justify-center mb-4"
          style={{ background: '#18182f', borderColor: 'rgba(113,112,255,0.3)', color: '#828fff' }}
        >
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold mb-1" style={{ color: '#f7f8f8' }}>No AI Analysis Generated Yet</h3>
        <p className="text-xs max-w-sm mb-6 leading-relaxed" style={{ color: '#8a8f98' }}>
          Extract structured executive summaries, actionable checklists, core decisions, and timestamped highlights in seconds.
        </p>
        {!readOnly && (
          <button
            onClick={onTriggerAnalyze}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 cursor-pointer"
            style={{ background: '#ffffff', color: '#08090a' }}
          >
            <span>Run AI Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full rounded-xl border overflow-hidden"
      style={{ background: '#0f1011', borderColor: '#23252a' }}
    >
      {/* Header Tabs & Export */}
      <div
        className="border-b p-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2 flex-wrap"
        style={{ background: '#141516', borderColor: '#23252a' }}
      >
        {/* Tab Controls */}
        <div
          className="flex items-center gap-1 p-1 rounded-lg border overflow-x-auto max-w-full"
          style={{ background: '#0f1011', borderColor: '#23252a' }}
        >
          <button
            onClick={() => setActiveTab('summary')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0"
            style={{
              background: activeTab === 'summary' ? '#232326' : 'transparent',
              color: activeTab === 'summary' ? '#f7f8f8' : '#8a8f98',
              border: activeTab === 'summary' ? '1px solid #34343a' : '1px solid transparent',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#7170ff' }} />
            <span>Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0"
            style={{
              background: activeTab === 'review' ? '#232326' : 'transparent',
              color: activeTab === 'review' ? '#f7f8f8' : '#8a8f98',
              border: activeTab === 'review' ? '1px solid #34343a' : '1px solid transparent',
            }}
          >
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: '#7170ff' }} />
            <span>AI Review</span>
            {review && (
              <span
                className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold"
                style={{
                  background: review.overallScore >= 85 ? 'rgba(104,204,88,0.15)' : 'rgba(212,177,68,0.15)',
                  color: review.overallScore >= 85 ? '#68cc58' : '#d4b144',
                }}
              >
                {review.overallScore}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('actionItems')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0"
            style={{
              background: activeTab === 'actionItems' ? '#232326' : 'transparent',
              color: activeTab === 'actionItems' ? '#f7f8f8' : '#8a8f98',
              border: activeTab === 'actionItems' ? '1px solid #34343a' : '1px solid transparent',
            }}
          >
            <CheckSquare className="w-3.5 h-3.5" style={{ color: '#68cc58' }} />
            <span>Actions</span>
            <span
              className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold"
              style={{ background: '#1c1c1f', color: '#8a8f98' }}
            >
              {actionItemsState.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('decisions')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0"
            style={{
              background: activeTab === 'decisions' ? '#232326' : 'transparent',
              color: activeTab === 'decisions' ? '#f7f8f8' : '#8a8f98',
              border: activeTab === 'decisions' ? '1px solid #34343a' : '1px solid transparent',
            }}
          >
            <Scale className="w-3.5 h-3.5" style={{ color: '#d4b144' }} />
            <span>Decisions</span>
            <span
              className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold"
              style={{ background: '#1c1c1f', color: '#8a8f98' }}
            >
              {analysis.decisions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('highlights')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0"
            style={{
              background: activeTab === 'highlights' ? '#232326' : 'transparent',
              color: activeTab === 'highlights' ? '#f7f8f8' : '#8a8f98',
              border: activeTab === 'highlights' ? '1px solid #34343a' : '1px solid transparent',
            }}
          >
            <Highlighter className="w-3.5 h-3.5" style={{ color: '#bdc2ff' }} />
            <span>Highlights</span>
            <span
              className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold"
              style={{ background: '#1c1c1f', color: '#8a8f98' }}
            >
              {highlightsList.length}
            </span>
          </button>
        </div>

        {/* Action buttons: Export Modal & Quick Copy */}
        <div className="flex items-center gap-1.5 ml-auto">
          {onOpenExportModal && (
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer"
              style={{ background: '#1c1c1f', borderColor: '#34343a', color: '#d0d6e0' }}
              title="Export report, transcript, or markdown"
            >
              <Download className="w-3.5 h-3.5" style={{ color: '#8a8f98' }} />
              <span>Export</span>
            </button>
          )}

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer"
            style={{ background: '#1c1c1f', borderColor: '#34343a', color: '#d0d6e0' }}
            title="Copy markdown summary"
          >
            {copiedMarkdown ? (
              <>
                <Check className="w-3.5 h-3.5" style={{ color: '#27a644' }} />
                <span style={{ color: '#68cc58' }}>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" style={{ color: '#8a8f98' }} />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* REVIEW TAB */}
        {activeTab === 'review' && (
          <AIReviewTab
            review={review}
            isLoading={isReviewLoading}
            isOwner={isOwner && !readOnly}
            onGenerateReview={onTriggerReview}
            onSelectTimestamp={onSelectTimestamp}
          />
        )}

        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-2.5"
                style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
              >
                Executive Overview
              </h3>
              <p
                className="text-xs sm:text-sm leading-relaxed p-4 rounded-xl border"
                style={{ background: '#141516', borderColor: '#23252a', color: '#d0d6e0' }}
              >
                {analysis.executiveSummary}
              </p>
            </div>

            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-2.5"
                style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
              >
                Key Takeaways
              </h3>
              <ul className="space-y-2">
                {analysis.keyTakeaways.map((takeaway, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm p-3 rounded-xl border"
                    style={{ background: '#141516', borderColor: '#23252a', color: '#d0d6e0' }}
                  >
                    <span
                      className="w-5 h-5 rounded-md text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: '#18182f', color: '#828fff' }}
                    >
                      {idx + 1}
                    </span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ACTION ITEMS TAB */}
        {activeTab === 'actionItems' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
              >
                Action Items ({actionItemsState.filter((a) => a.completed).length}/{actionItemsState.length} done)
              </h3>
              <span className="text-[11px]" style={{ color: '#62666d' }}>Click to toggle & save</span>
            </div>
            {actionItemsState.map((item) => {
              const isEditing = editingActionId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => !isEditing && handleToggleAction(item.id, item.completed)}
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all ${
                    isEditing ? 'cursor-default' : 'cursor-pointer'
                  }`}
                  style={{
                    background: item.completed ? '#141516' : '#141516',
                    borderColor: isEditing ? '#7170ff' : '#23252a',
                    opacity: item.completed ? 0.6 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleAction(item.id, item.completed)}
                    disabled={isEditing}
                    className="w-4 h-4 mt-0.5 rounded-sm accent-[#7170ff] cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs sm:text-sm font-medium"
                      style={{
                        color: item.completed ? '#62666d' : '#f7f8f8',
                        textDecoration: item.completed ? 'line-through' : 'none',
                      }}
                    >
                      {item.task}
                    </p>
                    {item.context && (
                      <p className="text-[11px] mt-1 italic leading-tight" style={{ color: '#8a8f98' }}>
                        &quot;{item.context}&quot;
                      </p>
                    )}

                    {isEditing ? (
                      <div
                        className="mt-3 p-2.5 rounded-lg border space-y-2"
                        style={{ background: '#1c1c1f', borderColor: '#34343a' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold mb-0.5" style={{ color: '#8a8f98' }}>Assignee</label>
                            <input
                              type="text"
                              value={editAssignee}
                              onChange={(e) => setEditAssignee(e.target.value)}
                              placeholder="e.g. Sarah Chen"
                              className="w-full text-xs px-2 py-1 rounded-md border focus:outline-none"
                              style={{ background: '#141516', borderColor: '#34343a', color: '#f7f8f8' }}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold mb-0.5" style={{ color: '#8a8f98' }}>Due Date</label>
                            <input
                              type="text"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              placeholder="e.g. Oct 25, 2026"
                              className="w-full text-xs px-2 py-1 rounded-md border focus:outline-none"
                              style={{ background: '#141516', borderColor: '#34343a', color: '#f7f8f8' }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={handleCancelActionEdit}
                            className="px-2 py-1 text-[11px] rounded"
                            style={{ color: '#8a8f98' }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => handleSaveActionEdit(e, item.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-md"
                            style={{ background: '#7170ff', color: '#ffffff' }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {item.assignee && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border"
                            style={{ background: '#18182f', color: '#828fff', borderColor: 'rgba(113,112,255,0.2)' }}
                          >
                            <User className="w-3 h-3" />
                            {item.assignee}
                          </span>
                        )}
                        {item.dueDate && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              background: '#1c1c1f',
                              color: '#d4b144',
                              borderColor: '#34343a',
                            }}
                          >
                            <Clock className="w-3 h-3" />
                            Due: {item.dueDate}
                          </span>
                        )}
                        <button
                          onClick={(e) => handleStartEditAction(e, item)}
                          className="text-[10px] transition-colors ml-auto underline"
                          style={{ color: '#62666d' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#828fff')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#62666d')}
                        >
                          Edit Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DECISIONS TAB */}
        {activeTab === 'decisions' && (
          <div className="space-y-3.5">
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
            >
              Agreed Decisions
            </h3>
            {analysis.decisions.map((dec) => {
              const decSecs = dec.timestampSeconds ?? (dec.timestamp ? timestampToSeconds(dec.timestamp) : 0);

              return (
                <div
                  key={dec.id}
                  className="p-4 rounded-xl border space-y-2"
                  style={{ background: '#141516', borderColor: 'rgba(212,177,68,0.2)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-semibold leading-snug" style={{ color: '#f7f8f8' }}>
                      {dec.decision}
                    </h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {dec.madeBy && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                          style={{ background: 'rgba(212,177,68,0.1)', color: '#d4b144', borderColor: 'rgba(212,177,68,0.3)' }}
                        >
                          {dec.madeBy}
                        </span>
                      )}
                      {dec.timestamp && (
                        <button
                          onClick={() => {
                            onSeek?.(decSecs);
                            onSelectTimestamp?.(dec.timestamp!);
                          }}
                          title="Seek to discussion moment"
                          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border transition-colors font-medium cursor-pointer"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            background: '#1c1c1f',
                            borderColor: '#34343a',
                            color: '#d4b144',
                          }}
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          {dec.timestamp}
                        </button>
                      )}
                    </div>
                  </div>
                  {dec.rationale && (
                    <p
                      className="text-xs leading-relaxed p-2.5 rounded-lg border"
                      style={{ background: '#1c1c1f', borderColor: '#23252a', color: '#d0d6e0' }}
                    >
                      <strong className="font-medium" style={{ color: '#f7f8f8' }}>Rationale: </strong>
                      {dec.rationale}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* HIGHLIGHTS TAB */}
        {activeTab === 'highlights' && (
          <div className="space-y-4">
            {/* Filter Pills & Add Highlight */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {['all', 'key_moment', 'decision', 'action', 'risk', 'user_saved'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setHighlightFilter(f)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize border transition-all"
                    style={{
                      background: highlightFilter === f ? '#232326' : 'transparent',
                      color: highlightFilter === f ? '#f7f8f8' : '#8a8f98',
                      borderColor: highlightFilter === f ? '#34343a' : '#23252a',
                    }}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {onOpenCreateHighlight && (
                <button
                  onClick={onOpenCreateHighlight}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ml-auto"
                  style={{ background: '#18182f', borderColor: 'rgba(113,112,255,0.3)', color: '#828fff' }}
                >
                  <Plus className="w-3 h-3" />
                  Add Highlight
                </button>
              )}
            </div>

            {/* Highlight Cards */}
            {filteredHighlights.length === 0 ? (
              <div className="text-center py-10 text-xs" style={{ color: '#62666d' }}>
                No highlights found in this category.
              </div>
            ) : (
              filteredHighlights.map((hl) => {
                const badge = getCategoryBadge(hl.category, hl.isUserSaved);
                const hSecs = timestampToSeconds(hl.timestamp);

                return (
                  <div
                    key={hl.id}
                    className="p-4 rounded-xl border space-y-2.5 transition-all group"
                    style={{ background: '#141516', borderColor: '#23252a' }}
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold flex items-center gap-1.5" style={{ color: '#f7f8f8' }}>
                          <Quote className="w-3.5 h-3.5" style={{ color: '#7170ff' }} />
                          {hl.speaker}
                        </span>
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md border"
                          style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            onSeek?.(hSecs);
                            onSelectTimestamp?.(hl.timestamp);
                          }}
                          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border transition-colors"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            background: '#1c1c1f',
                            borderColor: '#34343a',
                            color: '#828fff',
                          }}
                          title="Jump playback to this timestamp"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          {hl.timestamp}
                        </button>

                        {hl.isUserSaved && onDeleteHighlight && (
                          <button
                            onClick={() => onDeleteHighlight(hl.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                            style={{ color: '#62666d' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#eb5757')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#62666d')}
                            title="Delete custom highlight"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <blockquote
                      className="text-xs sm:text-sm italic pl-3 py-0.5"
                      style={{ borderLeft: '2px solid #7170ff', color: '#d0d6e0' }}
                    >
                      &quot;{hl.quote}&quot;
                    </blockquote>

                    {hl.significance && (
                      <p className="text-[11px] leading-normal" style={{ color: '#8a8f98' }}>
                        <strong className="font-medium" style={{ color: '#d0d6e0' }}>Significance: </strong>
                        {hl.significance}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

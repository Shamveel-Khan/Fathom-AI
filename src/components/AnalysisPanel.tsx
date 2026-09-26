'use client';

import React, { useState } from 'react';
import { StoredMeetingAnalysis, MeetingHighlight } from '@/lib/schemas/meeting';
import { ActionItem } from '@/lib/schemas/analysis';
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
  Bookmark,
  AlertTriangle,
  HelpCircle,
  Plus,
  Play,
} from 'lucide-react';

interface AnalysisPanelProps {
  analysis: StoredMeetingAnalysis | null;
  isLoading: boolean;
  onSelectTimestamp?: (timestamp: string) => void;
  onSeek?: (seconds: number) => void;
  onTriggerAnalyze: () => void;
  onToggleActionItem?: (actionId: string, completed: boolean) => Promise<void>;
  onUpdateActionItem?: (actionId: string, updates: { completed?: boolean; assignee?: string; dueDate?: string }) => Promise<void>;
  onDeleteHighlight?: (highlightId: string) => Promise<void>;
  onOpenCreateHighlight?: () => void;
}

type TabType = 'summary' | 'actionItems' | 'decisions' | 'highlights';

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis,
  isLoading,
  onSelectTimestamp,
  onSeek,
  onTriggerAnalyze,
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
    const nextCompleted = !currentCompleted;
    // Optimistic UI update
    setActionItemsState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: nextCompleted } : item))
    );
    // Call server to persist
    if (onToggleActionItem) {
      try {
        await onToggleActionItem(id, nextCompleted);
      } catch (err) {
        console.error('Failed to toggle action item:', err);
        // Rollback on error
        setActionItemsState((prev) =>
          prev.map((item) => (item.id === id ? { ...item, completed: currentCompleted } : item))
        );
      }
    }
  };

  const handleStartEditAction = (e: React.MouseEvent, item: ActionItem) => {
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

  // Filter highlights
  const highlightsList = analysis?.highlights || [];
  const filteredHighlights = highlightsList.filter((h) => {
    if (highlightFilter === 'all') return true;
    if (highlightFilter === 'user_saved') return h.isUserSaved;
    return h.category === highlightFilter;
  });

  const getCategoryBadge = (cat?: string, isUserSaved?: boolean) => {
    switch (cat) {
      case 'decision':
        return { label: 'Decision', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'action':
        return { label: 'Action Item', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'risk':
        return { label: 'Risk', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'question':
        return { label: 'Question', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'user_saved':
      default:
        return isUserSaved
          ? { label: 'User Saved', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
          : { label: 'Key Moment', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-spin" />
            <h2 className="text-sm font-semibold text-slate-800">Analyzing Meeting Intelligence...</h2>
          </div>
          <div className="h-4 w-20 bg-slate-200 rounded-full animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-slate-200 rounded-md w-3/4 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded-md w-full animate-pulse" />
          <div className="h-4 bg-slate-200 rounded-md w-5/6 animate-pulse" />
          <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">No AI Analysis Generated Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
          Extract structured executive summaries, actionable checklists, core decisions, and timestamped highlights in seconds.
        </p>
        <button
          onClick={onTriggerAnalyze}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all hover:shadow-indigo-200 hover:shadow-md cursor-pointer"
        >
          <span>Run AI Analysis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Tabs & Export */}
      <div className="border-b border-slate-200 bg-slate-50/50 p-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2 flex-wrap">
        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'summary'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('actionItems')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'actionItems'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Action Items</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold">
              {actionItemsState.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('decisions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'decisions'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-600" />
            <span>Decisions</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold">
              {analysis.decisions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('highlights')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'highlights'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5 text-rose-600" />
            <span>Highlights</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold">
              {highlightsList.length}
            </span>
          </button>
        </div>

        {/* Copy Markdown Button */}
        <button
          onClick={handleCopyMarkdown}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/70 border border-slate-200 bg-white transition-all ml-auto"
          title="Copy markdown export"
        >
          {copiedMarkdown ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied Markdown</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy All</span>
            </>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Executive Overview
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                {analysis.executiveSummary}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Key Takeaways
              </h3>
              <ul className="space-y-2.5">
                {analysis.keyTakeaways.map((takeaway, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
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
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Action Items ({actionItemsState.filter((a) => a.completed).length}/{actionItemsState.length} done)
              </h3>
              <span className="text-[11px] text-slate-400">Click to toggle & save</span>
            </div>
            {actionItemsState.map((item) => {
              const isEditing = editingActionId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => !isEditing && handleToggleAction(item.id, item.completed)}
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all ${
                    item.completed
                      ? 'bg-slate-50/80 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xs'
                  } ${isEditing ? 'cursor-default ring-2 ring-indigo-200' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleAction(item.id, item.completed)}
                    disabled={isEditing}
                    className="w-4 h-4 mt-0.5 rounded-sm text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs sm:text-sm font-medium ${
                        item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {item.task}
                    </p>
                    {item.context && (
                      <p className="text-[11px] text-slate-500 mt-1 italic leading-tight">
                        &quot;{item.context}&quot;
                      </p>
                    )}

                    {isEditing ? (
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Assignee</label>
                            <input
                              type="text"
                              value={editAssignee}
                              onChange={(e) => setEditAssignee(e.target.value)}
                              placeholder="e.g. Sarah Chen"
                              className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Due Date</label>
                            <input
                              type="text"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              placeholder="e.g. Oct 25, 2026"
                              className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:outline-hidden"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={handleCancelActionEdit}
                            className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => handleSaveActionEdit(e, item.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-2xs"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {item.assignee && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-medium border border-indigo-100">
                            <User className="w-3 h-3" />
                            {item.assignee}
                          </span>
                        )}
                        {item.dueDate && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                            <Clock className="w-3 h-3" />
                            Due: {item.dueDate}
                          </span>
                        )}
                        <button
                          onClick={(e) => handleStartEditAction(e, item)}
                          className="text-[10px] text-slate-400 hover:text-indigo-600 transition-colors ml-auto underline"
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
          <div className="space-y-3.5 animate-in fade-in duration-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Agreed Decisions
            </h3>
            {analysis.decisions.map((dec) => {
              const decSecs = dec.timestampSeconds ?? (dec.timestamp ? timestampToSeconds(dec.timestamp) : 0);

              return (
                <div
                  key={dec.id}
                  className="p-4 rounded-xl border border-amber-200/70 bg-amber-50/30 space-y-2 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                      {dec.decision}
                    </h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {dec.madeBy && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
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
                          className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border border-amber-300 bg-amber-100/60 hover:bg-amber-200 text-amber-900 transition-colors font-medium cursor-pointer"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          {dec.timestamp}
                        </button>
                      )}
                    </div>
                  </div>
                  {dec.rationale && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-amber-100">
                      <strong className="font-medium text-slate-700">Rationale: </strong>
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
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Filter Pills & Add Highlight button */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {['all', 'key_moment', 'decision', 'action', 'risk', 'user_saved'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setHighlightFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all ${
                      highlightFilter === f
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {onOpenCreateHighlight && (
                <button
                  onClick={onOpenCreateHighlight}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors ml-auto"
                >
                  <Plus className="w-3 h-3" />
                  Add Highlight
                </button>
              )}
            </div>

            {/* Highlight Cards */}
            {filteredHighlights.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No highlights found in this category.
              </div>
            ) : (
              filteredHighlights.map((hl) => {
                const badge = getCategoryBadge(hl.category, hl.isUserSaved);
                const hSecs = timestampToSeconds(hl.timestamp);

                return (
                  <div
                    key={hl.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2.5 shadow-2xs group"
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Quote className="w-3.5 h-3.5 text-indigo-500" />
                          {hl.speaker}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Seek button */}
                        <button
                          onClick={() => {
                            onSeek?.(hSecs);
                            onSelectTimestamp?.(hl.timestamp);
                          }}
                          className="flex items-center gap-1 text-[11px] font-mono text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                          title="Jump playback to this timestamp"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          {hl.timestamp}
                        </button>

                        {/* Delete User Highlight */}
                        {hl.isUserSaved && onDeleteHighlight && (
                          <button
                            onClick={() => onDeleteHighlight(hl.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                            title="Delete custom highlight"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <blockquote className="text-xs sm:text-sm italic text-slate-700 border-l-2 border-indigo-400 pl-3 py-0.5">
                      &quot;{hl.quote}&quot;
                    </blockquote>

                    {hl.significance && (
                      <p className="text-[11px] text-slate-500 leading-normal">
                        <strong className="font-medium text-slate-700">Significance: </strong>
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

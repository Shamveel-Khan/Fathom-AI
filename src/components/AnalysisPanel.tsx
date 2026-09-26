'use client';

import React, { useState } from 'react';
import { MeetingAnalysis, ActionItem } from '@/lib/schemas/analysis';
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
} from 'lucide-react';

interface AnalysisPanelProps {
  analysis: MeetingAnalysis | null;
  isLoading: boolean;
  onSelectTimestamp?: (timestamp: string) => void;
  onTriggerAnalyze: () => void;
}

type TabType = 'summary' | 'actionItems' | 'decisions' | 'highlights';

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis,
  isLoading,
  onSelectTimestamp,
  onTriggerAnalyze,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [actionItemsState, setActionItemsState] = useState<ActionItem[]>([]);

  // Synchronize local action items state when analysis updates
  React.useEffect(() => {
    if (analysis?.actionItems) {
      setActionItemsState(analysis.actionItems);
    }
  }, [analysis]);

  const toggleActionItem = (id: string) => {
    setActionItemsState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
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
    analysis.highlights.forEach((h) => {
      md += `* [${h.timestamp}] *"${h.quote}"* — **${h.speaker}** (${h.significance})\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  // Loading Skeleton State
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
          <div className="space-y-2 pt-2">
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Empty State
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
              {analysis.highlights.length}
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
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
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
            </div>
            {actionItemsState.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleActionItem(item.id)}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  item.completed
                    ? 'bg-slate-50/80 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xs'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => {}} // handled by parent div onClick
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
                  {item.assignee && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-medium border border-indigo-100">
                        <User className="w-3 h-3" />
                        {item.assignee}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DECISIONS TAB */}
        {activeTab === 'decisions' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Agreed Decisions
            </h3>
            {analysis.decisions.map((dec) => (
              <div
                key={dec.id}
                className="p-4 rounded-xl border border-amber-200/70 bg-amber-50/30 space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                    {dec.decision}
                  </h4>
                  {dec.madeBy && (
                    <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      {dec.madeBy}
                    </span>
                  )}
                </div>
                {dec.rationale && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-amber-100">
                    <strong className="font-medium text-slate-700">Rationale: </strong>
                    {dec.rationale}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* HIGHLIGHTS TAB */}
        {activeTab === 'highlights' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Key Quotes & Pivotal Moments
            </h3>
            {analysis.highlights.map((hl) => (
              <div
                key={hl.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Quote className="w-3.5 h-3.5 text-indigo-500" />
                    {hl.speaker}
                  </span>
                  <button
                    onClick={() => onSelectTimestamp?.(hl.timestamp)}
                    className="flex items-center gap-1 text-[11px] font-mono text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                    title="Jump to utterance in transcript"
                  >
                    <Clock className="w-3 h-3" />
                    {hl.timestamp}
                  </button>
                </div>
                <blockquote className="text-xs sm:text-sm italic text-slate-700 border-l-2 border-indigo-400 pl-3 py-0.5">
                  &quot;{hl.quote}&quot;
                </blockquote>
                <p className="text-[11px] text-slate-500 leading-normal">
                  <strong className="font-medium text-slate-700">Significance: </strong>
                  {hl.significance}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

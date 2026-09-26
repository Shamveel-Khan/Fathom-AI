'use client';

import React, { useState } from 'react';
import { Meeting } from '@/lib/schemas/meeting';
import { X, Copy, Check, Download, FileText, Sparkles, ShieldAlert, ListFilter } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
}

type ExportType = 'full' | 'transcript' | 'review' | 'actionItems';

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, meeting }) => {
  const [activeTab, setActiveTab] = useState<ExportType>('full');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Generate payload according to activeTab
  const generatePayload = (): string => {
    if (activeTab === 'transcript') {
      let text = `# Transcript: ${meeting.title}\n`;
      text += `Date: ${meeting.date} | Duration: ${meeting.durationMinutes}m\n\n`;
      (meeting.transcript || []).forEach((u) => {
        const role = u.speakerRole ? ` (${u.speakerRole})` : '';
        text += `[${u.timestamp}] ${u.speaker}${role}: ${u.text}\n\n`;
      });
      return text;
    }

    if (activeTab === 'review') {
      if (!meeting.review) return `# AI Review & Gap Analysis: ${meeting.title}\n\nNo AI Review available.`;
      const rev = meeting.review;
      let text = `# AI Review & Risk Audit: ${meeting.title}\n`;
      text += `Overall Score: ${rev.overallScore}/100\n\n`;
      text += `## Executive Audit\n${rev.summary}\n\n`;

      if (rev.unresolvedQuestions?.length) {
        text += `## Unresolved Questions\n`;
        rev.unresolvedQuestions.forEach((q) => {
          text += `* [${q.severity.toUpperCase()}] **${q.question}** (Raised by: ${q.raisedBy || 'N/A'})\n  * Context: ${q.context || 'N/A'}\n`;
        });
        text += `\n`;
      }

      if (rev.unassignedResponsibilities?.length) {
        text += `## Unassigned Responsibilities\n`;
        rev.unassignedResponsibilities.forEach((u) => {
          text += `* **${u.task}** (Suggested Role: ${u.suggestedRole || 'Unassigned'})\n`;
        });
        text += `\n`;
      }

      if (rev.missingDeadlines?.length) {
        text += `## Missing Deadlines\n`;
        rev.missingDeadlines.forEach((m) => {
          text += `* **${m.task}** (@${m.assignee || 'Unassigned'}) — Urgency: ${m.urgency}\n`;
        });
        text += `\n`;
      }

      if (rev.potentialRisks?.length) {
        text += `## Potential Risks & Mitigations\n`;
        rev.potentialRisks.forEach((r) => {
          text += `* [${r.severity.toUpperCase()}] **${r.risk}**\n  * Mitigation: ${r.mitigation || 'N/A'}\n`;
        });
        text += `\n`;
      }

      return text;
    }

    if (activeTab === 'actionItems') {
      let text = `# Action Items: ${meeting.title}\n\n`;
      (meeting.analysis?.actionItems || []).forEach((act) => {
        const check = act.completed ? '[x]' : '[ ]';
        const assignee = act.assignee ? ` (@${act.assignee})` : '';
        const due = act.dueDate ? ` [Due: ${act.dueDate}]` : '';
        text += `- ${check} **${act.task}**${assignee}${due}\n`;
      });
      return text;
    }

    // Default: Full Markdown with deep-link timestamps
    let md = `# ${meeting.title}\n\n`;
    md += `**Date**: ${meeting.date} | **Duration**: ${meeting.durationMinutes} min\n`;
    md += `**Participants**: ${meeting.participants.map((p) => p.name).join(', ')}\n\n`;

    if (meeting.analysis) {
      md += `## Executive Summary\n${meeting.analysis.executiveSummary}\n\n`;

      if (meeting.analysis.keyTakeaways?.length) {
        md += `## Key Takeaways\n`;
        meeting.analysis.keyTakeaways.forEach((k) => {
          md += `* ${k}\n`;
        });
        md += `\n`;
      }

      if (meeting.analysis.actionItems?.length) {
        md += `## Action Items\n`;
        meeting.analysis.actionItems.forEach((a) => {
          const status = a.completed ? '[x]' : '[ ]';
          const assigneeStr = a.assignee ? ` (@${a.assignee})` : '';
          const due = a.dueDate ? ` [Due: ${a.dueDate}]` : '';
          md += `- ${status} **${a.task}**${assigneeStr}${due}\n`;
        });
        md += `\n`;
      }

      if (meeting.analysis.decisions?.length) {
        md += `## Key Decisions\n`;
        meeting.analysis.decisions.forEach((d) => {
          const tsSec = d.timestampSeconds ?? 0;
          const deepLink = `${baseUrl}/meetings/${meeting.id}?t=${tsSec}`;
          md += `* [${d.timestamp || '00:00'}](${deepLink}) **${d.decision}**\n  * Rationale: ${d.rationale || 'N/A'}\n`;
        });
        md += `\n`;
      }

      if (meeting.analysis.highlights?.length) {
        md += `## Timestamped Highlights\n`;
        meeting.analysis.highlights.forEach((h) => {
          const tsSec = (meeting.transcript || []).find((u) => u.timestamp === h.timestamp)?.timestampSeconds || 0;
          const deepLink = `${baseUrl}/meetings/${meeting.id}?t=${tsSec}`;
          md += `* [${h.timestamp}](${deepLink}) *"${h.quote}"* — **${h.speaker}** (${h.significance})\n`;
        });
        md += `\n`;
      }
    }

    if (meeting.review) {
      md += `## AI Review & Accountability Audit (Score: ${meeting.review.overallScore}/100)\n`;
      md += `${meeting.review.summary}\n\n`;
    }

    return md;
  };

  const payload = generatePayload();

  const handleCopy = () => {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (ext: 'md' | 'txt') => {
    const filename = `${meeting.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${activeTab}.${ext}`;
    const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Export Meeting Intelligence</h2>
              <p className="text-[11px] text-slate-500">Copy or download meeting notes, deep links, and transcripts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex items-center gap-1.5 px-6 pt-4 border-b border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('full')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'full'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Report</span>
          </button>
          <button
            onClick={() => setActiveTab('actionItems')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'actionItems'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Action Items</span>
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'review'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>AI Risk Review</span>
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'transcript'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Transcript</span>
          </button>
        </div>

        {/* Preview content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="bg-white rounded-xl border border-slate-200 p-4 font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto shadow-2xs">
            {payload}
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-4 sm:px-6 border-t border-slate-100 bg-white flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload('md')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download .md</span>
            </button>
            <button
              onClick={() => handleDownload('txt')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download .txt</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

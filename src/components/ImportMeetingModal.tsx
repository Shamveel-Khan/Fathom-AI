'use client';

import React, { useState, useRef } from 'react';
import { ImportMeetingSchema, ImportMeetingInput } from '@/lib/schemas/import';
import { getTemplateDefinition } from '@/lib/templates/definitions';
import {
  X,
  Upload,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileJson,
  Users,
  Clock,
  Calendar,
  ShieldAlert,
  CheckSquare,
  Scale,
  Highlighter,
  ArrowRight,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

interface ImportMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (meeting: unknown) => void;
}

type TabMode = 'upload' | 'paste' | 'samples';

export const ImportMeetingModal: React.FC<ImportMeetingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('upload');
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationDetails, setValidationDetails] = useState<string[]>([]);
  const [parsedMeeting, setParsedMeeting] = useState<ImportMeetingInput | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateAndSetJson = (rawString: string, originFileName?: string) => {
    setJsonText(rawString);
    setFileName(originFileName || null);
    setValidationError(null);
    setValidationDetails([]);
    setParsedMeeting(null);

    if (!rawString.trim()) return;

    try {
      const parsed = JSON.parse(rawString);
      const targetPayload =
        typeof parsed === 'object' && parsed !== null && 'meeting' in parsed
          ? (parsed as Record<string, unknown>).meeting
          : parsed;

      const result = ImportMeetingSchema.safeParse(targetPayload);

      if (!result.success) {
        const issues = result.error.issues.map(
          (issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`
        );
        setValidationError(`Invalid meeting JSON format (${issues.length} issue${issues.length > 1 ? 's' : ''})`);
        setValidationDetails(issues.slice(0, 6));
      } else {
        setParsedMeeting(result.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON syntax';
      setValidationError(`Syntax Error: ${msg}`);
      setValidationDetails(['Please check for missing brackets, quotes, or trailing commas.']);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      validateAndSetJson(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const handleLoadSample = async (sampleNum: 1 | 2 | 3) => {
    try {
      let sampleData: unknown;
      let sampleTitle = '';
      if (sampleNum === 1) {
        sampleTitle = 'H2 Product Strategy & AI Memory Architecture';
        sampleData = await import('@/../demo/meeting-1.json');
      } else if (sampleNum === 2) {
        sampleTitle = 'Enterprise Sales Discovery: Acme Global';
        sampleData = await import('@/../demo/meeting-2.json');
      } else {
        sampleTitle = 'Engineering Sync: Zero-Downtime Database Migration';
        sampleData = await import('@/../demo/meeting-3.json');
      }

      // If module loader exports default
      const jsonContent = (sampleData as { default?: unknown }).default || sampleData;
      const str = JSON.stringify(jsonContent, null, 2);
      validateAndSetJson(str, `meeting-${sampleNum}.json (${sampleTitle})`);
      setActiveTab('upload');
    } catch (err) {
      console.error('Failed to load sample:', err);
      setValidationError('Failed to load sample demo file.');
    }
  };

  const handleImportSubmit = async () => {
    if (!parsedMeeting) return;

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const res = await fetch('/api/meetings/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedMeeting),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setValidationError(data.error || 'Failed to import meeting.');
        if (data.details) {
          setValidationDetails(
            (data.details as Array<{ path: string[]; message: string }>).map(
              (d) => `${d.path.join('.')}: ${d.message}`
            )
          );
        }
        setIsSubmitting(false);
        return;
      }

      onSuccess(data.meeting);
      onClose();
    } catch {
      setValidationError('Network error while communicating with server.');
      setIsSubmitting(false);
    }
  };

  const tpl = parsedMeeting ? getTemplateDefinition(parsedMeeting.template) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Import Meeting JSON</h2>
              <p className="text-[11px] text-slate-500">
                Upload your meeting transcripts, summaries, action items, and AI reviews
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'paste'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Paste JSON</span>
            </button>
          </div>

          {/* Quick Demo Pre-fills */}
          <div className="flex items-center gap-1.5 pb-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Demo Files:
            </span>
            <button
              onClick={() => handleLoadSample(1)}
              className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold border border-indigo-200 transition-colors"
              title="Load Strategy Demo"
            >
              Strategy
            </button>
            <button
              onClick={() => handleLoadSample(2)}
              className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-semibold border border-amber-200 transition-colors"
              title="Load Sales Demo"
            >
              Sales
            </button>
            <button
              onClick={() => handleLoadSample(3)}
              className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold border border-emerald-200 transition-colors"
              title="Load Eng Sync Demo"
            >
              Eng Sync
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'upload' ? (
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 scale-101'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-indigo-600 mx-auto mb-3">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                  {fileName ? (
                    <span className="text-indigo-600 font-bold">{fileName}</span>
                  ) : (
                    'Click to select or drag and drop a meeting JSON file'
                  )}
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Supports full meeting objects with transcripts, AI summaries, and reviews.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Raw Meeting JSON</label>
              <textarea
                rows={9}
                value={jsonText}
                onChange={(e) => validateAndSetJson(e.target.value)}
                placeholder={`{\n  "title": "Weekly Strategy Sync",\n  "date": "Oct 28, 2026",\n  "durationMinutes": 30,\n  "participants": [{ "name": "Sarah Chen" }],\n  "transcript": [{ "speaker": "Sarah Chen", "timestamp": "00:00", "text": "Hello team." }]\n}`}
                className="w-full font-mono text-xs p-3.5 bg-slate-900 text-slate-100 rounded-xl border border-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
              />
            </div>
          )}

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-xs font-semibold">{validationError}</span>
              </div>
              {validationDetails.length > 0 && (
                <ul className="text-[11px] text-rose-700 list-disc list-inside space-y-0.5 pl-2 font-mono">
                  {validationDetails.map((det, i) => (
                    <li key={i}>{det}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Validated Meeting Preview Card */}
          {parsedMeeting && tpl && (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4.5 space-y-3.5 animate-in fade-in duration-200 shadow-2xs">
              <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-950">Valid Meeting Schema Ready</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tpl.bgLight} ${tpl.color} ${tpl.borderLight}`}>
                  {tpl.badge}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{parsedMeeting.title}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {parsedMeeting.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {parsedMeeting.durationMinutes}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {parsedMeeting.participants.length} participants
                  </span>
                  <span className="text-slate-600 font-medium">
                    {parsedMeeting.transcript.length} transcript turns
                  </span>
                </div>
              </div>

              {/* Badges preview row */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-100/60">
                {parsedMeeting.analysis ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-2.5 h-2.5" />
                      Executive Summary Included
                    </span>
                    {parsedMeeting.analysis.actionItems?.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckSquare className="w-2.5 h-2.5" />
                        {parsedMeeting.analysis.actionItems.length} Action Items
                      </span>
                    )}
                    {parsedMeeting.analysis.decisions?.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Scale className="w-2.5 h-2.5" />
                        {parsedMeeting.analysis.decisions.length} Decisions
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    No Analysis (Can be generated later)
                  </span>
                )}

                {parsedMeeting.review && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    <ShieldAlert className="w-2.5 h-2.5" />
                    AI Review (Score: {parsedMeeting.review.overallScore}/100)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            {parsedMeeting ? 'Click confirm to save to your Neon database.' : 'Upload or paste a JSON file to preview.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImportSubmit}
              disabled={!parsedMeeting || isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <span>Confirm Import</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

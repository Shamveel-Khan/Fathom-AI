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

const TEMPLATE_ACCENT: Record<string, string> = {
  general:   '#7170ff',
  one_on_one:'#bdc2ff',
  sales:     '#68cc58',
  interview: '#7a7fad',
  project:   '#d4b144',
};

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
  const accent = parsedMeeting ? (TEMPLATE_ACCENT[parsedMeeting.template || 'general'] || '#7170ff') : '#7170ff';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(1, 1, 2, 0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background: '#0f1011', borderColor: '#23252a' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 sm:px-6 border-b"
          style={{ background: '#141516', borderColor: '#23252a' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg border flex items-center justify-center"
              style={{ background: '#18182f', borderColor: 'rgba(113,112,255,0.3)', color: '#828fff' }}
            >
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#f7f8f8' }}>Import Meeting JSON</h2>
              <p className="text-[11px]" style={{ color: '#8a8f98' }}>
                Upload transcripts, summaries, action items, and AI reviews
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#62666d' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f7f8f8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#62666d')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div
          className="flex items-center justify-between px-6 pt-3 border-b"
          style={{ background: '#0f1011', borderColor: '#23252a' }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors"
              style={{
                borderBottomColor: activeTab === 'upload' ? '#7170ff' : 'transparent',
                color: activeTab === 'upload' ? '#f7f8f8' : '#8a8f98',
              }}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors"
              style={{
                borderBottomColor: activeTab === 'paste' ? '#7170ff' : 'transparent',
                color: activeTab === 'paste' ? '#f7f8f8' : '#8a8f98',
              }}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Paste JSON</span>
            </button>
          </div>

          {/* Quick Demo Pre-fills */}
          <div className="flex items-center gap-1.5 pb-1">
            <span
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: '#62666d', letterSpacing: '0.06em' }}
            >
              Demo:
            </span>
            <button
              onClick={() => handleLoadSample(1)}
              className="px-2 py-0.5 rounded text-[10px] font-medium border transition-colors"
              style={{ background: '#18182f', color: '#828fff', borderColor: 'rgba(113,112,255,0.3)' }}
              title="Load Strategy Demo"
            >
              Strategy
            </button>
            <button
              onClick={() => handleLoadSample(2)}
              className="px-2 py-0.5 rounded text-[10px] font-medium border transition-colors"
              style={{ background: 'rgba(104,204,88,0.1)', color: '#68cc58', borderColor: 'rgba(104,204,88,0.3)' }}
              title="Load Sales Demo"
            >
              Sales
            </button>
            <button
              onClick={() => handleLoadSample(3)}
              className="px-2 py-0.5 rounded text-[10px] font-medium border transition-colors"
              style={{ background: 'rgba(212,177,68,0.1)', color: '#d4b144', borderColor: 'rgba(212,177,68,0.3)' }}
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
                className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
                style={{
                  background: isDragging ? 'rgba(113,112,255,0.06)' : '#141516',
                  borderColor: isDragging ? '#7170ff' : '#23252a',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  className="w-12 h-12 rounded-xl border flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#1c1c1f', borderColor: '#34343a', color: '#7170ff' }}
                >
                  <FolderOpen className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-semibold mb-1" style={{ color: '#f7f8f8' }}>
                  {fileName ? (
                    <span style={{ color: '#828fff' }}>{fileName}</span>
                  ) : (
                    'Click to select or drag and drop a meeting JSON file'
                  )}
                </p>
                <p className="text-[11px] max-w-xs mx-auto" style={{ color: '#8a8f98' }}>
                  Supports full meeting objects with transcripts, AI summaries, and reviews.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-medium" style={{ color: '#8a8f98' }}>Raw Meeting JSON</label>
              <textarea
                rows={9}
                value={jsonText}
                onChange={(e) => validateAndSetJson(e.target.value)}
                placeholder={`{\n  "title": "Weekly Strategy Sync",\n  "date": "Oct 28, 2026",\n  "durationMinutes": 30,\n  "participants": [{ "name": "Sarah Chen" }],\n  "transcript": [{ "speaker": "Sarah Chen", "timestamp": "00:00", "text": "Hello team." }]\n}`}
                className="w-full text-xs p-3.5 rounded-xl border focus:outline-none transition-colors"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: '#08090a',
                  borderColor: '#23252a',
                  color: '#f7f8f8',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#23252a')}
              />
            </div>
          )}

          {/* Validation Error Banner */}
          {validationError && (
            <div
              className="p-3.5 rounded-xl border space-y-1.5"
              style={{ background: 'rgba(235,87,87,0.08)', borderColor: 'rgba(235,87,87,0.3)', color: '#eb5757' }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold">{validationError}</span>
              </div>
              {validationDetails.length > 0 && (
                <ul className="text-[11px] list-disc list-inside space-y-0.5 pl-2 font-mono" style={{ color: '#eb5757' }}>
                  {validationDetails.map((det, i) => (
                    <li key={i}>{det}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Validated Meeting Preview Card */}
          {parsedMeeting && tpl && (
            <div
              className="rounded-xl p-4 space-y-3 border"
              style={{ background: '#141516', borderColor: 'rgba(104,204,88,0.3)' }}
            >
              <div className="flex items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: '#23252a' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#68cc58' }} />
                  <span className="text-xs font-semibold" style={{ color: '#68cc58' }}>Valid Meeting Schema Ready</span>
                </div>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded border"
                  style={{ background: `${accent}15`, color: accent, borderColor: `${accent}30` }}
                >
                  {tpl.badge}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold leading-snug" style={{ color: '#f7f8f8' }}>{parsedMeeting.title}</h3>
                <div
                  className="flex flex-wrap items-center gap-3 mt-1.5 text-xs"
                  style={{ color: '#8a8f98', fontFamily: "'JetBrains Mono', monospace" }}
                >
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
                  <span style={{ color: '#828fff' }}>
                    {parsedMeeting.transcript.length} turns
                  </span>
                </div>
              </div>

              {/* Badges preview row */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t" style={{ borderColor: '#23252a' }}>
                {parsedMeeting.analysis ? (
                  <>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border"
                      style={{ background: '#18182f', color: '#828fff', borderColor: 'rgba(113,112,255,0.2)' }}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      Executive Summary Included
                    </span>
                    {parsedMeeting.analysis.actionItems && parsedMeeting.analysis.actionItems.length > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border"
                        style={{ background: 'rgba(104,204,88,0.1)', color: '#68cc58', borderColor: 'rgba(104,204,88,0.2)' }}
                      >
                        <CheckSquare className="w-2.5 h-2.5" />
                        {parsedMeeting.analysis.actionItems.length} Action Items
                      </span>
                    )}
                    {parsedMeeting.analysis.decisions && parsedMeeting.analysis.decisions.length > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border"
                        style={{ background: 'rgba(212,177,68,0.1)', color: '#d4b144', borderColor: 'rgba(212,177,68,0.2)' }}
                      >
                        <Scale className="w-2.5 h-2.5" />
                        {parsedMeeting.analysis.decisions.length} Decisions
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#1c1c1f', color: '#8a8f98' }}>
                    No Analysis (Can be generated later)
                  </span>
                )}

                {parsedMeeting.review && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border"
                    style={{ background: '#18182f', color: '#828fff', borderColor: 'rgba(113,112,255,0.2)' }}
                  >
                    <ShieldAlert className="w-2.5 h-2.5" />
                    AI Review ({parsedMeeting.review.overallScore}/100)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-4 sm:px-6 border-t flex items-center justify-between gap-3"
          style={{ background: '#141516', borderColor: '#23252a' }}
        >
          <p className="text-[11px]" style={{ color: '#62666d' }}>
            {parsedMeeting ? 'Click confirm to save to your database.' : 'Upload or paste a JSON file to preview.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ color: '#8a8f98' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f7f8f8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8f98')}
            >
              Cancel
            </button>
            <button
              onClick={handleImportSubmit}
              disabled={!parsedMeeting || isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
              style={{ background: '#ffffff', color: '#08090a' }}
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

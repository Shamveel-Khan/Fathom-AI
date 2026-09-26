'use client';

import React, { useState, useEffect } from 'react';
import { SEED_MEETING } from '@/data/seedMeeting';
import { MeetingAnalysis } from '@/lib/schemas/analysis';
import { MeetingHeader } from '@/components/MeetingHeader';
import { TranscriptViewer } from '@/components/TranscriptViewer';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { AlertCircle, X, Sparkles, Key, CheckCircle2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'fathom_ai_api_key';
const LOCAL_STORAGE_BASE_URL = 'fathom_ai_base_url';
const LOCAL_STORAGE_MODEL = 'fathom_ai_model';

export default function Home() {
  const [meeting] = useState(SEED_MEETING);
  const [apiKey, setApiKey] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [model, setModel] = useState<string>('gpt-4o-mini');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  const [analysis, setAnalysis] = useState<MeetingAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [highlightedTimestamp, setHighlightedTimestamp] = useState<string | null>(null);

  // Load stored credentials on client mount
  useEffect(() => {
    try {
      const storedKey = localStorage.getItem(LOCAL_STORAGE_KEY) || '';
      const storedBaseUrl = localStorage.getItem(LOCAL_STORAGE_BASE_URL) || '';
      const storedModel = localStorage.getItem(LOCAL_STORAGE_MODEL) || 'gpt-4o-mini';

      setApiKey(storedKey);
      setBaseUrl(storedBaseUrl);
      setModel(storedModel);
    } catch {
      // LocalStorage access fail fallback
    }
  }, []);

  const handleSaveApiKey = (newKey: string, newBaseUrl?: string, newModel?: string) => {
    setApiKey(newKey);
    setBaseUrl(newBaseUrl || '');
    setModel(newModel || 'gpt-4o-mini');

    try {
      if (newKey) {
        localStorage.setItem(LOCAL_STORAGE_KEY, newKey);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }

      if (newBaseUrl) {
        localStorage.setItem(LOCAL_STORAGE_BASE_URL, newBaseUrl);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_BASE_URL);
      }

      if (newModel) {
        localStorage.setItem(LOCAL_STORAGE_MODEL, newModel);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_MODEL);
      }
    } catch {
      // LocalStorage failure fallback
    }

    if (error?.code === 'NO_API_KEY' || error?.code === 'INVALID_API_KEY') {
      setError(null);
    }
  };

  const handleRunAnalysis = async (useMock: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }
      if (baseUrl) {
        headers['x-base-url'] = baseUrl;
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transcript: meeting.transcript,
          operation: 'full',
          model,
          useMock,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to analyze meeting');
      }

      setAnalysis(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      const isMissingKey = msg.includes('No OpenAI API key') || msg.includes('NO_API_KEY');
      setError({
        code: isMissingKey ? 'NO_API_KEY' : 'ANALYSIS_ERROR',
        message: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTimestamp = (timestamp: string) => {
    setHighlightedTimestamp(timestamp);
    // Find utterance id and scroll to it
    const utterance = meeting.transcript.find((u) => u.timestamp === timestamp);
    if (utterance) {
      const el = document.getElementById(`transcript-${utterance.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100/70">
      {/* Header */}
      <MeetingHeader
        meeting={meeting}
        hasApiKey={Boolean(apiKey)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onAnalyze={handleRunAnalysis}
        isLoading={isLoading}
        hasAnalysis={Boolean(analysis)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:px-6 lg:px-8 flex flex-col gap-4">
        {/* Error / Alert Banner */}
        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start justify-between gap-3 text-rose-800 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold">Analysis Request Notice</h4>
                <p className="text-xs text-rose-700 mt-0.5">{error.message}</p>
                {error.code === 'NO_API_KEY' && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => setIsApiKeyModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Key className="w-3.5 h-3.5" />
                      Configure API Key
                    </button>
                    <button
                      onClick={() => handleRunAnalysis(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 text-xs font-medium hover:bg-rose-100/50 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Try Instant Demo Mode
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-700 p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2-Column Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[620px] pb-8">
          {/* Left Column: Transcript Viewer (5 cols) */}
          <div className="lg:col-span-5 h-[650px] lg:h-[calc(100vh-210px)] min-h-[500px]">
            <TranscriptViewer
              transcript={meeting.transcript}
              participants={meeting.participants}
              highlightedTimestamp={highlightedTimestamp}
            />
          </div>

          {/* Right Column: AI Analysis Panel (7 cols) */}
          <div className="lg:col-span-7 h-[650px] lg:h-[calc(100vh-210px)] min-h-[500px]">
            <AnalysisPanel
              analysis={analysis}
              isLoading={isLoading}
              onSelectTimestamp={handleSelectTimestamp}
              onTriggerAnalyze={() => handleRunAnalysis(false)}
            />
          </div>
        </div>
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveApiKey}
        baseUrl={baseUrl}
        model={model}
      />
    </div>
  );
}

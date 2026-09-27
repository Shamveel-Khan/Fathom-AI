'use client';

import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, Trash2, X, CheckCircle2, ShieldCheck } from 'lucide-react';

const MODEL_PRESETS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cost Effective - Default)' },
  { id: 'gpt-4o', label: 'GPT-4o (High Reasoning & Executive Quality)' },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet (via OpenAI compatible proxy)' },
  { id: 'deepseek-chat', label: 'DeepSeek Chat (via OpenAI compatible proxy)' },
];

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string, baseUrl?: string, model?: string) => void;
  baseUrl?: string;
  model?: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
  baseUrl = '',
  model = 'gpt-4o-mini',
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [inputBaseUrl, setInputBaseUrl] = useState(baseUrl);
  const [selectedPreset, setSelectedPreset] = useState('gpt-4o-mini');
  const [customModelInput, setCustomModelInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setInputKey(apiKey);
    setInputBaseUrl(baseUrl);
    const isPreset = MODEL_PRESETS.some((m) => m.id === model);
    if (isPreset) {
      setSelectedPreset(model);
      setCustomModelInput('');
    } else {
      setSelectedPreset('custom');
      setCustomModelInput(model || '');
    }
  }, [apiKey, baseUrl, model, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveModel = selectedPreset === 'custom'
      ? (customModelInput.trim() || 'gpt-4o-mini')
      : selectedPreset;

    onSaveKey(inputKey.trim(), inputBaseUrl.trim() || undefined, effectiveModel || undefined);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setInputKey('');
    setInputBaseUrl('');
    setSelectedPreset('gpt-4o-mini');
    setCustomModelInput('');
    onSaveKey('', undefined, undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(1, 1, 2, 0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 border shadow-2xl"
        style={{ background: '#0f1011', borderColor: '#23252a' }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: '#23252a' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl border flex items-center justify-center"
              style={{ background: '#18182f', borderColor: 'rgba(113,112,255,0.3)', color: '#828fff' }}
            >
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: '#f7f8f8' }}>LLM API Configuration</h3>
              <p className="text-[11px]" style={{ color: '#8a8f98' }}>Bring Your Own Key (BYOK)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: '#62666d' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f7f8f8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#62666d')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
            >
              OpenAI / Compatible API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="sk-proj-..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full rounded-lg border px-3.5 py-2 pr-10 text-xs focus:outline-none transition-colors"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: '#1c1c1f',
                  borderColor: '#34343a',
                  color: '#f7f8f8',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 transition-colors"
                style={{ color: '#62666d' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f7f8f8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#62666d')}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] flex items-center gap-1" style={{ color: '#62666d' }}>
              <ShieldCheck className="w-3.5 h-3.5 inline" style={{ color: '#68cc58' }} />
              Stored strictly in your local browser storage.
            </p>
          </div>

          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
            >
              Model Name
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full rounded-lg border px-3.5 py-2 text-xs focus:outline-none transition-colors"
              style={{ background: '#1c1c1f', borderColor: '#34343a', color: '#f7f8f8' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
            >
              {MODEL_PRESETS.map((m) => (
                <option key={m.id} value={m.id} style={{ background: '#1c1c1f' }}>
                  {m.label}
                </option>
              ))}
              <option value="custom" style={{ background: '#1c1c1f' }}>
                Custom model (enter identifier)…
              </option>
            </select>
          </div>

          {selectedPreset === 'custom' && (
            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
              >
                Custom Model Identifier
              </label>
              <input
                type="text"
                placeholder="e.g. meta-llama/llama-3.3-70b-instruct or mistralai/mistral-large"
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                required={selectedPreset === 'custom'}
                className="w-full rounded-lg border px-3.5 py-2 text-xs focus:outline-none transition-colors"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: '#1c1c1f',
                  borderColor: '#34343a',
                  color: '#f7f8f8',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
              />
            </div>
          )}

          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
            >
              Custom Base URL <span style={{ color: '#62666d' }}>(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="https://api.openai.com/v1"
              value={inputBaseUrl}
              onChange={(e) => setInputBaseUrl(e.target.value)}
              className="w-full rounded-lg border px-3.5 py-2 text-xs focus:outline-none transition-colors"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: '#1c1c1f',
                borderColor: '#34343a',
                color: '#f7f8f8',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t gap-3" style={{ borderColor: '#23252a' }}>
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                style={{ background: 'rgba(235,87,87,0.08)', borderColor: 'rgba(235,87,87,0.3)', color: '#eb5757' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-lg transition-colors"
                style={{ color: '#8a8f98' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f7f8f8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8f98')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-opacity hover:opacity-90"
                style={{ background: '#ffffff', color: '#08090a' }}
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" style={{ color: '#27a644' }} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Config
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

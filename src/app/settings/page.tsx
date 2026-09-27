'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { AppNav } from '@/components/AppNav';
import { MEETING_TEMPLATES } from '@/lib/templates/definitions';
import { User, Key, Check, AlertCircle, Save, Bot, LayoutTemplate, Palette } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'fathom_ai_api_key';
const LOCAL_STORAGE_BASE_URL = 'fathom_ai_base_url';
const LOCAL_STORAGE_MODEL = 'fathom_ai_model';
const LOCAL_STORAGE_DEFAULT_TEMPLATE = 'fathom_default_template';

const AVATAR_COLORS = [
  { name: 'Emerald', value: 'bg-emerald-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Blue', value: 'bg-blue-600' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Rose', value: 'bg-rose-500' },
  { name: 'Amber', value: 'bg-amber-500' },
  { name: 'Teal', value: 'bg-teal-500' },
  { name: 'Slate', value: 'bg-slate-700' },
];

const MODEL_PRESETS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cost Effective - Default)' },
  { id: 'gpt-4o', label: 'GPT-4o (High Reasoning & Executive Quality)' },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet (via OpenAI compatible proxy)' },
  { id: 'deepseek-chat', label: 'DeepSeek Chat (via OpenAI compatible proxy)' },
];

const TEMPLATE_ACCENT: Record<string, string> = {
  general:   '#7170ff',
  one_on_one:'#bdc2ff',
  sales:     '#68cc58',
  interview: '#7a7fad',
  project:   '#d4b144',
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, mutateUser } = useAuth();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatarColor, setAvatarColor] = useState('bg-indigo-500');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [selectedModelPreset, setSelectedModelPreset] = useState('gpt-4o-mini');
  const [customModelInput, setCustomModelInput] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [defaultTemplate, setDefaultTemplate] = useState('general');
  const [aiSuccess, setAiSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (user) {
      setName(user.name || '');
      setRole(user.role || '');
      setAvatarColor(user.avatarColor || 'bg-indigo-500');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    try {
      setApiKey(localStorage.getItem(LOCAL_STORAGE_KEY) || '');
      setBaseUrl(localStorage.getItem(LOCAL_STORAGE_BASE_URL) || '');
      const storedModel = localStorage.getItem(LOCAL_STORAGE_MODEL) || 'gpt-4o-mini';
      const isPreset = MODEL_PRESETS.some((m) => m.id === storedModel);
      if (isPreset) {
        setSelectedModelPreset(storedModel);
        setCustomModelInput('');
        setModel(storedModel);
      } else {
        setSelectedModelPreset('custom');
        setCustomModelInput(storedModel);
        setModel(storedModel);
      }
      setDefaultTemplate(localStorage.getItem(LOCAL_STORAGE_DEFAULT_TEMPLATE) || 'general');
    } catch {}
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, avatarColor }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        mutateUser(data.user);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 2500);
      } else {
        setProfileError(data.error || 'Failed to update profile');
      }
    } catch {
      setProfileError('Network error while saving profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleModelPresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedModelPreset(val);
    if (val === 'custom') {
      const effective = customModelInput.trim();
      setModel(effective);
    } else {
      setModel(val);
    }
  };

  const handleCustomModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomModelInput(val);
    setModel(val);
  };

  const handleSaveAiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const effectiveModel = selectedModelPreset === 'custom'
        ? (customModelInput.trim() || 'gpt-4o-mini')
        : selectedModelPreset;

      localStorage.setItem(LOCAL_STORAGE_KEY, apiKey.trim());
      baseUrl.trim() ? localStorage.setItem(LOCAL_STORAGE_BASE_URL, baseUrl.trim()) : localStorage.removeItem(LOCAL_STORAGE_BASE_URL);
      localStorage.setItem(LOCAL_STORAGE_MODEL, effectiveModel);
      localStorage.setItem(LOCAL_STORAGE_DEFAULT_TEMPLATE, defaultTemplate);
      setModel(effectiveModel);
      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08090a' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#23252a', borderTopColor: '#7170ff' }} />
      </div>
    );
  }

  const inputClass = "w-full px-3.5 py-2 h-9 rounded-lg border text-sm focus:outline-none transition-colors";
  const inputStyle = { background: '#1c1c1f', borderColor: '#34343a', color: '#f7f8f8' };

  return (
    <div className="min-h-screen" style={{ background: '#08090a' }}>
      <AppNav
        apiKey={apiKey}
        onSaveApiKey={(key, bUrl, mdl) => {
          setApiKey(key);
          if (bUrl !== undefined) setBaseUrl(bUrl);
          if (mdl !== undefined) setModel(mdl);
        }}
        baseUrl={baseUrl}
        model={model}
      />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#f7f8f8', letterSpacing: '-0.012em' }}>
            Settings
          </h1>
          <p className="text-sm" style={{ color: '#8a8f98' }}>
            Manage your profile, AI configuration, and default templates.
          </p>
        </div>

        {/* Profile Section */}
        <div className="rounded-xl border p-6" style={{ background: '#0f1011', borderColor: '#23252a' }}>
          <div className="flex items-center gap-3 pb-5 mb-5 border-b" style={{ borderColor: '#1c1c1f' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#18182f' }}>
              <User className="w-4 h-4" style={{ color: '#7170ff' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#f7f8f8' }}>Profile Information</h2>
              <p className="text-xs" style={{ color: '#62666d' }}>Your name, title, and avatar displayed across meetings</p>
            </div>
          </div>

          {profileError && (
            <div
              className="mb-4 p-3 rounded-lg border flex items-center gap-2 text-xs"
              style={{ background: 'rgba(235,87,87,0.08)', borderColor: 'rgba(235,87,87,0.3)', color: '#eb5757' }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {profileError}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#d0d6e0' }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#d0d6e0' }}>Role / Job Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Head of Product"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#d0d6e0' }}>Email Address</label>
              <input
                type="email"
                value={user.email}
                disabled
                className={inputClass}
                style={{ ...inputStyle, background: '#141516', color: '#62666d', cursor: 'not-allowed' }}
              />
              <p className="text-[10px] mt-1" style={{ color: '#62666d' }}>Email is managed by your account authentication.</p>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: '#d0d6e0' }}>
                <Palette className="w-3.5 h-3.5" />
                Avatar Accent Color
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setAvatarColor(c.value)}
                    className={`w-8 h-8 rounded-full ${c.value} flex items-center justify-center transition-transform cursor-pointer ${
                      avatarColor === c.value ? 'ring-2 ring-offset-2 ring-[#7170ff] scale-110' : 'hover:scale-105'
                    }`}
                    style={{ ringOffset: '#08090a' } as React.CSSProperties}
                  >
                    {avatarColor === c.value && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#ffffff', color: '#08090a' }}
              >
                {profileSuccess ? (
                  <><Check className="w-3.5 h-3.5" style={{ color: '#27a644' }} /> Saved!</>
                ) : (
                  <><Save className="w-3.5 h-3.5" /> {isSavingProfile ? 'Saving…' : 'Save Profile'}</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* AI & BYOK Section */}
        <div className="rounded-xl border p-6" style={{ background: '#0f1011', borderColor: '#23252a' }}>
          <div className="flex items-center gap-3 pb-5 mb-5 border-b" style={{ borderColor: '#1c1c1f' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(104,204,88,0.1)' }}>
              <Bot className="w-4 h-4" style={{ color: '#68cc58' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#f7f8f8' }}>AI Intelligence Engine (BYOK)</h2>
              <p className="text-xs" style={{ color: '#62666d' }}>Configure your personal LLM API endpoint for summaries and audits</p>
            </div>
          </div>

          <form onSubmit={handleSaveAiSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#d0d6e0' }}>
                OpenAI-Compatible API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className={inputClass}
                style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
              />
              <p className="text-[10px] mt-1" style={{ color: '#62666d' }}>
                Stored securely in browser storage and sent directly in API headers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#d0d6e0' }}>Custom Base URL (Optional)</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className={inputClass}
                  style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
                />
                <p className="text-[10px] mt-1" style={{ color: '#62666d' }}>For proxy endpoints or self-hosted Ollama/vLLM.</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#d0d6e0' }}>AI Model</label>
                <select
                  value={selectedModelPreset}
                  onChange={handleModelPresetChange}
                  className={inputClass}
                  style={{ ...inputStyle }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
                >
                  {MODEL_PRESETS.map((m) => (
                    <option key={m.id} value={m.id} style={{ background: '#1c1c1f' }}>{m.label}</option>
                  ))}
                  <option value="custom" style={{ background: '#1c1c1f' }}>Custom model (enter identifier)…</option>
                </select>
                <p className="text-[10px] mt-1" style={{ color: '#62666d' }}>Select a preset or enter a custom model ID.</p>
              </div>
            </div>

            {selectedModelPreset === 'custom' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#d0d6e0' }}>Custom Model Identifier</label>
                <input
                  type="text"
                  value={customModelInput}
                  onChange={handleCustomModelChange}
                  placeholder="e.g. meta-llama/llama-3.3-70b-instruct, mistralai/mistral-large, or qwen/qwen-2.5-72b-instruct"
                  required={selectedModelPreset === 'custom'}
                  className={inputClass}
                  style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
                />
                <p className="text-[10px] mt-1" style={{ color: '#62666d' }}>
                  Specify the exact model name or ID for your OpenAI-compatible endpoint.
                </p>
              </div>
            )}

            {/* Default Template */}
            <div className="pt-2">
              <label className="block text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: '#d0d6e0' }}>
                <LayoutTemplate className="w-3.5 h-3.5" />
                Default Meeting Template
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {Object.values(MEETING_TEMPLATES).map((tpl) => {
                  const accent = TEMPLATE_ACCENT[tpl.id] || '#7170ff';
                  const isSelected = defaultTemplate === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setDefaultTemplate(tpl.id)}
                      className="p-3 rounded-xl border transition-all cursor-pointer"
                      style={{
                        background: isSelected ? 'rgba(113,112,255,0.05)' : '#141516',
                        borderColor: isSelected ? accent : '#23252a',
                      }}
                      onMouseEnter={(e) => !isSelected && (e.currentTarget.style.borderColor = '#34343a')}
                      onMouseLeave={(e) => !isSelected && (e.currentTarget.style.borderColor = '#23252a')}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded"
                          style={{ background: `${accent}15`, color: accent }}
                        >
                          {tpl.badge}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5" style={{ color: accent }} />}
                      </div>
                      <p className="text-xs font-semibold" style={{ color: '#f7f8f8' }}>{tpl.name}</p>
                      <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: '#62666d' }}>{tpl.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: '#ffffff', color: '#08090a' }}
              >
                {aiSuccess ? (
                  <><Check className="w-3.5 h-3.5" style={{ color: '#27a644' }} /> Saved!</>
                ) : (
                  <><Save className="w-3.5 h-3.5" /> Save AI Settings</>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

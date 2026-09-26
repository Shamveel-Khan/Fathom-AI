'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { AppNav } from '@/components/AppNav';
import { MEETING_TEMPLATES } from '@/lib/templates/definitions';
import {
  User,
  Key,
  Sliders,
  Sparkles,
  Check,
  AlertCircle,
  Save,
  Palette,
  Bot,
  LayoutTemplate,
} from 'lucide-react';

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

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, mutateUser } = useAuth();

  // Profile Form
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatarColor, setAvatarColor] = useState('bg-indigo-500');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // BYOK LLM Form
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [defaultTemplate, setDefaultTemplate] = useState('general');
  const [aiSuccess, setAiSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
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
      setModel(localStorage.getItem(LOCAL_STORAGE_MODEL) || 'gpt-4o-mini');
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

  const handleSaveAiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, apiKey.trim());
      if (baseUrl.trim()) {
        localStorage.setItem(LOCAL_STORAGE_BASE_URL, baseUrl.trim());
      } else {
        localStorage.removeItem(LOCAL_STORAGE_BASE_URL);
      }
      localStorage.setItem(LOCAL_STORAGE_MODEL, model.trim() || 'gpt-4o-mini');
      localStorage.setItem(LOCAL_STORAGE_DEFAULT_TEMPLATE, defaultTemplate);
      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account & Workspace Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal profile, Bring-Your-Own-Key (BYOK) AI preferences, and default meeting templates.
          </p>
        </div>

        {/* Section 1: User Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Profile Information</h2>
              <p className="text-[11px] text-slate-500">Your name, title, and avatar color displayed across meetings</p>
            </div>
          </div>

          {profileError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role / Job Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Head of Product"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">Email is managed by your account authentication.</p>
            </div>

            {/* Avatar Color Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-slate-500" />
                Avatar Accent Color
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setAvatarColor(c.value)}
                    className={`w-8 h-8 rounded-full ${c.value} flex items-center justify-center transition-transform cursor-pointer ${
                      avatarColor === c.value ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'hover:scale-105'
                    }`}
                  >
                    {avatarColor === c.value && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {profileSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: AI & LLM Settings (BYOK) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bring-Your-Own-Key (BYOK) AI Intelligence</h2>
              <p className="text-[11px] text-slate-500">Configure your personal LLM API endpoint for summaries and audits</p>
            </div>
          </div>

          <form onSubmit={handleSaveAiSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">OpenAI-Compatible API Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Your key is stored securely in local browser storage and sent directly in API request headers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Custom Base URL (Optional)</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Use for proxy endpoints or self-hosted Ollama/vLLM.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Model Identifier</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {MODEL_PRESETS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 3: Default Meeting Template */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <LayoutTemplate className="w-3.5 h-3.5 text-slate-500" />
                Default Meeting Template
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {Object.values(MEETING_TEMPLATES).map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => setDefaultTemplate(tpl.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      defaultTemplate === tpl.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-md border ${tpl.bgLight} ${tpl.color} ${tpl.borderLight}`}>
                        {tpl.badge}
                      </span>
                      {defaultTemplate === tpl.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-xs font-semibold text-slate-900">{tpl.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{tpl.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {aiSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save AI Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

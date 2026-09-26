'use client';

import React, { useState, useEffect } from 'react';
import { MeetingHighlight } from '@/lib/schemas/meeting';
import { Highlighter, X, Save, Sparkles, AlertTriangle, CheckSquare, HelpCircle, Bookmark } from 'lucide-react';

interface HighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuote?: string;
  initialSpeaker?: string;
  initialTimestamp?: string;
  onSaveHighlight: (highlight: MeetingHighlight) => Promise<void>;
}

export const HighlightModal: React.FC<HighlightModalProps> = ({
  isOpen,
  onClose,
  initialQuote = '',
  initialSpeaker = '',
  initialTimestamp = '00:00',
  onSaveHighlight,
}) => {
  const [quote, setQuote] = useState(initialQuote);
  const [speaker, setSpeaker] = useState(initialSpeaker);
  const [timestamp, setTimestamp] = useState(initialTimestamp);
  const [significance, setSignificance] = useState('');
  const [category, setCategory] = useState<'key_moment' | 'decision' | 'action' | 'risk' | 'question'>('key_moment');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setQuote(initialQuote);
    setSpeaker(initialSpeaker);
    setTimestamp(initialTimestamp);
    setSignificance('');
    setCategory('key_moment');
  }, [initialQuote, initialSpeaker, initialTimestamp, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.trim()) return;

    setIsSaving(true);
    try {
      await onSaveHighlight({
        id: `hl-user-${Date.now()}`,
        quote: quote.trim(),
        speaker: speaker.trim() || 'Speaker',
        timestamp: timestamp.trim() || '00:00',
        significance: significance.trim() || 'User saved highlight',
        category,
        isUserSaved: true,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save highlight:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const categories = [
    { id: 'key_moment', label: 'Key Moment', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: 'decision', label: 'Decision', icon: Bookmark, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'action', label: 'Action Item', icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'risk', label: 'Risk / Concern', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'question', label: 'Question', icon: HelpCircle, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Highlighter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Create Transcript Highlight</h3>
              <p className="text-xs text-slate-500">Save and tag key moments for your team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Quote */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Snippet Quote
            </label>
            <textarea
              rows={3}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Speaker & Timestamp */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Speaker
              </label>
              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Timestamp
              </label>
              <input
                type="text"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Tag Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Highlight Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as typeof category)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? `${cat.color} ring-2 ring-indigo-500/30 font-semibold`
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note / Significance */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Note / Significance <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Why is this moment noteworthy?"
              value={significance}
              onChange={(e) => setSignificance(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !quote.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Highlight'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

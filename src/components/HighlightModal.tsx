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
    { id: 'key_moment', label: 'Key Moment', icon: Sparkles, color: '#bdc2ff', bg: 'rgba(189,194,255,0.1)', border: 'rgba(189,194,255,0.3)' },
    { id: 'decision', label: 'Decision', icon: Bookmark, color: '#d4b144', bg: 'rgba(212,177,68,0.1)', border: 'rgba(212,177,68,0.3)' },
    { id: 'action', label: 'Action Item', icon: CheckSquare, color: '#68cc58', bg: 'rgba(104,204,88,0.1)', border: 'rgba(104,204,88,0.3)' },
    { id: 'risk', label: 'Risk / Concern', icon: AlertTriangle, color: '#eb5757', bg: 'rgba(235,87,87,0.1)', border: 'rgba(235,87,87,0.3)' },
    { id: 'question', label: 'Question', icon: HelpCircle, color: '#828fff', bg: 'rgba(130,143,255,0.1)', border: 'rgba(130,143,255,0.3)' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(1, 1, 2, 0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 border shadow-2xl"
        style={{ background: '#0f1011', borderColor: '#23252a' }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: '#23252a' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl border flex items-center justify-center"
              style={{ background: '#18182f', borderColor: 'rgba(113,112,255,0.3)', color: '#828fff' }}
            >
              <Highlighter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: '#f7f8f8' }}>Create Transcript Highlight</h3>
              <p className="text-[11px]" style={{ color: '#8a8f98' }}>Save and tag key moments for your team</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Quote */}
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
            >
              Snippet Quote
            </label>
            <textarea
              rows={3}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none transition-colors"
              style={{ background: '#1c1c1f', borderColor: '#34343a', color: '#f7f8f8' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
            />
          </div>

          {/* Speaker & Timestamp */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
              >
                Speaker
              </label>
              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none transition-colors"
                style={{ background: '#1c1c1f', borderColor: '#34343a', color: '#f7f8f8' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
              />
            </div>
            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
              >
                Timestamp
              </label>
              <input
                type="text"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none transition-colors"
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
          </div>

          {/* Tag Category */}
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
            >
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={{
                      background: isSelected ? cat.bg : '#141516',
                      borderColor: isSelected ? cat.border : '#23252a',
                      color: isSelected ? cat.color : '#8a8f98',
                    }}
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
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#8a8f98', letterSpacing: '0.06em' }}
            >
              Note / Significance <span style={{ color: '#62666d' }}>(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Why is this moment noteworthy?"
              value={significance}
              onChange={(e) => setSignificance(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none transition-colors"
              style={{ background: '#1c1c1f', borderColor: '#34343a', color: '#f7f8f8' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#34343a')}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: '#23252a' }}>
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
              disabled={isSaving || !quote.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#ffffff', color: '#08090a' }}
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

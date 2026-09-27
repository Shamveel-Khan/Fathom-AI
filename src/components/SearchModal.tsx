'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchResultItem, SearchResultType } from '@/lib/schemas/search';
import {
  Search,
  X,
  Clock,
  Video,
  CheckSquare,
  Scale,
  Highlighter,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Command,
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_FILTERS: { label: string; value: SearchResultType | 'all' }[] = [
  { label: 'All Results', value: 'all' },
  { label: 'Transcripts', value: 'transcript' },
  { label: 'Action Items', value: 'action_item' },
  { label: 'Decisions', value: 'decision' },
  { label: 'Highlights', value: 'highlight' },
  { label: 'Meetings', value: 'meeting' },
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<SearchResultType | 'all'>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [shortcutLabel, setShortcutLabel] = useState('⌘K');

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/i.test(navigator.userAgent || navigator.platform || '');
    setShortcutLabel(isMac ? '⌘K' : 'Ctrl+K');
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const executeSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setSelectedIndex(0);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val);
    }, 200);
  };

  const filteredResults = selectedType === 'all'
    ? results
    : results.filter((r) => r.type === selectedType);

  const handleSelectResult = (item: SearchResultItem) => {
    onClose();
    if (item.timestampSeconds !== undefined && item.timestampSeconds !== null) {
      router.push(`/meetings/${item.meetingId}?t=${item.timestampSeconds}`);
    } else {
      router.push(`/meetings/${item.meetingId}`);
    }
  };

  const handleKeyDownInList = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectResult(filteredResults[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  const getTypeIcon = (type: SearchResultType) => {
    switch (type) {
      case 'meeting':
        return <Video className="w-4 h-4" style={{ color: '#7170ff' }} />;
      case 'transcript':
        return <MessageSquare className="w-4 h-4" style={{ color: '#828fff' }} />;
      case 'action_item':
        return <CheckSquare className="w-4 h-4" style={{ color: '#68cc58' }} />;
      case 'decision':
        return <Scale className="w-4 h-4" style={{ color: '#d4b144' }} />;
      case 'highlight':
        return <Highlighter className="w-4 h-4" style={{ color: '#bdc2ff' }} />;
    }
  };

  const highlightMatch = (text: string, queryStr: string) => {
    if (!queryStr.trim()) return text;
    const parts = text.split(new RegExp(`(${queryStr})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === queryStr.toLowerCase() ? (
            <mark
              key={i}
              className="font-semibold px-0.5 rounded-xs"
              style={{ background: 'rgba(113,112,255,0.25)', color: '#ffffff' }}
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4"
      style={{ background: 'rgba(1, 1, 2, 0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        style={{ background: '#0f1011', borderColor: '#23252a' }}
        onKeyDown={handleKeyDownInList}
      >
        {/* Search Header */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b"
          style={{ background: '#141516', borderColor: '#23252a' }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: '#8a8f98' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search meetings, spoken transcripts, action items, decisions..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[#62666d]"
            style={{ color: '#f7f8f8' }}
          />
          {isLoading ? (
            <div className="w-4 h-4 rounded-full border-2 animate-spin shrink-0" style={{ borderColor: '#23252a', borderTopColor: '#7170ff' }} />
          ) : query ? (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              className="p-1 transition-colors"
              style={{ color: '#62666d' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f7f8f8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#62666d')}
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div
              className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: '#1c1c1f',
                borderColor: '#34343a',
                color: '#62666d',
              }}
            >
              <span>ESC</span>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        {results.length > 0 && (
          <div
            className="flex items-center gap-1.5 px-4 py-2 border-b overflow-x-auto text-xs"
            style={{ background: '#0f1011', borderColor: '#23252a' }}
          >
            {TYPE_FILTERS.map((filter) => {
              const count = filter.value === 'all'
                ? results.length
                : results.filter((r) => r.type === filter.value).length;
              if (filter.value !== 'all' && count === 0) return null;

              const isSelected = selectedType === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => {
                    setSelectedType(filter.value);
                    setSelectedIndex(0);
                  }}
                  className="px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 border"
                  style={{
                    background: isSelected ? '#18182f' : '#141516',
                    borderColor: isSelected ? 'rgba(113,112,255,0.3)' : '#23252a',
                    color: isSelected ? '#828fff' : '#8a8f98',
                  }}
                >
                  <span>{filter.label}</span>
                  <span
                    className="text-[10px] px-1 rounded-full font-bold"
                    style={{
                      background: isSelected ? 'rgba(113,112,255,0.2)' : '#1c1c1f',
                      color: isSelected ? '#828fff' : '#62666d',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y" style={{ borderColor: '#1c1c1f' }}>
          {query && !isLoading && filteredResults.length === 0 && (
            <div className="p-8 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-2" style={{ color: '#3e3e44' }} />
              <p className="text-sm font-medium" style={{ color: '#f7f8f8' }}>No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs mt-1" style={{ color: '#62666d' }}>Try searching for different keywords, names, or topics.</p>
            </div>
          )}

          {!query && (
            <div className="p-8 text-center">
              <Command className="w-8 h-8 mx-auto mb-2 opacity-60" style={{ color: '#7170ff' }} />
              <p className="text-sm font-medium" style={{ color: '#f7f8f8' }}>Quick Global Search</p>
              <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: '#62666d' }}>
                Type anything to search across all your recorded meetings, dialogue, action items, and decisions.
              </p>
            </div>
          )}

          {filteredResults.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={item.id}
                onClick={() => handleSelectResult(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors border"
                style={{
                  background: isSelected ? '#18182f' : 'transparent',
                  borderColor: isSelected ? 'rgba(113,112,255,0.3)' : 'transparent',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: '#1c1c1f', borderColor: '#23252a' }}
                >
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold truncate" style={{ color: '#f7f8f8' }}>
                      {highlightMatch(item.title, query)}
                    </span>
                    {item.badgeText && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.2 rounded"
                        style={{ background: '#232326', color: '#8a8f98' }}
                      >
                        {item.badgeText}
                      </span>
                    )}
                    {item.timestamp && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] border px-1.5 py-0.2 rounded shrink-0"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          background: '#1c1c1f',
                          borderColor: '#34343a',
                          color: '#828fff',
                        }}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {item.timestamp}
                      </span>
                    )}
                  </div>

                  <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: '#8a8f98' }}>
                    {highlightMatch(item.snippet, query)}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-[11px]" style={{ color: '#62666d' }}>
                    <span className="font-medium truncate" style={{ color: '#8a8f98' }}>{item.meetingTitle}</span>
                    <span>•</span>
                    <span>{item.meetingDate}</span>
                  </div>
                </div>

                <ArrowRight
                  className="w-4 h-4 shrink-0 self-center transition-transform"
                  style={{
                    color: '#7170ff',
                    opacity: isSelected ? 1 : 0,
                    transform: isSelected ? 'translateX(2px)' : 'none',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div
          className="px-4 py-2.5 border-t flex items-center justify-between text-[11px]"
          style={{ background: '#141516', borderColor: '#23252a', color: '#62666d' }}
        >
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono px-1 py-0.5 rounded" style={{ background: '#1c1c1f', border: '1px solid #34343a' }}>↑↓</kbd> navigate</span>
            <span><kbd className="font-mono px-1 py-0.5 rounded" style={{ background: '#1c1c1f', border: '1px solid #34343a' }}>↵</kbd> jump</span>
            <span><kbd className="font-mono px-1 py-0.5 rounded" style={{ background: '#1c1c1f', border: '1px solid #34343a' }}>esc</kbd> close</span>
          </div>
          {results.length > 0 && <span>{results.length} results</span>}
        </div>
      </div>
    </div>
  );
}

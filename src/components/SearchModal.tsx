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

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Global key listener for Esc and Cmd+K / Ctrl+K
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

  // Live search fetch
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
        return <Video className="w-4 h-4 text-indigo-500" />;
      case 'transcript':
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
      case 'action_item':
        return <CheckSquare className="w-4 h-4 text-amber-500" />;
      case 'decision':
        return <Scale className="w-4 h-4 text-emerald-500" />;
      case 'highlight':
        return <Highlighter className="w-4 h-4 text-violet-500" />;
    }
  };

  const highlightMatch = (text: string, queryStr: string) => {
    if (!queryStr.trim()) return text;
    const parts = text.split(new RegExp(`(${queryStr})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === queryStr.toLowerCase() ? (
            <mark key={i} className="bg-amber-100 text-amber-900 font-semibold px-0.5 rounded-xs">
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDownInList}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search meetings, spoken transcripts, action items, decisions..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden"
          />
          {isLoading ? (
            <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin shrink-0" />
          ) : query ? (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-2xs">
              <span>ESC</span>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        {results.length > 0 && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-white overflow-x-auto text-xs">
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
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className={`text-[10px] px-1 rounded-full ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100">
          {query && !isLoading && filteredResults.length === 0 && (
            <div className="p-8 text-center">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for different keywords, names, or topics.</p>
            </div>
          )}

          {!query && (
            <div className="p-8 text-center">
              <Command className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-medium text-slate-700">Quick Global Search</p>
              <p className="text-xs text-slate-400 mt-1">
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
                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  isSelected ? 'bg-indigo-50/80 border border-indigo-200' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {highlightMatch(item.title, query)}
                    </span>
                    {item.badgeText && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 shrink-0">
                        {item.badgeText}
                      </span>
                    )}
                    {item.timestamp && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-md shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        {item.timestamp}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {highlightMatch(item.snippet, query)}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                    <span className="font-medium text-slate-500 truncate">{item.meetingTitle}</span>
                    <span>•</span>
                    <span>{item.meetingDate}</span>
                  </div>
                </div>

                <ArrowRight className={`w-4 h-4 text-indigo-500 shrink-0 self-center transition-transform ${isSelected ? 'translate-x-0.5' : 'opacity-0'}`} />
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-white px-1 py-0.5 border border-slate-200 rounded-sm">↑↓</kbd> to navigate</span>
            <span><kbd className="font-mono bg-white px-1 py-0.5 border border-slate-200 rounded-sm">↵</kbd> to jump</span>
            <span><kbd className="font-mono bg-white px-1 py-0.5 border border-slate-200 rounded-sm">esc</kbd> to close</span>
          </div>
          {results.length > 0 && <span>{results.length} results</span>}
        </div>
      </div>
    </div>
  );
}

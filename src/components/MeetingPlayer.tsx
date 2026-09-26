'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Participant, TranscriptUtterance } from '@/lib/schemas/meeting';
import { secondsToTimestamp } from '@/lib/utils/time';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Tv,
  Activity,
  User,
} from 'lucide-react';

interface MeetingPlayerProps {
  durationMinutes: number;
  participants: Participant[];
  transcript: TranscriptUtterance[];
  currentTimeSeconds: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onChangeSpeed: (speed: number) => void;
}

export const MeetingPlayer: React.FC<MeetingPlayerProps> = ({
  durationMinutes,
  participants,
  transcript,
  currentTimeSeconds,
  isPlaying,
  playbackSpeed,
  onTogglePlay,
  onSeek,
  onChangeSpeed,
}) => {
  const totalSeconds = Math.max(1, durationMinutes * 60);
  const progressPercent = Math.min(100, Math.max(0, (currentTimeSeconds / totalSeconds) * 100));

  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState<'video' | 'waveform'>('video');
  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  const timelineRef = useRef<HTMLDivElement>(null);

  // Find active speaker based on current playback time
  const currentUtterance = transcript.find((u, idx) => {
    const next = transcript[idx + 1];
    const uSecs = u.timestampSeconds ?? 0;
    const nextSecs = next?.timestampSeconds ?? totalSeconds;
    return currentTimeSeconds >= uSecs && currentTimeSeconds < nextSecs;
  }) || transcript[0];

  const activeSpeaker = participants.find((p) => p.name === currentUtterance?.speaker) || {
    name: currentUtterance?.speaker || 'Speaker',
    role: currentUtterance?.speakerRole,
    avatarColor: 'bg-indigo-600',
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(Math.floor(percent * totalSeconds));
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverTime(Math.floor(percent * totalSeconds));
    setHoverPosition(hoverX);
  };

  const speedOptions = [1, 1.25, 1.5, 2];

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800 flex flex-col">
      {/* Video / Visualizer Canvas */}
      <div className="relative aspect-video sm:aspect-21/9 bg-radial from-slate-800 to-slate-950 flex items-center justify-center p-6 select-none overflow-hidden">
        {/* View Mode Toggle Button */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur-xs p-1 rounded-lg border border-slate-700/60">
          <button
            onClick={() => setViewMode('video')}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'video'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Video View"
          >
            <Tv className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('waveform')}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'waveform'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Waveform View"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Video Mode: Multi-speaker Tiles */}
        {viewMode === 'video' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl h-full items-center justify-center">
            {participants.map((p, idx) => {
              const isSpeaking = isPlaying && p.name === activeSpeaker.name;
              return (
                <div
                  key={idx}
                  className={`relative rounded-xl p-3 flex flex-col items-center justify-center h-28 sm:h-32 transition-all duration-300 border ${
                    isSpeaking
                      ? 'bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20 scale-102'
                      : 'bg-slate-800/40 border-slate-700/50 opacity-75'
                  }`}
                >
                  {/* Speaker Avatar */}
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md mb-2 transition-transform ${
                      p.avatarColor || 'bg-slate-600'
                    } ${isSpeaking ? 'scale-110' : ''}`}
                  >
                    {p.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>

                  {/* Name & Role */}
                  <p className="text-xs font-semibold text-white truncate max-w-full text-center">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-full text-center">
                    {p.role || 'Participant'}
                  </p>

                  {/* Active Speaker Voice Pulse Badge */}
                  {isSpeaking && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5">
                      <span className="w-1 h-3 bg-indigo-400 rounded-full animate-pulse" />
                      <span className="w-1 h-4 bg-indigo-400 rounded-full animate-pulse delay-75" />
                      <span className="w-1 h-2 bg-indigo-400 rounded-full animate-pulse delay-150" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Waveform Mode: Sleek Audio Visualizer */}
        {viewMode === 'waveform' && (
          <div className="flex flex-col items-center justify-center gap-4 w-full">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ${
                  activeSpeaker.avatarColor || 'bg-indigo-600'
                }`}
              >
                {activeSpeaker.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{activeSpeaker.name}</p>
                <p className="text-xs text-slate-400">{activeSpeaker.role || 'Speaking'}</p>
              </div>
            </div>

            {/* Dynamic Soundwave Visualizer Bars */}
            <div className="flex items-center gap-1.5 h-16 w-full max-w-md justify-center px-4">
              {Array.from({ length: 28 }).map((_, i) => {
                const heightPercent = isPlaying
                  ? 20 + Math.sin(i * 0.5 + currentTimeSeconds * 2) * 40 + Math.random() * 30
                  : 15;
                return (
                  <div
                    key={i}
                    className="w-1.5 bg-linear-to-t from-indigo-600 to-violet-400 rounded-full transition-all duration-150"
                    style={{ height: `${Math.max(10, Math.min(100, heightPercent))}%` }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Center Big Play Overlay when paused */}
        {!isPlaying && (
          <button
            onClick={onTogglePlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer backdrop-blur-xs"
            title="Play Recording"
          >
            <Play className="w-6 h-6 ml-1 fill-white" />
          </button>
        )}
      </div>

      {/* Scrubber Progress Bar */}
      <div className="px-4 pt-3 pb-1 bg-slate-900">
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseEnter={() => setIsHoveringTimeline(true)}
          onMouseLeave={() => setIsHoveringTimeline(false)}
          onMouseMove={handleTimelineMouseMove}
          className="relative h-2.5 bg-slate-800 hover:h-3.5 rounded-full cursor-pointer transition-all duration-150 group"
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-indigo-600 to-violet-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Scrubber thumb handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progressPercent}%` }}
          />

          {/* Hover Time Tooltip */}
          {isHoveringTimeline && hoverTime !== null && (
            <div
              className="absolute -top-8 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md pointer-events-none border border-slate-700"
              style={{ left: `${hoverPosition}px` }}
            >
              {secondsToTimestamp(hoverTime)}
            </div>
          )}
        </div>
      </div>

      {/* Playback Controls Bar */}
      <div className="px-4 py-3 bg-slate-900 flex items-center justify-between gap-3 text-slate-300">
        {/* Left: Play/Pause & Skips & Timestamp */}
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 ml-0.5 fill-white" />
            )}
          </button>

          <button
            onClick={() => onSeek(Math.max(0, currentTimeSeconds - 10))}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Rewind 10s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSeek(Math.min(totalSeconds, currentTimeSeconds + 10))}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Forward 10s"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Current / Total Duration */}
          <span className="text-xs font-mono text-slate-400">
            <strong className="text-white font-semibold">
              {secondsToTimestamp(currentTimeSeconds)}
            </strong>{' '}
            / {secondsToTimestamp(totalSeconds)}
          </span>
        </div>

        {/* Right: Speed & Volume */}
        <div className="flex items-center gap-3">
          {/* Speed Selector */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/50">
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => onChangeSpeed(speed)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-medium transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

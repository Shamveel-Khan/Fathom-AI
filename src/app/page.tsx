'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Search,
  ShieldCheck,
  Zap,
  Mic,
  Activity,
  Layers,
  FileText,
  Clock,
  ExternalLink,
  Lock,
  ChevronRight,
} from 'lucide-react';

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'video' | 'transcript'>('video');

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08090a' }}>
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: '#23252a', borderTopColor: '#7170ff' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased selection:bg-[#7170ff] selection:text-white" style={{ background: '#010102', color: '#f7f8f8' }}>
      {/* Top Navigation Bar */}
      <header
        className="sticky top-0 z-50 w-full border-b"
        style={{
          background: 'rgba(11, 11, 11, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: '#23252a',
          height: '56px',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 active:scale-[0.98] transition-transform duration-100 group">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center relative overflow-hidden transition-colors border"
              style={{ background: '#232326', borderColor: '#3e3e44' }}
            >
              <div
                className="w-2.5 h-2.5 rounded-xs rotate-45 transition-transform group-hover:scale-110"
                style={{ background: '#7170ff' }}
              />
            </div>
            <span className="font-semibold text-sm tracking-tight" style={{ color: '#f7f8f8', letterSpacing: '-0.012em' }}>
              Fathom AI
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            {[
              { href: '#preview', label: 'Product' },
              { href: '#features', label: 'Features' },
              { href: '#pipeline', label: 'Pipeline' },
              { href: '#security', label: 'Security' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.98]"
                style={{ color: '#8a8f98' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#f7f8f8';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#8a8f98';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/login"
              className="hidden sm:inline-flex px-3 py-1.5 transition-colors duration-150 font-medium"
              style={{ color: '#8a8f98' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f7f8f8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8f98')}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg font-medium transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#ffffff', color: '#08090a' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 flex flex-col items-center w-full">
        {/* Hero Section */}
        <section className="w-full max-w-7xl px-6 pt-16 pb-20 md:pt-24 md:pb-28 flex flex-col items-center text-center relative">
          {/* Ambient Glow Behind Preview */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[650px] h-[350px] blur-[120px] rounded-full pointer-events-none -z-10"
            style={{ background: 'rgba(113, 112, 255, 0.15)' }}
          />

          {/* Eyebrow Pill */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-8 cursor-pointer group transition-colors"
            style={{ background: '#18182f', borderColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7170ff' }} />
            <span className="text-xs font-medium" style={{ color: '#bdc2ff' }}>Fathom 2.0 is live</span>
            <span style={{ color: '#34343a' }}>|</span>
            <kbd
              className="text-[11px] font-mono px-1.5 py-0.5 rounded border group-hover:text-white transition-colors"
              style={{ background: '#232326', borderColor: '#34343a', color: '#d0d6e0' }}
            >
              ⌘K
            </kbd>
          </div>

          {/* Hero Headline */}
          <h1
            className="max-w-4xl mx-auto tracking-tight mb-6"
            style={{
              color: '#f7f8f8',
              fontSize: 'clamp(36px, 5.5vw, 56px)',
              fontWeight: 590,
              lineHeight: '1.1',
              letterSpacing: '-0.022em',
            }}
          >
            Engineered meeting intelligence for high-velocity teams.
          </h1>

          {/* Hero Subtitle */}
          <p
            className="max-w-2xl mx-auto mb-10 leading-relaxed text-base sm:text-lg"
            style={{ color: '#8a8f98' }}
          >
            Turn raw meeting audio and video into instant executive summaries, verifiable action items,
            tracked decisions, and automated risk audits.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto mb-16">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center h-10 px-6 rounded-lg font-medium transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#ffffff', color: '#08090a' }}
            >
              Start free trial
            </Link>
            <a
              href="#preview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg border font-medium transition-all duration-150 active:scale-[0.98]"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.08)',
                color: '#f7f8f8',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)')}
            >
              <Play className="w-3.5 h-3.5" style={{ color: '#7170ff' }} fill="currentColor" />
              View interactive preview
            </a>
          </div>

          {/* Social Proof Strip */}
          <div className="w-full max-w-4xl pt-4 border-t flex flex-col items-center gap-4" style={{ borderColor: '#23252a' }}>
            <span className="text-xs uppercase tracking-wider" style={{ color: '#62666d', letterSpacing: '0.06em' }}>
              Trusted by forward-thinking engineering and product teams at
            </span>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 text-sm font-semibold tracking-wider uppercase opacity-70" style={{ color: '#8a8f98' }}>
              <span className="hover:text-white transition-colors">Vercel</span>
              <span className="hover:text-white transition-colors">Supabase</span>
              <span className="hover:text-white transition-colors">Linear</span>
              <span className="hover:text-white transition-colors">Retool</span>
              <span className="hover:text-white transition-colors">Ramp</span>
            </div>
          </div>

          {/* Flagship Product UI Preview in Hero (Product-Frame) */}
          <div className="w-full max-w-6xl mt-16 text-left" id="preview">
            <div
              className="rounded-xl border overflow-hidden shadow-2xl relative"
              style={{ background: '#0f1011', borderColor: '#23252a' }}
            >
              {/* Window Title Bar */}
              <div
                className="h-10 px-4 border-b flex items-center justify-between"
                style={{ background: '#141516', borderColor: '#23252a' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#34343a' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#34343a' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#34343a' }} />
                  <span className="mx-2" style={{ color: '#34343a' }}>|</span>
                  <div className="flex items-center gap-2 text-xs font-medium" style={{ color: '#d0d6e0' }}>
                    <Mic className="w-3.5 h-3.5" style={{ color: '#8a8f98' }} />
                    Q3 Core Architecture &amp; Latency Review
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-[11px] font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(104, 204, 88, 0.1)', color: '#68cc58' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#68cc58' }} />
                    Processed in 1.4s
                  </span>
                  <span className="text-xs font-mono" style={{ color: '#62666d' }}>48:12</span>
                </div>
              </div>

              {/* Application Workspace View */}
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
                {/* Left 7 Cols: Video, Waveform & Interactive Transcript */}
                <div
                  className="lg:col-span-7 p-5 border-b lg:border-b-0 lg:border-r flex flex-col justify-between"
                  style={{ background: '#08090a', borderColor: '#23252a' }}
                >
                  <div>
                    {/* Mock Video Display Area */}
                    <div
                      className="w-full aspect-video rounded-lg border overflow-hidden relative group"
                      style={{ background: '#0d0e0f', borderColor: '#23252a' }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center p-3">
                        <div className="grid grid-cols-2 gap-3 w-full h-full">
                          <div
                            className="rounded-lg border p-3 flex flex-col justify-between relative overflow-hidden"
                            style={{ background: '#1c1c1f', borderColor: '#23252a' }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] px-2 py-0.5 rounded backdrop-blur" style={{ background: 'rgba(8, 9, 10, 0.8)', color: '#f7f8f8' }}>
                                Sarah Chen
                              </span>
                              <span className="w-2 h-2 rounded-full" style={{ background: '#68cc58' }} />
                            </div>
                            <span className="text-[10px]" style={{ color: '#62666d' }}>Staff Distributed Systems Eng</span>
                          </div>
                          <div
                            className="rounded-lg border p-3 flex flex-col justify-between relative overflow-hidden"
                            style={{ background: '#1c1c1f', borderColor: '#23252a' }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] px-2 py-0.5 rounded backdrop-blur" style={{ background: 'rgba(8, 9, 10, 0.8)', color: '#f7f8f8' }}>
                                Alex Rivera
                              </span>
                              <span className="w-2 h-2 rounded-full" style={{ background: '#3e3e44' }} />
                            </div>
                            <span className="text-[10px]" style={{ color: '#62666d' }}>Tech Lead, Infrastructure</span>
                          </div>
                        </div>
                      </div>
                      {/* Playhead Overlay */}
                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
                        <span
                          className="text-[11px] font-mono px-2 py-0.5 rounded border"
                          style={{ background: 'rgba(8, 9, 10, 0.9)', borderColor: '#23252a', color: '#f7f8f8' }}
                        >
                          24:18 / 48:12
                        </span>
                        <span
                          className="text-[11px] font-mono px-2 py-0.5 rounded border"
                          style={{ background: '#18182f', borderColor: '#3e3e44', color: '#7170ff' }}
                        >
                          1.5x Speed
                        </span>
                      </div>
                    </div>

                    {/* Waveform Scrubber */}
                    <div
                      className="mt-3.5 p-3 rounded-lg border"
                      style={{ background: '#0f1011', borderColor: '#23252a' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <button className="w-6 h-6 rounded flex items-center justify-center" style={{ background: '#232326', color: '#f7f8f8' }}>
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                          <span className="text-xs font-mono" style={{ color: '#8a8f98' }}>Waveform Scrub</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]" style={{ color: '#62666d' }}>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ background: '#68cc58' }} /> Sarah (54%)
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ background: '#d4b144' }} /> Alex (42%)
                          </span>
                        </div>
                      </div>
                      {/* Waveform Visualization */}
                      <div className="h-7 flex items-center gap-1">
                        {[12, 20, 24, 16, 28, 32, 20, 12, 28, 16, 8, 20, 12, 24, 16, 8, 20, 28, 12, 24, 16, 8, 20, 28, 14, 22, 18, 26, 12, 20].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded"
                            style={{
                              height: `${h}px`,
                              background: i < 5 ? '#68cc58' : i === 5 ? '#7170ff' : i < 9 ? '#d4b144' : '#34343a',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Synchronized Transcript Stream */}
                  <div className="mt-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b" style={{ borderColor: '#23252a' }}>
                      <span className="text-xs font-medium" style={{ color: '#f7f8f8' }}>Synchronized Transcript</span>
                      <span className="text-[10px] font-mono" style={{ color: '#62666d' }}>Follow audio on</span>
                    </div>
                    <div className="flex gap-2.5 text-xs" style={{ color: '#8a8f98' }}>
                      <span className="font-mono shrink-0" style={{ color: '#62666d' }}>24:02</span>
                      <div>
                        <span className="font-semibold" style={{ color: '#f7f8f8' }}>Alex Rivera: </span>
                        If we migrate the event bus to the secondary cluster, tail latencies drop below 14ms across US-East.
                      </div>
                    </div>
                    <div
                      className="flex gap-2.5 text-xs p-2 rounded-r border-l-2"
                      style={{
                        background: 'rgba(113, 112, 255, 0.08)',
                        borderLeftColor: '#7170ff',
                        color: '#f7f8f8',
                      }}
                    >
                      <span className="font-mono font-medium shrink-0" style={{ color: '#7170ff' }}>24:18</span>
                      <div>
                        <span className="font-semibold text-white">Sarah Chen: </span>
                        Agreed. Let&apos;s isolate the partition key change into a separate canary deploy before merging the gRPC pipeline.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 5 Cols: Docked AI Intelligence & Synthesis Panel */}
                <div className="lg:col-span-5 p-5 flex flex-col gap-5" style={{ background: '#0f1011' }}>
                  {/* Panel Header */}
                  <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: '#23252a' }}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" style={{ color: '#7170ff' }} />
                      <span className="text-xs font-semibold" style={{ color: '#f7f8f8' }}>AI Executive Synthesis</span>
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded border"
                      style={{ background: '#232326', borderColor: '#3e3e44', color: '#d0d6e0' }}
                    >
                      Model v2.4
                    </span>
                  </div>

                  {/* Executive Summary */}
                  <div>
                    <span
                      className="text-[10px] uppercase tracking-wider font-semibold block mb-2"
                      style={{ color: '#62666d', letterSpacing: '0.06em' }}
                    >
                      Executive Summary
                    </span>
                    <ul className="flex flex-col gap-1.5 text-xs" style={{ color: '#d0d6e0' }}>
                      <li className="flex items-start gap-2">
                        <span className="font-bold" style={{ color: '#7170ff' }}>›</span>
                        Consensus reached on event bus partitioning strategy to resolve US-East p99 spike.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold" style={{ color: '#7170ff' }}>›</span>
                        Agreed to initiate canary deploy on Friday under synthetic load test protocol.
                      </li>
                    </ul>
                  </div>

                  {/* Key Decision Box */}
                  <div
                    className="p-3 rounded-lg border"
                    style={{ background: '#1c1c1f', borderColor: '#23252a' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[10px] uppercase font-semibold tracking-wider flex items-center gap-1.5"
                        style={{ color: '#d4b144' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#d4b144' }} />
                        Key Decision
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: '#62666d' }}>24:30</span>
                    </div>
                    <p className="text-xs font-medium" style={{ color: '#f7f8f8' }}>
                      gRPC streaming migration approved for Q3 sprint without impacting legacy REST endpoints.
                    </p>
                  </div>

                  {/* Action Items List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[10px] uppercase tracking-wider font-semibold"
                        style={{ color: '#62666d', letterSpacing: '0.06em' }}
                      >
                        Action Items (3)
                      </span>
                      <span className="text-[10px]" style={{ color: '#68cc58' }}>1-Click Sync</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { task: 'Isolate partition keys in canary branch', owner: 'Sarah' },
                        { task: 'Simulate synthetic 20k RPS replay', owner: 'Alex' },
                        { task: 'Update on-call runbook with rollback spec', owner: 'DevOps' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded border transition-colors"
                          style={{ background: '#141516', borderColor: '#23252a' }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#68cc58' }} />
                            <span className="text-xs truncate" style={{ color: '#f7f8f8' }}>{item.task}</span>
                          </div>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded shrink-0 ml-2"
                            style={{ background: '#1c1c1f', color: '#8a8f98' }}
                          >
                            {item.owner}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export Pill */}
                  <div className="mt-auto pt-2">
                    <Link
                      href="/signup"
                      className="w-full flex items-center justify-center gap-2 h-9 rounded text-xs font-medium border transition-colors"
                      style={{
                        background: '#232326',
                        borderColor: '#3e3e44',
                        color: '#f7f8f8',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#3e3e44')}
                    >
                      <Zap className="w-3.5 h-3.5" style={{ color: '#7170ff' }} />
                      Export Action Items to Linear &amp; Jira
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Feature Breakdown Section */}
        <section className="w-full max-w-7xl px-6 py-24 border-t" style={{ borderColor: '#23252a' }} id="features">
          <div className="max-w-2xl mb-16 text-left">
            <span
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: '#7170ff', letterSpacing: '0.06em' }}
            >
              Architectural Capabilities
            </span>
            <h2
              className="tracking-tight mt-2 mb-4"
              style={{ color: '#f7f8f8', fontSize: '36px', fontWeight: 590, letterSpacing: '-0.022em' }}
            >
              Built for teams who measure productivity in milliseconds.
            </h2>
            <p className="text-base leading-relaxed" style={{ color: '#8a8f98' }}>
              Generic AI transcription is noisy. Fathom AI is designed with domain-aware deterministic filters to separate signal from conversational banter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Bento 1: Large feature (Col-span 2) */}
            <div
              className="md:col-span-2 rounded-xl border p-8 flex flex-col justify-between transition-colors group"
              style={{ background: '#0f1011', borderColor: '#23252a' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3e3e44')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#23252a')}
            >
              <div>
                <div
                  className="w-10 h-10 rounded-lg border flex items-center justify-center mb-6"
                  style={{ background: '#18182f', borderColor: 'rgba(113,112,255,0.3)', color: '#828fff' }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#f7f8f8' }}>
                  AI Meeting Summaries &amp; Executive Briefs
                </h3>
                <p className="text-sm max-w-xl mb-6 leading-relaxed" style={{ color: '#8a8f98' }}>
                  Zero fluff. Get hyper-dense, verifiable summaries with direct timecoded citations linked to the precise spoken sentence in audio.
                </p>
              </div>
              <div
                className="rounded-lg p-4 border flex flex-col gap-2 font-mono text-xs"
                style={{ background: '#1c1c1f', borderColor: '#34343a', color: '#d0d6e0' }}
              >
                <div className="flex items-center justify-between text-[11px]" style={{ color: '#62666d' }}>
                  <span>OUTPUT_SYNTHESIS_METRIC</span>
                  <span className="font-semibold" style={{ color: '#27a644' }}>99.4% factual precision</span>
                </div>
                <div style={{ color: '#f7f8f8' }}>
                  → &quot;Q3 latency mitigation: gRPC streaming migration verified for week 34.&quot; [24:18]
                </div>
              </div>
            </div>

            {/* Bento 2: Sub-Second Transcript Search */}
            <div
              className="rounded-xl border p-8 flex flex-col justify-between transition-colors group"
              style={{ background: '#0f1011', borderColor: '#23252a' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3e3e44')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#23252a')}
            >
              <div>
                <div
                  className="w-10 h-10 rounded-lg border flex items-center justify-center mb-6"
                  style={{ background: '#18182f', borderColor: 'rgba(113,112,255,0.3)', color: '#828fff' }}
                >
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#f7f8f8' }}>
                  Sub-Second Search
                </h3>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: '#8a8f98' }}>
                  Full-text regex and semantic vector lookup across 10,000+ hours of team recordings in under 200ms.
                </p>
              </div>
              <div
                className="h-9 px-3 rounded border flex items-center justify-between font-mono text-xs"
                style={{ background: '#1c1c1f', borderColor: '#23252a', color: '#8a8f98' }}
              >
                <span>/grep --speaker=Sarah &quot;latency&quot;</span>
                <span className="text-[11px] font-sans" style={{ color: '#62666d' }}>18 hits</span>
              </div>
            </div>

            {/* Bento 3: Verifiable Action Items */}
            <div
              className="rounded-xl border p-8 flex flex-col justify-between transition-colors group"
              style={{ background: '#0f1011', borderColor: '#23252a' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3e3e44')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#23252a')}
            >
              <div>
                <div
                  className="w-10 h-10 rounded-lg border flex items-center justify-center mb-6"
                  style={{ background: 'rgba(104,204,88,0.1)', borderColor: 'rgba(104,204,88,0.3)', color: '#68cc58' }}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#f7f8f8' }}>
                  Verifiable Action Items
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8a8f98' }}>
                  Auto-extract tasks explicitly mapped to owners, deadlines, and urgency ratings with direct sync to your issue tracker.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold" style={{ color: '#68cc58' }}>
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero manual note-taking</span>
              </div>
            </div>

            {/* Bento 4: Meeting Quality Audits */}
            <div
              className="rounded-xl border p-8 flex flex-col justify-between transition-colors group"
              style={{ background: '#0f1011', borderColor: '#23252a' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3e3e44')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#23252a')}
            >
              <div>
                <div
                  className="w-10 h-10 rounded-lg border flex items-center justify-center mb-6"
                  style={{ background: 'rgba(212,177,68,0.1)', borderColor: 'rgba(212,177,68,0.3)', color: '#d4b144' }}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#f7f8f8' }}>
                  Autonomous Quality Audits
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8a8f98' }}>
                  Flag unresolved questions, unassigned deliverables, conflicting statements, and unaddressed technical risks automatically.
                </p>
              </div>
              <div className="mt-6">
                <span
                  className="text-xs px-2.5 py-1 rounded border inline-block"
                  style={{ background: 'rgba(212,177,68,0.1)', borderColor: 'rgba(212,177,68,0.3)', color: '#d4b144' }}
                >
                  Warning: 1 Unresolved blocker identified
                </span>
              </div>
            </div>

            {/* Bento 5: Decisions & Truth Log */}
            <div
              className="rounded-xl border p-8 flex flex-col justify-between transition-colors group"
              style={{ background: '#0f1011', borderColor: '#23252a' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3e3e44')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#23252a')}
            >
              <div>
                <div
                  className="w-10 h-10 rounded-lg border flex items-center justify-center mb-6"
                  style={{ background: 'rgba(122,127,173,0.1)', borderColor: 'rgba(122,127,173,0.3)', color: '#7a7fad' }}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#f7f8f8' }}>
                  Decisions &amp; Truth Log
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8a8f98' }}>
                  Timestamped records of truth so architectural consensus and strategic shifts are never contested or forgotten.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs" style={{ color: '#d0d6e0' }}>
                <Sparkles className="w-4 h-4" style={{ color: '#7170ff' }} />
                <span>Immutable meeting ledger</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pipeline Workflow Section */}
        <section className="w-full max-w-7xl px-6 py-24 border-t" style={{ borderColor: '#23252a' }} id="pipeline">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: '#7170ff', letterSpacing: '0.06em' }}
            >
              Continuous Engine
            </span>
            <h2
              className="tracking-tight mt-2 mb-4"
              style={{ color: '#f7f8f8', fontSize: '36px', fontWeight: 590, letterSpacing: '-0.022em' }}
            >
              From conversational chaos to operational clarity.
            </h2>
            <p className="text-base" style={{ color: '#8a8f98' }}>
              Our four-stage pipeline processes conversations with sub-minute turnaround times without requiring user intervention.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { num: '01 // INGEST', title: 'Import', desc: 'Drag-and-drop meeting JSON files or import recordings with full speaker diarization.' },
              { num: '02 // PARSE', title: 'Analyze', desc: 'Multi-speaker turn detection combined with low-hallucination domain LLM fact extraction.' },
              { num: '03 // SYNTHESIZE', title: 'Understand', desc: 'Dynamic transcript scrubbing with linked citations and automatic risk auditing.' },
              { num: '04 // EXECUTE', title: 'Act', desc: 'Export assigned tasks directly to Linear issues, Jira epics, Slack, and Notion docs.', accent: '#68cc58' },
            ].map((step) => (
              <div
                key={step.num}
                className="p-6 rounded-xl border transition-colors text-left"
                style={{ background: '#0f1011', borderColor: '#23252a' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3e3e44')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#23252a')}
              >
                <div className="font-mono text-xs mb-3 font-semibold" style={{ color: step.accent || '#7170ff' }}>
                  {step.num}
                </div>
                <h4 className="text-base font-semibold mb-2" style={{ color: '#f7f8f8' }}>{step.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: '#8a8f98' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Enterprise Security & Privacy Notice */}
        <section className="w-full max-w-7xl px-6 py-20 border-t" style={{ borderColor: '#23252a' }} id="security">
          <div
            className="rounded-xl border p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-left"
            style={{ background: '#0f1011', borderColor: '#23252a' }}
          >
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4" style={{ color: '#7a7fad' }} />
                <span
                  className="text-xs uppercase font-semibold tracking-wider"
                  style={{ color: '#7a7fad', letterSpacing: '0.06em' }}
                >
                  Enterprise Security Architecture
                </span>
              </div>
              <h3 className="text-2xl font-semibold mb-3" style={{ color: '#f7f8f8' }}>
                Zero model training. Full customer data sovereignty.
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#8a8f98' }}>
                Your conversations contain your company’s highest-value intellectual property. We enforce zero data retention on LLM provider models, support Bring Your Own Key (BYOK), and maintain isolated workspace access control.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full sm:w-auto">
              <div
                className="px-4 py-2.5 rounded-lg border font-mono text-xs flex items-center gap-3"
                style={{ background: '#1c1c1f', borderColor: '#23252a', color: '#d0d6e0' }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: '#68cc58' }} />
                SOC-2 Type II Compliant
              </div>
              <div
                className="px-4 py-2.5 rounded-lg border font-mono text-xs flex items-center gap-3"
                style={{ background: '#1c1c1f', borderColor: '#23252a', color: '#d0d6e0' }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: '#68cc58' }} />
                AES-256 + TLS 1.3 In Flight
              </div>
            </div>
          </div>
        </section>

        {/* Final Conversion CTA Band */}
        <section className="w-full max-w-7xl px-6 py-28 text-center flex flex-col items-center relative overflow-hidden">
          <div className="w-full max-w-3xl flex flex-col items-center">
            <h2
              className="tracking-tight mb-6"
              style={{ color: '#f7f8f8', fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 590, letterSpacing: '-0.022em' }}
            >
              Reclaim 10+ hours per engineer every single week.
            </h2>
            <p className="text-base mb-10 max-w-xl" style={{ color: '#8a8f98' }}>
              Deploy Fathom AI across your organization in less than two minutes. Bring your own OpenAI API key or use instant demo mode.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/signup"
                className="h-11 px-8 rounded-lg font-medium transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center text-sm"
                style={{ background: '#ffffff', color: '#08090a' }}
              >
                Start free trial
              </Link>
              <Link
                href="/login"
                className="h-11 px-6 rounded-lg border font-medium transition-all active:scale-[0.98] flex items-center justify-center text-sm"
                style={{ background: '#232326', borderColor: '#3e3e44', color: '#f7f8f8' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#7170ff')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#3e3e44')}
              >
                Sign in to Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Comprehensive Footer */}
      <footer className="w-full border-t" style={{ background: '#010102', borderColor: '#23252a' }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Top 5-Column Navigation Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12 text-left">
            <div>
              <span className="text-xs font-semibold block mb-4" style={{ color: '#f7f8f8' }}>Product</span>
              <ul className="flex flex-col gap-2 text-xs" style={{ color: '#8a8f98' }}>
                <li><Link href="/signup" className="hover:text-white transition-colors">Overview</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">AI Summaries</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Transcript Engine</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Action Items Sync</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <span className="text-xs font-semibold block mb-4" style={{ color: '#f7f8f8' }}>Features</span>
              <ul className="flex flex-col gap-2 text-xs" style={{ color: '#8a8f98' }}>
                <li><Link href="/signup" className="hover:text-white transition-colors">Sub-Second Search</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Quality Auditing</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Speaker Attribution</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Linear Webhooks</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">CLI &amp; API</Link></li>
              </ul>
            </div>
            <div>
              <span className="text-xs font-semibold block mb-4" style={{ color: '#f7f8f8' }}>Resources</span>
              <ul className="flex flex-col gap-2 text-xs" style={{ color: '#8a8f98' }}>
                <li><Link href="/login" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Engineering Blog</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Changelog</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Architecture Whitepaper</Link></li>
              </ul>
            </div>
            <div>
              <span className="text-xs font-semibold block mb-4" style={{ color: '#f7f8f8' }}>Company</span>
              <ul className="flex flex-col gap-2 text-xs" style={{ color: '#8a8f98' }}>
                <li><Link href="/login" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Press Kit</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <span className="text-xs font-semibold block mb-4" style={{ color: '#f7f8f8' }}>Legal &amp; Trust</span>
              <ul className="flex flex-col gap-2 text-xs" style={{ color: '#8a8f98' }}>
                <li><Link href="/login" className="hover:text-white transition-colors">Security</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">SOC-2 Portal</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Status & Copyright Bar */}
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs" style={{ borderColor: '#23252a', color: '#62666d' }}>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-white">Fathom AI</span>
              <span>© 2026 Fathom AI Systems Inc. Engineered for high-density meeting intelligence.</span>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-full border"
              style={{ background: '#1c1c1f', borderColor: '#23252a' }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#27a644' }} />
              <span className="text-[11px] font-medium" style={{ color: '#d0d6e0' }}>Status: Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

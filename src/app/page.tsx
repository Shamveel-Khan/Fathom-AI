'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Sparkles, ArrowRight, ListChecks, ShieldAlert, Waves } from 'lucide-react';

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08090a' }}>
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: '#23252a', borderTopColor: '#7170ff' }}
        />
      </div>
    );
  }

  if (user) {
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
    <div className="min-h-screen flex flex-col" style={{ background: '#010102', color: '#d0d6e0' }}>
      {/* Sticky Nav */}
      <header
        className="sticky top-0 z-50 w-full border-b"
        style={{
          background: 'rgba(11,11,11,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: '#23252a',
          height: '56px',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
              style={{ background: '#ffffff', color: '#08090a' }}
            >
              F
            </div>
            <span className="font-semibold text-sm" style={{ color: '#f7f8f8', letterSpacing: '-0.012em' }}>
              Fathom AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium transition-colors duration-150"
              style={{ color: '#828fff' }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-opacity duration-150 hover:opacity-90"
              style={{ background: '#ffffff', color: '#08090a' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-32">
        {/* Eyebrow badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-8 border"
          style={{ background: '#18182f', borderColor: 'rgba(113,112,255,0.3)', color: '#828fff' }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Meeting Intelligence
        </div>

        {/* Headline */}
        <h1
          className="max-w-3xl mx-auto mb-6"
          style={{
            color: '#f7f8f8',
            fontSize: '56px',
            fontWeight: 590,
            lineHeight: '60px',
            letterSpacing: '-0.022em',
          }}
        >
          Engineered{' '}
          <span style={{ color: '#828fff' }}>Meeting</span>{' '}
          Intelligence
        </h1>

        {/* Sub */}
        <p
          className="max-w-xl mx-auto mb-10"
          style={{ color: '#8a8f98', fontSize: '18px', lineHeight: '28px' }}
        >
          Transform raw meeting recordings into executive intelligence — summaries, action items,
          decisions, and risk audits delivered in seconds.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3 mb-16">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity duration-150 hover:opacity-90"
            style={{ background: '#ffffff', color: '#08090a' }}
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors duration-150"
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.08)',
              color: '#f7f8f8',
            }}
          >
            Sign in
          </Link>
        </div>

        {/* Waveform mockup */}
        <div
          className="w-full max-w-3xl rounded-2xl border p-6"
          style={{ background: '#0f1011', borderColor: '#23252a' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs"
              style={{ background: '#141516', borderColor: '#23252a', color: '#8a8f98' }}
            >
              <Waves className="w-3.5 h-3.5" style={{ color: '#7170ff' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Q4 Strategy Review — 48m 22s</span>
            </div>
            <div
              className="ml-auto px-2 py-1 rounded-full text-[10px] font-medium"
              style={{ background: '#27a644', color: '#ffffff' }}
            >
              ● LIVE
            </div>
          </div>
          {/* Waveform bars */}
          <div className="flex items-center gap-0.5 h-16">
            {Array.from({ length: 80 }).map((_, i) => {
              const heights = [20, 35, 55, 70, 45, 30, 60, 80, 50, 25, 40, 65, 45, 30, 55, 70, 40, 25, 50, 65];
              const h = heights[i % heights.length];
              const colors = ['#7170ff', '#68cc58', '#d4b144', '#7a7fad'];
              const color = i < 50 ? colors[Math.floor(i / 13) % colors.length] : '#34343a';
              return (
                <div
                  key={i}
                  className="flex-1 rounded-full"
                  style={{ height: `${h}%`, background: color, opacity: i < 50 ? 0.8 : 0.4 }}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs" style={{ color: '#62666d', fontFamily: "'JetBrains Mono', monospace" }}>
            <span>0:00</span>
            <div className="flex items-center gap-4">
              <span style={{ color: '#68cc58' }}>■ Sarah Chen</span>
              <span style={{ color: '#7170ff' }}>■ Alex Rivera</span>
              <span style={{ color: '#d4b144' }}>■ Jordan Lee</span>
            </div>
            <span>48:22</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6" style={{ background: '#08090a' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-widest text-center mb-4" style={{ color: '#62666d', letterSpacing: '0.1em' }}>
            Intelligence Pillars
          </p>
          <h2
            className="text-center mb-12"
            style={{ color: '#f7f8f8', fontSize: '32px', fontWeight: 590, letterSpacing: '-0.022em' }}
          >
            Everything from a single meeting
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: <ListChecks className="w-5 h-5" style={{ color: '#68cc58' }} />,
                accent: '#68cc58',
                title: 'Action Intelligence',
                body: 'Every commitment, owner, and deadline automatically extracted and tracked across your entire meeting history.',
              },
              {
                icon: <ShieldAlert className="w-5 h-5" style={{ color: '#7a7fad' }} />,
                accent: '#7a7fad',
                title: 'AI Risk Audit',
                body: 'Identifies unresolved questions, missing dependencies, unassigned tasks, contradictions, and potential risks.',
              },
              {
                icon: <Sparkles className="w-5 h-5" style={{ color: '#7170ff' }} />,
                accent: '#7170ff',
                title: 'Executive Summary',
                body: 'Structured summaries, key decisions, and highlight reels tailored to your meeting type and template.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border p-6"
                style={{
                  background: '#0f1011',
                  borderColor: '#23252a',
                  borderLeft: `2px solid ${f.accent}`,
                }}
              >
                <div className="mb-3">{f.icon}</div>
                <h3 className="font-semibold text-base mb-2" style={{ color: '#f7f8f8', letterSpacing: '-0.012em' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8a8f98' }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-16 px-6 border-y" style={{ background: '#010102', borderColor: '#23252a' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: '10,000+', label: 'Meetings Analyzed' },
            { value: '98%', label: 'Extraction Accuracy' },
            { value: '<30s', label: 'Time to Insights' },
          ].map((s) => (
            <div key={s.label}>
              <div
                className="text-4xl font-bold mb-1"
                style={{ color: '#f7f8f8', fontWeight: 590, letterSpacing: '-0.022em' }}
              >
                {s.value}
              </div>
              <div className="text-sm" style={{ color: '#8a8f98' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t" style={{ background: '#010102', borderColor: '#23252a' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
              style={{ background: '#ffffff', color: '#08090a' }}
            >
              F
            </div>
            <span className="text-xs" style={{ color: '#62666d' }}>
              Fathom AI · Built in 24 hours
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs transition-colors" style={{ color: '#62666d' }}>Sign in</Link>
            <Link href="/signup" className="text-xs transition-colors" style={{ color: '#828fff' }}>Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

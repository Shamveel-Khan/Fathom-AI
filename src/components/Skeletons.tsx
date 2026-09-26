'use client';

import React from 'react';

const pulseStyle = {
  background: 'linear-gradient(90deg, #1c1c1f 25%, #232326 50%, #1c1c1f 75%)',
  backgroundSize: '200% 100%',
  animation: 'pulse 2s ease-in-out infinite',
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg" style={{ background: '#232326' }} />
          <div className="h-4 w-64 rounded-md" style={{ background: '#1c1c1f' }} />
        </div>
        <div className="h-9 w-28 rounded-lg" style={{ background: '#232326' }} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border p-5" style={{ background: '#0f1011', borderColor: '#23252a' }}>
            <div className="h-4 w-20 rounded mb-2" style={{ background: '#1c1c1f' }} />
            <div className="h-8 w-12 rounded" style={{ background: '#232326' }} />
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="h-9 flex-1 max-w-sm rounded-lg" style={{ background: '#1c1c1f' }} />
          <div className="h-9 w-48 rounded-lg" style={{ background: '#1c1c1f' }} />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-20 rounded-lg" style={{ background: '#1c1c1f' }} />
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border p-5 space-y-4" style={{ background: '#0f1011', borderColor: '#23252a' }}>
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 rounded-md" style={{ background: '#232326' }} />
              <div className="h-5 w-16 rounded-md" style={{ background: '#1c1c1f' }} />
            </div>
            <div className="h-5 w-3/4 rounded-md" style={{ background: '#232326' }} />
            <div className="space-y-2">
              <div className="h-3 w-full rounded" style={{ background: '#1c1c1f' }} />
              <div className="h-3 w-5/6 rounded" style={{ background: '#1c1c1f' }} />
            </div>
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#1c1c1f' }}>
              <div className="flex -space-x-1">
                <div className="w-5 h-5 rounded-full" style={{ background: '#232326' }} />
                <div className="w-5 h-5 rounded-full" style={{ background: '#1c1c1f' }} />
              </div>
              <div className="h-4 w-16 rounded" style={{ background: '#1c1c1f' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MeetingDetailSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse" style={{ background: '#08090a', minHeight: '100vh' }}>
      {/* Header skeleton */}
      <div className="border-b px-6 py-5" style={{ background: '#0f1011', borderColor: '#23252a' }}>
        <div className="h-4 w-24 rounded mb-4" style={{ background: '#232326' }} />
        <div className="h-7 w-2/3 rounded-lg mb-3" style={{ background: '#232326' }} />
        <div className="flex gap-4">
          <div className="h-4 w-20 rounded" style={{ background: '#1c1c1f' }} />
          <div className="h-4 w-16 rounded" style={{ background: '#1c1c1f' }} />
          <div className="h-4 w-24 rounded" style={{ background: '#1c1c1f' }} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Player skeleton */}
        <div className="h-28 rounded-xl border" style={{ background: '#0f1011', borderColor: '#23252a' }} />

        {/* 2-col layout skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border p-5 h-[520px] space-y-4" style={{ background: '#0f1011', borderColor: '#23252a' }}>
            <div className="h-5 w-32 rounded" style={{ background: '#232326' }} />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-lg space-y-2" style={{ background: '#141516' }}>
                <div className="h-3 w-24 rounded" style={{ background: '#232326' }} />
                <div className="h-3 w-full rounded" style={{ background: '#1c1c1f' }} />
              </div>
            ))}
          </div>
          <div className="rounded-xl border p-5 h-[520px] space-y-4" style={{ background: '#0f1011', borderColor: '#23252a' }}>
            <div className="flex gap-4 border-b pb-3" style={{ borderColor: '#23252a' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 w-20 rounded" style={{ background: '#1c1c1f' }} />
              ))}
            </div>
            <div className="h-24 rounded-lg" style={{ background: '#141516' }} />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-3 rounded" style={{ background: i % 2 === 0 ? '#1c1c1f' : '#232326' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

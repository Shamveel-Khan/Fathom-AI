'use client';

import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-64 bg-slate-100 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-slate-200 rounded-xl" />
          <div className="h-9 w-32 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="h-10 w-72 bg-slate-100 rounded-xl" />

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 bg-slate-200 rounded-md" />
              <div className="h-5 w-16 bg-slate-100 rounded-md" />
            </div>
            <div className="h-6 w-3/4 bg-slate-200 rounded-md" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 rounded-md" />
              <div className="h-4 w-5/6 bg-slate-100 rounded-md" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex -space-x-1">
                <div className="w-6 h-6 rounded-full bg-slate-200" />
                <div className="w-6 h-6 rounded-full bg-slate-200" />
              </div>
              <div className="h-4 w-20 bg-slate-100 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MeetingDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50/50 animate-pulse">
      {/* Top bar skeleton */}
      <div className="h-14 border-b border-slate-200 bg-white" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header card skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-slate-200 rounded-md" />
            <div className="h-8 w-32 bg-slate-200 rounded-xl" />
          </div>
          <div className="h-7 w-2/3 bg-slate-300 rounded-lg" />
          <div className="flex gap-4">
            <div className="h-4 w-24 bg-slate-100 rounded-md" />
            <div className="h-4 w-20 bg-slate-100 rounded-md" />
            <div className="h-4 w-32 bg-slate-100 rounded-md" />
          </div>
        </div>

        {/* Video Player Skeleton */}
        <div className="h-48 bg-slate-900 rounded-2xl" />

        {/* 2-Column Workspace Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 h-[500px]">
            <div className="h-6 w-32 bg-slate-200 rounded-md" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-2">
                  <div className="h-4 w-28 bg-slate-200 rounded-md" />
                  <div className="h-4 w-full bg-slate-100 rounded-md" />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 h-[500px]">
            <div className="h-8 w-48 bg-slate-200 rounded-xl" />
            <div className="h-28 bg-slate-100 rounded-xl" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-200 rounded-md" />
              <div className="h-4 w-4/5 bg-slate-200 rounded-md" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

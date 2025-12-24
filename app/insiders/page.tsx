'use client';

import Sidebar from '@/components/layout/Sidebar';

export default function InsidersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-0 md:ml-[200px] p-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Insider Tracker</h1>
          <p className="text-text-secondary max-w-md">
            Track positions and trades from top prediction market traders. Coming soon.
          </p>
          <span className="mt-4 px-3 py-1 text-sm bg-accent/20 text-accent rounded-full">
            Coming Soon
          </span>
        </div>
      </main>
    </div>
  );
}

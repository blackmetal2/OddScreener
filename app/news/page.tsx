'use client';

import { Suspense } from 'react';
import Sidebar from '@/components/layout/Sidebar';

function NewsContent() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-0 md:ml-[200px] p-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">News</h1>
          <p className="text-text-secondary max-w-md">
            Stay updated with the latest news affecting prediction markets. Coming soon.
          </p>
          <span className="mt-4 px-3 py-1 text-sm bg-accent/20 text-accent rounded-full">
            Coming Soon
          </span>
        </div>
      </main>
    </div>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NewsContent />
    </Suspense>
  );
}

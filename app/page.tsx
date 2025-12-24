import { Suspense } from 'react';
import { fetchMarkets, fetchGlobalStats } from './actions/markets';
import MarketsPageClient from './MarketsPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

async function MarketsData() {
  const [markets, stats] = await Promise.all([
    fetchMarkets(),
    fetchGlobalStats(),
  ]);

  return <MarketsPageClient initialMarkets={markets} initialStats={stats} />;
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary">Loading markets...</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MarketsData />
    </Suspense>
  );
}

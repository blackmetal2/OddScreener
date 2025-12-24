import { Suspense } from 'react';
import Link from 'next/link';
import { fetchMarketDetail, fetchTrades } from '@/app/actions/markets';
import { Platform } from '@/types/market';
import MarketDetailClient from './MarketDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

interface PageProps {
  params: Promise<{ id: string }>;
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary">Loading market...</p>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Market not found</h1>
        <Link href="/" className="text-accent hover:underline">
          ← Back to markets
        </Link>
      </div>
    </div>
  );
}

async function MarketData({ id }: { id: string }) {
  // Parse the platform-id format
  // Format: polymarket-{conditionId}
  const [platform, ...idParts] = id.split('-');
  const marketId = decodeURIComponent(idParts.join('-'));

  if (!platform || !marketId || platform !== 'polymarket') {
    return <NotFoundState />;
  }

  const [market, trades] = await Promise.all([
    fetchMarketDetail(marketId, platform as Platform),
    fetchTrades(marketId, platform as Platform),
  ]);

  if (!market) {
    return <NotFoundState />;
  }

  return (
    <MarketDetailClient
      market={market}
      trades={trades}
    />
  );
}

export default async function MarketDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingState />}>
      <MarketData id={id} />
    </Suspense>
  );
}

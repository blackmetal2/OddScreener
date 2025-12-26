import { Suspense } from 'react';
import { fetchTraderProfileData, fetchTraderPositions, fetchTraderTrades, fetchTraderClosedPositions } from '@/app/actions/markets';
import { fetchWalletTokenTransfers } from '@/lib/api/polygonscan';
import { getTraderCache, setTraderCache, getTraderCacheAge } from '@/lib/cache/trader-cache';
import TraderProfileClient from './TraderProfileClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ address: string }>;
}

// Minimal loading skeleton for initial page load
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-surface rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="w-48 h-6 bg-surface rounded animate-pulse" />
            <div className="w-32 h-4 bg-surface rounded animate-pulse" />
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface rounded-lg p-4">
              <div className="w-20 h-4 bg-background rounded animate-pulse mb-2" />
              <div className="w-28 h-6 bg-background rounded animate-pulse" />
            </div>
          ))}
        </div>
        {/* Content skeleton */}
        <div className="h-64 bg-surface rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

// Fast path: Check cache and return immediately if valid
async function getCachedOrFetch(address: string) {
  const cached = getTraderCache(address);
  if (cached) {
    const age = getTraderCacheAge(address);
    console.log(`[Trader] Cache hit for ${address.slice(0, 8)}... (${age}s old)`);
    return cached;
  }

  console.log(`[Trader] Cache miss for ${address.slice(0, 8)}... fetching fresh data`);

  // Fetch fresh data in parallel
  const [profile, positions, closedPositions, trades, transfers] = await Promise.all([
    fetchTraderProfileData(address),
    fetchTraderPositions(address),
    fetchTraderClosedPositions(address),
    fetchTraderTrades(address, 200),
    fetchWalletTokenTransfers(address, 1, 50),
  ]);

  const data = { profile, positions, closedPositions, trades, transfers };
  setTraderCache(address, data);

  return data;
}

async function TraderData({ address }: { address: string }) {
  const { profile, positions, closedPositions, trades, transfers } = await getCachedOrFetch(address);

  return (
    <TraderProfileClient
      address={address}
      profile={profile}
      positions={positions}
      closedPositions={closedPositions}
      trades={trades}
      transfers={transfers}
    />
  );
}

export default async function TraderPage({ params }: PageProps) {
  const { address } = await params;

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <TraderData address={address} />
    </Suspense>
  );
}

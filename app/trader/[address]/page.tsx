import { Suspense } from 'react';
import { fetchTraderProfileData, fetchTraderPositions, fetchTraderTrades, fetchTraderClosedPositions } from '@/app/actions/markets';
import { fetchWalletTokenTransfers } from '@/lib/api/polygonscan';
import TraderProfileClient from './TraderProfileClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

interface PageProps {
  params: Promise<{ address: string }>;
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary">Loading trader profile...</p>
      </div>
    </div>
  );
}

async function TraderData({ address }: { address: string }) {
  // Fetch all data in parallel
  const [profile, positions, closedPositions, trades, transfers] = await Promise.all([
    fetchTraderProfileData(address),
    fetchTraderPositions(address),
    fetchTraderClosedPositions(address),
    fetchTraderTrades(address, 1000),
    fetchWalletTokenTransfers(address, 1, 50),
  ]);

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
    <Suspense fallback={<LoadingState />}>
      <TraderData address={address} />
    </Suspense>
  );
}

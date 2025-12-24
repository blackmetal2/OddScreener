import WhaleTrackerClient from './WhaleTrackerClient';

export const metadata = {
  title: 'Whale Tracker | OddScreener',
  description: 'Track profitable Polymarket traders and their positions',
};

export interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string;
  profileImage?: string;
  profit: number;
  volume: number;
  winRate: number;
  tradesCount: number;
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    // Fetch from Polymarket Data API - correct v1 endpoint
    const response = await fetch(
      'https://data-api.polymarket.com/v1/leaderboard?window=7d&limit=50',
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) {
      console.error('Failed to fetch leaderboard:', response.status);
      return [];
    }

    const data = await response.json();

    // Transform API response to our format
    return (data || []).map((entry: any) => ({
      rank: parseInt(entry.rank) || 0,
      address: entry.proxyWallet || '',
      displayName: entry.userName || `Trader ${entry.rank}`,
      profileImage: entry.profileImage || undefined,
      profit: entry.pnl || 0,
      volume: entry.vol || 0,
      winRate: 0, // Not provided by API
      tradesCount: 0, // Not provided by API
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

export default async function WhalesPage() {
  const leaderboard = await fetchLeaderboard();

  return <WhaleTrackerClient initialLeaderboard={leaderboard} />;
}

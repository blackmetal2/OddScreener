import { redis, safeRedis } from '@/lib/upstash';

// Types
export interface PriceSnapshot {
  marketId: string;
  probability: number;
  timestamp: number;
  volume24h?: number;
}

export interface MarketPriceChanges {
  change1h: number;
  change6h: number;
  change24h: number;
}

// Constants
const SNAPSHOT_TTL = 60 * 60 * 25; // 25 hours (keep slightly more than 24h)
const HOUR_IN_SECONDS = 60 * 60;

/**
 * Get the hourly timestamp key (rounds down to nearest hour)
 */
function getHourlyTimestamp(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 1000 / HOUR_IN_SECONDS) * HOUR_IN_SECONDS;
}

/**
 * Store price snapshots for all markets (batch operation)
 * Called by cron job every hour
 */
export async function storePriceSnapshots(
  markets: Array<{ id: string; probability: number; volume24h?: number }>
): Promise<{ success: boolean; count: number }> {
  const timestamp = getHourlyTimestamp();
  const key = `prices:${timestamp}`;

  // Build snapshot object: { marketId: probability, ... }
  const snapshot: Record<string, number> = {};
  for (const market of markets) {
    snapshot[market.id] = market.probability;
  }

  return safeRedis<{ success: boolean; count: number }>(
    async () => {
      // Store as JSON with TTL
      await redis.set(key, JSON.stringify(snapshot), { ex: SNAPSHOT_TTL });
      return { success: true, count: markets.length };
    },
    { success: false, count: 0 }
  );
}

/**
 * Get snapshot from N hours ago
 */
async function getSnapshotFromHoursAgo(
  hoursAgo: number
): Promise<Record<string, number> | null> {
  const now = new Date();
  const targetTime = new Date(now.getTime() - hoursAgo * HOUR_IN_SECONDS * 1000);
  const timestamp = getHourlyTimestamp(targetTime);
  const key = `prices:${timestamp}`;

  return safeRedis(
    async () => {
      const data = await redis.get<string>(key);
      if (!data) return null;
      return typeof data === 'string' ? JSON.parse(data) : data;
    },
    null
  );
}

/**
 * Calculate price changes for a market using stored snapshots
 */
export async function getMarketPriceChanges(
  marketId: string,
  currentProbability: number
): Promise<MarketPriceChanges> {
  // Fetch all snapshots in parallel
  const [snapshot1h, snapshot6h, snapshot24h] = await Promise.all([
    getSnapshotFromHoursAgo(1),
    getSnapshotFromHoursAgo(6),
    getSnapshotFromHoursAgo(24),
  ]);

  // Calculate changes (current - past)
  const change1h = snapshot1h?.[marketId] != null
    ? Math.round((currentProbability - snapshot1h[marketId]) * 10) / 10
    : 0;

  const change6h = snapshot6h?.[marketId] != null
    ? Math.round((currentProbability - snapshot6h[marketId]) * 10) / 10
    : 0;

  const change24h = snapshot24h?.[marketId] != null
    ? Math.round((currentProbability - snapshot24h[marketId]) * 10) / 10
    : 0;

  return { change1h, change6h, change24h };
}

/**
 * Batch get price changes for multiple markets (more efficient)
 * Returns a map of marketId -> changes
 */
export async function getBatchMarketPriceChanges(
  markets: Array<{ id: string; probability: number }>
): Promise<Map<string, MarketPriceChanges>> {
  // Fetch all snapshots once
  const [snapshot1h, snapshot6h, snapshot24h] = await Promise.all([
    getSnapshotFromHoursAgo(1),
    getSnapshotFromHoursAgo(6),
    getSnapshotFromHoursAgo(24),
  ]);

  const changesMap = new Map<string, MarketPriceChanges>();

  for (const market of markets) {
    const change1h = snapshot1h?.[market.id] != null
      ? Math.round((market.probability - snapshot1h[market.id]) * 10) / 10
      : 0;

    const change6h = snapshot6h?.[market.id] != null
      ? Math.round((market.probability - snapshot6h[market.id]) * 10) / 10
      : 0;

    const change24h = snapshot24h?.[market.id] != null
      ? Math.round((market.probability - snapshot24h[market.id]) * 10) / 10
      : 0;

    changesMap.set(market.id, { change1h, change6h, change24h });
  }

  return changesMap;
}

/**
 * Check if we have recent snapshots (for health check)
 */
export async function hasRecentSnapshots(): Promise<boolean> {
  const timestamp = getHourlyTimestamp();
  const key = `prices:${timestamp}`;

  return safeRedis(
    async () => {
      const exists = await redis.exists(key);
      return exists === 1;
    },
    false
  );
}

/**
 * Get snapshot stats for debugging
 */
export async function getSnapshotStats(): Promise<{
  has1h: boolean;
  has6h: boolean;
  has24h: boolean;
  marketCount1h: number;
}> {
  const [snapshot1h, snapshot6h, snapshot24h] = await Promise.all([
    getSnapshotFromHoursAgo(1),
    getSnapshotFromHoursAgo(6),
    getSnapshotFromHoursAgo(24),
  ]);

  return {
    has1h: snapshot1h !== null,
    has6h: snapshot6h !== null,
    has24h: snapshot24h !== null,
    marketCount1h: snapshot1h ? Object.keys(snapshot1h).length : 0,
  };
}

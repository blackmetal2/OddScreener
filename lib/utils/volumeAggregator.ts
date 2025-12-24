import { MarketTrade, VolumeFlowPoint } from '@/types/market';

// Timeframe configuration for bucket sizes
export interface TimeframeConfig {
  bucketMinutes: number;
  maxPoints: number;
  lookbackMs: number;
}

export const TIMEFRAME_CONFIGS: Record<string, TimeframeConfig> = {
  '1h': { bucketMinutes: 1, maxPoints: 60, lookbackMs: 60 * 60 * 1000 },
  '6h': { bucketMinutes: 5, maxPoints: 72, lookbackMs: 6 * 60 * 60 * 1000 },
  '24h': { bucketMinutes: 15, maxPoints: 96, lookbackMs: 24 * 60 * 60 * 1000 },
  '7d': { bucketMinutes: 60, maxPoints: 168, lookbackMs: 7 * 24 * 60 * 60 * 1000 },
  '30d': { bucketMinutes: 240, maxPoints: 180, lookbackMs: 30 * 24 * 60 * 60 * 1000 },
  'all': { bucketMinutes: 1440, maxPoints: 365, lookbackMs: 365 * 24 * 60 * 60 * 1000 },
};

/**
 * Aggregate trades into time buckets by outcome
 */
export function aggregateTradesIntoVolume(
  trades: MarketTrade[],
  bucketMinutes: number = 5,
  lookbackMs?: number
): VolumeFlowPoint[] {
  if (!trades || trades.length === 0) return [];

  const now = Date.now();
  const bucketMs = bucketMinutes * 60 * 1000;

  // Filter trades by lookback if provided
  const filteredTrades = lookbackMs
    ? trades.filter((t) => now - new Date(t.timestamp).getTime() <= lookbackMs)
    : trades;

  if (filteredTrades.length === 0) return [];

  // Sort trades by timestamp
  const sortedTrades = [...filteredTrades].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Find time range
  const minTime = new Date(sortedTrades[0].timestamp).getTime();
  const maxTime = new Date(sortedTrades[sortedTrades.length - 1].timestamp).getTime();

  // Align to bucket boundaries
  const startBucket = Math.floor(minTime / bucketMs) * bucketMs;
  const endBucket = Math.floor(maxTime / bucketMs) * bucketMs;

  // Collect all unique outcomes
  const outcomeSet = new Set<string>();
  sortedTrades.forEach((t) => outcomeSet.add(t.outcome));
  const outcomes = Array.from(outcomeSet);

  // Create buckets map
  const buckets = new Map<number, { [outcome: string]: number }>();

  // Initialize all buckets with zero for all outcomes
  for (let bucket = startBucket; bucket <= endBucket; bucket += bucketMs) {
    const outcomeVolumes: { [outcome: string]: number } = {};
    outcomes.forEach((o) => (outcomeVolumes[o] = 0));
    buckets.set(bucket, outcomeVolumes);
  }

  // Aggregate trades into buckets
  sortedTrades.forEach((trade) => {
    const tradeTime = new Date(trade.timestamp).getTime();
    const bucketTime = Math.floor(tradeTime / bucketMs) * bucketMs;
    const bucket = buckets.get(bucketTime);
    if (bucket) {
      bucket[trade.outcome] = (bucket[trade.outcome] || 0) + trade.amount;
    }
  });

  // Convert to array
  const result: VolumeFlowPoint[] = [];
  buckets.forEach((outcomeVolumes, timestamp) => {
    result.push({
      timestamp: new Date(timestamp),
      outcomes: outcomeVolumes,
    });
  });

  return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Apply simple moving average for smoothing
 */
export function applyMovingAverage(
  data: VolumeFlowPoint[],
  windowSize: number = 3
): VolumeFlowPoint[] {
  if (data.length < windowSize) return data;

  // Get all outcome names
  const outcomeNames = Object.keys(data[0]?.outcomes || {});
  if (outcomeNames.length === 0) return data;

  const result: VolumeFlowPoint[] = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
    const windowData = data.slice(start, end);

    const smoothedOutcomes: { [outcome: string]: number } = {};

    outcomeNames.forEach((outcome) => {
      const sum = windowData.reduce((acc, point) => acc + (point.outcomes[outcome] || 0), 0);
      smoothedOutcomes[outcome] = sum / windowData.length;
    });

    result.push({
      timestamp: data[i].timestamp,
      outcomes: smoothedOutcomes,
    });
  }

  return result;
}

/**
 * Transform VolumeFlowPoint[] to Recharts-compatible format
 */
export function prepareChartData(
  data: VolumeFlowPoint[]
): Array<{ timestamp: number; [outcome: string]: number }> {
  return data.map((point) => ({
    timestamp: point.timestamp.getTime(),
    ...point.outcomes,
  }));
}

/**
 * Get unique outcome names from volume data
 */
export function getOutcomeNames(data: VolumeFlowPoint[]): string[] {
  if (data.length === 0) return [];
  return Object.keys(data[0].outcomes);
}

/**
 * Normalize outcome names for binary markets
 */
function normalizeOutcome(outcome: string): string {
  const lower = outcome.toLowerCase().trim();
  if (lower === 'yes' || lower === 'y') return 'Yes';
  if (lower === 'no' || lower === 'n') return 'No';
  return outcome;
}

/**
 * Calculate total volume per outcome across all time buckets
 */
function getOutcomeVolumes(data: VolumeFlowPoint[]): Map<string, number> {
  const volumes = new Map<string, number>();
  data.forEach((point) => {
    Object.entries(point.outcomes).forEach(([outcome, vol]) => {
      volumes.set(outcome, (volumes.get(outcome) || 0) + vol);
    });
  });
  return volumes;
}

/**
 * Filter to top N outcomes by volume
 */
function filterTopOutcomes(
  data: VolumeFlowPoint[],
  maxOutcomes: number = 5
): { filtered: VolumeFlowPoint[]; topOutcomes: string[] } {
  const volumes = getOutcomeVolumes(data);

  // Sort outcomes by total volume
  const sortedOutcomes = Array.from(volumes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxOutcomes)
    .map(([outcome]) => outcome);

  // Filter data to only include top outcomes
  const filtered = data.map((point) => {
    const filteredOutcomes: { [key: string]: number } = {};
    sortedOutcomes.forEach((outcome) => {
      filteredOutcomes[outcome] = point.outcomes[outcome] || 0;
    });
    return {
      timestamp: point.timestamp,
      outcomes: filteredOutcomes,
    };
  });

  return { filtered, topOutcomes: sortedOutcomes };
}

/**
 * Full pipeline: aggregate, smooth, and prepare chart data
 */
export function processTradesForVolumeChart(
  trades: MarketTrade[],
  timeframe: string = '24h'
): {
  chartData: Array<{ timestamp: number; [outcome: string]: number }>;
  outcomeNames: string[];
} {
  const config = TIMEFRAME_CONFIGS[timeframe] || TIMEFRAME_CONFIGS['24h'];

  // Normalize outcome names in trades
  const normalizedTrades = trades.map((t) => ({
    ...t,
    outcome: normalizeOutcome(t.outcome),
  }));

  // Aggregate trades into buckets
  const aggregated = aggregateTradesIntoVolume(
    normalizedTrades,
    config.bucketMinutes,
    config.lookbackMs
  );

  // Filter to top 5 outcomes by volume (to avoid chart clutter)
  const { filtered, topOutcomes } = filterTopOutcomes(aggregated, 5);

  // Apply smoothing
  const smoothed = applyMovingAverage(filtered, 3);

  // Prepare for Recharts
  const chartData = prepareChartData(smoothed);

  // Sort outcome names: Yes first, No second, then others
  const sortedOutcomes = topOutcomes.sort((a, b) => {
    if (a === 'Yes') return -1;
    if (b === 'Yes') return 1;
    if (a === 'No') return -1;
    if (b === 'No') return 1;
    return 0;
  });

  return { chartData, outcomeNames: sortedOutcomes };
}

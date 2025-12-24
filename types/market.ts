export type Platform = 'polymarket';

export type Category =
  | 'politics'
  | 'sports'
  | 'crypto'
  | 'finance'
  | 'world'
  | 'culture'
  | 'tech'
  | 'science';

export type MarketType = 'binary' | 'multi';

// For multi-outcome markets
export interface MarketOutcome {
  id: string;
  name: string;
  probability: number;
  change1h: number;
  change6h: number;
  change24h: number;
  volume24h: number;
}

export interface Market {
  id: string;
  name: string;
  platform: Platform;
  category: Category;
  marketType: MarketType;
  probability: number;      // For binary: YES probability. For multi: highest outcome
  change1h: number;
  change6h: number;
  change24h: number;
  volume24h: number;
  trades24h: number;
  endsAt: Date;
  createdAt: Date;
  imageUrl?: string;
  isHot?: boolean;
  // Multi-outcome specific
  outcomes?: MarketOutcome[];
  // Trending score (calculated from volume spike + price movement + recency)
  trendingScore?: number;
}

// Extended market data for detail page
export interface MarketDetail extends Market {
  description: string;
  resolutionSource: string;
  rules: string;
  totalVolume: number;
  openInterest: number;
  uniqueTraders: number;
  liquidityDepth: number;
  allTimeHigh: number;
  allTimeHighDate: Date;
  allTimeLow: number;
  allTimeLowDate: Date;
  platformUrl: string;
  // Stats breakdown
  stats: {
    trades: number;
    yesTrades: number;
    noTrades: number;
    yesVolume: number;
    noVolume: number;
    uniqueTraders: number;
  };
}

// Trade/Activity feed
export interface MarketTrade {
  id: string;
  timestamp: Date;
  type: 'buy' | 'sell';
  outcome: string; // 'YES', 'NO', or outcome name for multi
  amount: number;  // USD
  shares: number;
  price: number;   // 0-1
  trader: string;  // Display name or pseudonym
  traderAddress: string; // Full wallet address for navigation
}

// Price history point (binary markets)
export interface PricePoint {
  timestamp: Date;
  probability: number;
  volume: number;
}

// Price history for multi-outcome markets
export interface MultiOutcomePricePoint {
  timestamp: Date;
  outcomes: { [outcomeName: string]: number }; // outcomeName -> probability (0-100)
}

// Volume flow data point for charting
export interface VolumeFlowPoint {
  timestamp: Date;
  outcomes: { [outcomeName: string]: number }; // outcomeName -> volume in USD
}

// Top holders for a market
export interface MarketHolder {
  wallet: string;
  name: string;
  profileImage?: string;
  outcome: string; // 'YES', 'NO', or outcome name
  amount: number; // Share amount
  bio?: string;
}

export interface FilterState {
  timeframe: '1h' | '6h' | '24h' | 'all';
  platform: Platform | 'all';
  category: Category | 'all';
  sortBy: 'volume' | 'change' | 'probability' | 'ending';
  sortOrder: 'asc' | 'desc';
  search: string;
}

export interface GlobalStats {
  totalVolume24h: number;
  openPositions24h: number;
  activeMarkets: number;
}

// News article for market context
export interface NewsArticle {
  title: string;
  link: string;
  source: string;
  pubDate: Date;
}

// WebSocket real-time update
export interface MarketUpdate {
  id: string;
  platform: Platform;
  probability?: number;
  volume24h?: number;
  change24h?: number;
  timestamp: Date;
  // For multi-outcome markets
  outcomes?: Array<{
    id: string;
    probability: number;
  }>;
}

// Trader Profile Types
export interface TraderPosition {
  marketId: string;
  marketTitle: string;
  marketSlug: string;
  marketImage?: string;
  outcome: string;
  side: 'YES' | 'NO';
  shares: number;
  currentValue: number;
  avgPrice: number;
  invested: number;
  realizedPnl: number;
  unrealizedPnl: number;
  overallPnl: number;
  resolved: boolean;
}

export interface TraderClosedPosition {
  marketId: string;
  marketTitle: string;
  marketSlug: string;
  marketImage?: string;
  outcome: string;
  avgPrice: number;
  totalBought: number;
  realizedPnl: number;
  closedAt: Date;
}

export interface TraderTrade {
  id: string;
  timestamp: Date;
  side: 'buy' | 'sell' | 'redeem' | 'merge';
  marketTitle: string;
  marketSlug: string;
  marketImage?: string;
  outcome: string;
  outcomeIndex: number;
  value: number;
  price: number;
  shares: number;
}

export interface TraderProfile {
  address: string;
  displayName: string;
  profileImage?: string;
  rank: number;
  pnl: number;
  volume: number;
  positionsCount: number;
  tradesCount: number;
}

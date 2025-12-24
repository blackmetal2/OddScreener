// ============================================
// Polymarket API Types (Gamma + CLOB)
// ============================================

export interface PolymarketOutcome {
  id: string;
  name: string;
  probability: number;
}

export interface PolymarketMarketEvent {
  id: string;
  ticker: string;
  slug: string; // Event slug for URL (e.g., "will-trump-release-epstein-files-by")
  title: string;
  description: string;
}

export interface PolymarketMarket {
  id: string; // Numeric ID for API lookups (e.g., "516710")
  question: string;
  conditionId: string; // Hex condition ID (e.g., "0xfa48...")
  slug: string; // Market slug (NOT for URL - use events[0].slug)
  endDate: string;
  createdAt: string;
  volume: number;
  volume24hr: number;
  volume1wk: number; // 7-day volume for trending calculation
  volume1mo: number; // 30-day volume
  volumeNum: number;
  volume24hrNum: number;
  liquidity: number;
  liquidityNum: number;
  outcomePrices: string; // JSON string like "[0.65, 0.35]"
  clobTokenIds: string; // JSON string of token IDs
  outcomes: string; // JSON string like '["Yes", "No"]' or multiple outcomes
  events: PolymarketMarketEvent[] | string; // JSON string or array of parent events
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  active: boolean;
  acceptingOrders: boolean;
  image: string;
  icon: string;
  description: string;
  tags: PolymarketTag[];
  // Trending/price change fields
  oneDayPriceChange?: number; // 24h price change (e.g., -0.002 = -0.2%)
  oneWeekPriceChange?: number; // 7d price change
  competitive?: number; // Competitiveness score (0-1)
}

export interface PolymarketTag {
  id: string;
  label: string;
  slug: string;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  endDate: string;
  createdAt: string;
  volume: number;
  volume24hr: number;
  liquidity: number;
  markets: PolymarketMarket[];
  tags: PolymarketTag[];
  image: string;
  icon: string;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  commentCount: number;
}

export interface PolymarketEventsResponse {
  data: PolymarketEvent[];
  next_cursor?: string;
}

export interface PolymarketPricePoint {
  t: number; // Unix timestamp
  p: number; // Price (0-1)
}

export interface PolymarketPriceHistoryResponse {
  history: PolymarketPricePoint[];
}

// ============================================
// Polymarket Data API Types (Holders/Positions)
// ============================================

export interface PolymarketHolder {
  proxyWallet: string;
  bio: string;
  asset: string;
  pseudonym: string;
  amount: number;
  displayUsernamePublic: boolean;
  outcomeIndex: number;
  name: string;
  profileImage: string;
  profileImageOptimized: string;
}

export interface PolymarketTokenHolders {
  token: string;
  holders: PolymarketHolder[];
}

export interface PolymarketHoldersResponse extends Array<PolymarketTokenHolders> {}

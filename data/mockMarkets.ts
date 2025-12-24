import { Market, MarketDetail, MarketTrade, GlobalStats } from '@/types/market';

// Helper to create dates relative to now
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000);
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export const mockMarkets: Market[] = [
  // Multi-outcome: Fed Chair nomination
  {
    id: '1',
    name: 'Who will Trump nominate as Fed Chair?',
    platform: 'polymarket',
    category: 'politics',
    marketType: 'multi',
    probability: 54, // highest outcome
    change1h: 2.1,
    change6h: 5.3,
    change24h: 12.4,
    volume24h: 72000000,
    trades24h: 45230,
    endsAt: daysFromNow(45),
    createdAt: daysAgo(14),
    isHot: true,
    outcomes: [
      { id: '1a', name: 'Kevin Hassett', probability: 54, change1h: 2.1, change6h: 5.3, change24h: 12.4, volume24h: 35000000 },
      { id: '1b', name: 'Kevin Warsh', probability: 21, change1h: -1.2, change6h: -2.8, change24h: -5.1, volume24h: 18000000 },
      { id: '1c', name: 'Christopher Waller', probability: 16, change1h: -0.5, change6h: -1.5, change24h: -3.2, volume24h: 12000000 },
      { id: '1d', name: 'Rick Rieder', probability: 6, change1h: -0.2, change6h: -0.8, change24h: -2.1, volume24h: 5000000 },
      { id: '1e', name: 'Scott Bessent', probability: 3, change1h: -0.2, change6h: -0.2, change24h: -2.0, volume24h: 2000000 },
    ],
  },
  // Binary: Epstein files
  {
    id: '3',
    name: 'Epstein files released by Dec 31?',
    platform: 'polymarket',
    category: 'politics',
    marketType: 'binary',
    probability: 98,
    change1h: 0.5,
    change6h: 1.2,
    change24h: 3.1,
    volume24h: 23000000,
    trades24h: 18500,
    endsAt: daysFromNow(12),
    createdAt: daysAgo(30),
    isHot: true,
  },
  // Binary: Maduro
  {
    id: '4',
    name: 'Maduro out by January 2026?',
    platform: 'polymarket',
    category: 'politics',
    marketType: 'binary',
    probability: 16,
    change1h: -1.2,
    change6h: -3.4,
    change24h: -5.8,
    volume24h: 29000000,
    trades24h: 21300,
    endsAt: daysFromNow(400),
    createdAt: daysAgo(60),
  },
  // Multi-outcome: Boxing match
  {
    id: '6',
    name: 'Jake Paul vs Anthony Joshua winner?',
    platform: 'polymarket',
    category: 'sports',
    marketType: 'multi',
    probability: 90, // Anthony Joshua
    change1h: 2.8,
    change6h: 6.5,
    change24h: 12.3,
    volume24h: 56000000,
    trades24h: 93300,
    endsAt: hoursFromNow(6),
    createdAt: daysAgo(45),
    isHot: true,
    outcomes: [
      { id: '6a', name: 'Anthony Joshua', probability: 90, change1h: 2.8, change6h: 6.5, change24h: 12.3, volume24h: 40000000 },
      { id: '6b', name: 'Jake Paul', probability: 8, change1h: -3.2, change6h: -8.1, change24h: -15.0, volume24h: 14000000 },
      { id: '6c', name: 'Draw', probability: 2, change1h: 0.4, change6h: 1.6, change24h: 2.7, volume24h: 2000000 },
    ],
  },
  // Multi-outcome: CFB Championship
  {
    id: '8',
    name: 'College Football Championship Winner?',
    platform: 'polymarket',
    category: 'sports',
    marketType: 'multi',
    probability: 30,
    change1h: 1.5,
    change6h: 3.2,
    change24h: 5.8,
    volume24h: 28000000,
    trades24h: 19800,
    endsAt: daysFromNow(25),
    createdAt: daysAgo(90),
    outcomes: [
      { id: '8a', name: 'Ohio State', probability: 30, change1h: 1.5, change6h: 3.2, change24h: 5.8, volume24h: 10000000 },
      { id: '8b', name: 'Texas', probability: 28, change1h: 0.8, change6h: 2.1, change24h: 4.2, volume24h: 9000000 },
      { id: '8c', name: 'Oregon', probability: 22, change1h: -1.2, change6h: -2.5, change24h: -4.8, volume24h: 5000000 },
      { id: '8d', name: 'Notre Dame', probability: 20, change1h: -1.1, change6h: -2.8, change24h: -5.2, volume24h: 4000000 },
    ],
  },
  // Binary: Bitcoin
  {
    id: '10',
    name: 'Bitcoin above $110k by Dec 31?',
    platform: 'polymarket',
    category: 'crypto',
    marketType: 'binary',
    probability: 45,
    change1h: -2.1,
    change6h: -5.4,
    change24h: -12.3,
    volume24h: 15000000,
    trades24h: 32100,
    endsAt: daysFromNow(12),
    createdAt: daysAgo(45),
  },
  // Multi-outcome: Fed decision
  {
    id: '14',
    name: 'Fed decision in January?',
    platform: 'polymarket',
    category: 'finance',
    marketType: 'multi',
    probability: 77,
    change1h: 0.4,
    change6h: 1.2,
    change24h: 2.5,
    volume24h: 41000000,
    trades24h: 35600,
    endsAt: daysFromNow(42),
    createdAt: daysAgo(21),
    outcomes: [
      { id: '14a', name: 'No change', probability: 77, change1h: 0.4, change6h: 1.2, change24h: 2.5, volume24h: 25000000 },
      { id: '14b', name: '25 bps decrease', probability: 21, change1h: -0.3, change6h: -1.1, change24h: -2.2, volume24h: 14000000 },
      { id: '14c', name: '50+ bps decrease', probability: 2, change1h: -0.1, change6h: -0.1, change24h: -0.3, volume24h: 2000000 },
    ],
  },
  // Binary: Russia-Ukraine
  {
    id: '17',
    name: 'Russia-Ukraine ceasefire in 2025?',
    platform: 'polymarket',
    category: 'world',
    marketType: 'binary',
    probability: 4,
    change1h: 0.2,
    change6h: 0.5,
    change24h: 1.1,
    volume24h: 61000000,
    trades24h: 42100,
    endsAt: daysFromNow(12),
    createdAt: daysAgo(180),
  },
  // Multi-outcome: Brazil election
  {
    id: '19',
    name: 'Brazil Presidential Election 2026?',
    platform: 'polymarket',
    category: 'world',
    marketType: 'multi',
    probability: 47,
    change1h: -0.8,
    change6h: -2.1,
    change24h: -4.5,
    volume24h: 9000000,
    trades24h: 12300,
    endsAt: daysFromNow(700),
    createdAt: daysAgo(120),
    outcomes: [
      { id: '19a', name: 'Lula da Silva', probability: 47, change1h: -0.8, change6h: -2.1, change24h: -4.5, volume24h: 4000000 },
      { id: '19b', name: 'Tarcisio de Freitas', probability: 18, change1h: 0.5, change6h: 1.2, change24h: 2.8, volume24h: 2000000 },
      { id: '19c', name: 'Flávio Bolsonaro', probability: 17, change1h: 0.3, change6h: 0.8, change24h: 1.5, volume24h: 1500000 },
      { id: '19d', name: 'Other', probability: 18, change1h: 0.0, change6h: 0.1, change24h: 0.2, volume24h: 1500000 },
    ],
  },
  // Binary: TikTok
  {
    id: '20',
    name: 'TikTok sale announced by Dec 31?',
    platform: 'polymarket',
    category: 'tech',
    marketType: 'binary',
    probability: 73,
    change1h: 1.5,
    change6h: 3.8,
    change24h: 8.2,
    volume24h: 6000000,
    trades24h: 15600,
    endsAt: daysFromNow(12),
    createdAt: daysAgo(60),
  },
];

// Mock detailed market data
export function getMarketDetail(id: string): MarketDetail | null {
  const market = mockMarkets.find(m => m.id === id);
  if (!market) return null;

  return {
    ...market,
    description: `This market resolves based on official announcements and verified news sources.`,
    resolutionSource: market.category === 'politics'
      ? 'Official government announcement'
      : market.category === 'sports'
      ? 'Official league/organization results'
      : 'Primary source verification',
    rules: `Market resolves YES if the condition is met before the resolution date. Otherwise resolves NO.`,
    totalVolume: market.volume24h * 15, // Mock total
    openInterest: market.volume24h * 0.3,
    uniqueTraders: Math.floor(market.trades24h * 0.4),
    liquidityDepth: market.volume24h * 0.05,
    allTimeHigh: Math.min(99, market.probability + Math.floor(Math.random() * 20)),
    allTimeHighDate: daysAgo(Math.floor(Math.random() * 30)),
    allTimeLow: Math.max(1, market.probability - Math.floor(Math.random() * 30)),
    allTimeLowDate: daysAgo(Math.floor(Math.random() * 60) + 30),
    platformUrl: `https://polymarket.com/event/${id}`,
    stats: {
      trades: market.trades24h,
      yesTrades: Math.floor(market.trades24h * 0.6),
      noTrades: Math.floor(market.trades24h * 0.4),
      yesVolume: market.volume24h * 0.55,
      noVolume: market.volume24h * 0.45,
      uniqueTraders: Math.floor(market.trades24h * 0.15),
    },
  };
}

// Mock trades
export function getMarketTrades(marketId: string): MarketTrade[] {
  const market = mockMarkets.find(m => m.id === marketId);
  if (!market) return [];

  const outcomes = market.marketType === 'binary'
    ? ['YES', 'NO']
    : market.outcomes?.map(o => o.name) || ['YES', 'NO'];

  return Array.from({ length: 50 }, (_, i) => {
    const walletAddress = `0x${Math.random().toString(16).slice(2, 42).padEnd(40, '0')}`;
    return {
      id: `trade-${marketId}-${i}`,
      timestamp: new Date(Date.now() - i * 30000 - Math.random() * 60000),
      type: Math.random() > 0.5 ? 'buy' : 'sell',
      outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
      amount: Math.floor(Math.random() * 10000) + 100,
      shares: Math.floor(Math.random() * 5000) + 50,
      price: Math.random() * 0.8 + 0.1,
      trader: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      traderAddress: walletAddress,
    };
  });
}

export const globalStats: GlobalStats = {
  totalVolume24h: mockMarkets.reduce((sum, m) => sum + m.volume24h, 0),
  openPositions24h: mockMarkets.reduce((sum, m) => Math.round(m.volume24h / 100), 0),
  activeMarkets: mockMarkets.length,
};

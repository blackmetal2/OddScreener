# OddScreener (PredictScreener) - Complete Codebase Analysis

**Analysis Date**: December 24, 2025
**App URL**: http://localhost:3000
**Repository**: /home/victor/predictscreener

---

## Executive Summary

**OddScreener** is a Next.js 16-based prediction market aggregator that provides real-time screening, analytics, and tracking of markets from Polymarket (with Kalshi support planned). The app features whale tracking, watchlists, alerts, news integration, and WebSocket-powered live updates.

### Tech Stack
- **Framework**: Next.js 16.1.1 (App Router)
- **Frontend**: React 19.2.3, TypeScript 5.9.3, Tailwind CSS 3.4.19
- **Charts**: Recharts 3.6.0
- **Auth**: Privy (@privy-io/react-auth)
- **Caching**: Upstash Redis, file-based JSON cache
- **Real-time**: WebSocket connections to Polymarket CLOB

---

## Architecture Overview

```
/predictscreener
├── app/                    # Next.js App Router (8 routes + 3 API endpoints)
├── components/             # 16 React components in 9 categories
├── lib/                    # API clients, hooks, utilities
├── types/                  # TypeScript definitions (50+ types)
├── data/                   # Static data and cache files
├── tasks/                  # Documentation and planning
└── research/               # API investigation notes
```

---

## Page Routes & Features

### 1. Home Page (`/`)
**Files**: `app/page.tsx`, `app/MarketsPageClient.tsx`

| Feature | Description |
|---------|-------------|
| Market Table | 50 markets/page with 10 sortable columns |
| Filters | Platform, Category (8), Timeframe (Trending/1H/6H/24H) |
| Sorting | Volume, Change, Probability, Ending Soon |
| Advanced Filters | Probability range, Volume range, Closing time, Hot/Multi toggles |
| Real-time | WebSocket updates for top 50 visible markets |
| Stats Bar | 24H Volume ($82M+), Positions (800K+), Markets (500-2000) |

### 2. Whale Tracker (`/whales`)
**Files**: `app/whales/page.tsx`, `app/whales/WhaleTrackerClient.tsx`

- Top 50 traders by 7-day profit from Polymarket Data API
- Custom wallet tracking (localStorage persistence)
- Links to trader profiles

### 3. Market Detail (`/market/[id]`)
**Files**: `app/market/[id]/page.tsx`, `app/market/[id]/MarketDetailClient.tsx`

- Price history charts (line + scatter)
- Volume flow visualization
- Trade history table
- Top holders/positions
- Contextual news (Google News RSS)
- Watchlist + Alerts integration

### 4. Trader Profile (`/trader/[address]`)
**Files**: `app/trader/[address]/page.tsx`, `app/trader/[address]/TraderProfileClient.tsx`

- Trader stats (rank, P&L, volume)
- Open positions (up to 200)
- Closed positions (up to 500)
- Trade history (up to 1000)
- Wallet activity (Polygonscan)

### 5. Watchlist (`/watchlist`)
- User's tracked markets (localStorage)
- Quick access to market details

### 6. News (`/news`)
**Files**: `app/news/page.tsx`, `app/news/NewsClient.tsx`

- Real-time news aggregation (Google News RSS)
- Category filtering
- Auto-refresh every 60 seconds
- Sound notifications for new articles

### 7. Insider Tracker (`/insiders`)
- Coming Soon placeholder

---

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/refresh-markets` | GET | Force refresh market cache |
| `/api/news` | GET | Client-side news polling |
| `/api/cron/snapshot-prices` | GET | Hourly price snapshot cron (Vercel) |

---

## Component Library (16 Components)

### Layout (2)
- **Sidebar** - Main navigation with search, filters, social links
- **StatsBar** - Global stats display + auth button

### Table (3)
- **MarketsTable** - Main data table with sorting
- **TableSkeleton** - Loading state
- **StackedProgressBar** - Binary/multi-outcome visualization

### Charts (4)
- **PriceChart** - Area chart for probability history
- **VolumeFlowChart** - Stacked area for volume distribution
- **TradeScatterChart** - Scatter plot with whale detection
- **MultiOutcomePriceChart** - Multi-line for multi-outcome markets

### Filters (2)
- **FilterBar** - Timeframe, platform, category pills
- **FilterModal** - Advanced filter dialog

### UI (2)
- **CategoryBadge** - Styled category labels with icons
- **Tooltip** - Hover tooltips

### Other (3)
- **PlatformIcons** - Polymarket/Kalshi logos
- **AlertsModal** - Price alert management
- **PrivyProvider** - Auth context wrapper

---

## API Integration Layer (`/lib`)

### Polymarket Client (`lib/api/polymarket.ts`)
- **Gamma API**: Market listing, events, metadata
- **CLOB API**: Order books, spreads, price history
- **Data API**: Holders, trades, positions, leaderboard

### Key Features
- Batch spread fetching (100 markets)
- Multi-outcome support
- Spam filtering (excluded tag IDs)
- Volume threshold ($1,000 minimum)
- Smart category mapping

### Other APIs
- **Google News RSS**: Contextual news
- **Adjacent News API**: Alternative news source
- **Polygonscan**: Wallet activity tracking

### Caching Strategy
- **File-based**: `data/markets-cache.json` (5-min TTL)
- **Redis**: Upstash for price snapshots (25-hour TTL)

### Real-time (`lib/hooks/useMarketWebSocket.ts`)
- Polymarket WebSocket (`wss://ws-subscriptions-clob.polymarket.com`)
- Auto-reconnection (5 attempts, exponential backoff)
- Subscribes only to visible markets

---

## Type System (`/types/market.ts`)

### Core Types
```typescript
Platform = 'polymarket'
Category = 'politics' | 'sports' | 'crypto' | 'finance' | 'world' | 'culture' | 'tech' | 'science'
MarketType = 'binary' | 'multi'
TradabilityStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'
```

### Key Interfaces
- **Market** (50+ fields) - Main market object
- **MarketDetail** - Extended for detail pages
- **MarketTrade** - Individual trade record
- **TraderProfile** - Trader stats and rank
- **TraderPosition** - Open/closed positions

---

## Known Issues & Performance

### Critical Performance Issues
| Issue | Impact | Status |
|-------|--------|--------|
| 2,000 markets initial fetch | 9s load time, 16MB data | Identified |
| No Next.js caching (>2MB responses) | Every request hits API | Identified |
| 100 price history API calls | +2-3s load time | Planned fix (Upstash) |
| 400KB Recharts bundle | Slower FCP | Needs lazy loading |
| Client-side filtering on 2,000 items | 100-300ms UI blocking | Identified |

### UI Issues
- Chart Y-axis shows "0001%" (precision bug)
- "$0 traders" display (should be "0 traders")
- Trade data requires authentication
- Social links point to "#"
- URL doesn't update with filters

### Quick Fixes Available
1. Reduce market fetch: 2000 → 100
2. Reduce page size: 500 → 100
3. Disable price change calculations
4. Lazy load charts

**Expected improvement**: 9s → 2s load time (78% faster)

---

## Planned Features

### Upstash Redis Snapshots (Implementation Plan Ready)
- Hourly price snapshots
- Calculate 1h/6h/24h changes from Redis
- Replace 100 API calls with Redis lookups
- Estimated cost: ~$10/month

### News Feature (Planning Complete)
- MVP: 3-4 weeks, $100-200/month
- AI summaries, sentiment indicators
- Market linking
- Real-time "Breaking" badges

---

## Development Quick Reference

### Run Commands
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Environment Variables
```
NEXT_PUBLIC_POLYGONSCAN_API_KEY  # Polygon explorer
NEXT_PUBLIC_PRIVY_APP_ID          # Auth service
UPSTASH_REDIS_REST_URL            # Redis endpoint
UPSTASH_REDIS_REST_TOKEN          # Redis auth
```

### Key File Locations
- **Main page logic**: `app/MarketsPageClient.tsx`
- **API client**: `lib/api/polymarket.ts`
- **Market normalization**: `lib/api/markets.ts`
- **WebSocket hook**: `lib/hooks/useMarketWebSocket.ts`
- **Types**: `types/market.ts`
- **Cache**: `lib/cache/markets-cache.ts`

---

## Action Items Priority

### Immediate (1-2 hours)
1. [ ] Reduce initial market fetch (2000 → 100)
2. [ ] Fix page size for caching (500 → 100)
3. [ ] Disable expensive price calculations

### Short-term (1-2 days)
4. [ ] Implement Upstash snapshots
5. [ ] Lazy load Recharts components
6. [ ] Fix chart precision bugs

### Medium-term (1-2 weeks)
7. [ ] Add URL params for filter persistence
8. [ ] Complete News page MVP
9. [ ] Fix social links
10. [ ] Add authenticated trade data

---

## File Count Summary

| Directory | Files | Purpose |
|-----------|-------|---------|
| app/ | 25 | Routes, layouts, API |
| components/ | 16 | React components |
| lib/ | 12 | Utilities, API clients |
| types/ | 1 | TypeScript definitions |
| tasks/ | 8 | Planning documents |
| research/ | 1 | API investigation |

**Total TypeScript/TSX Files**: ~55
**Total Lines of Code**: ~8,000+ (excluding node_modules)

---

*This document provides a complete understanding of the OddScreener codebase for future development, debugging, and enhancement work.*

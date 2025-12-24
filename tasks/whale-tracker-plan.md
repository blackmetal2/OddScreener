# Whale Tracker Feature - Implementation Plan

## Overview
Build a whale tracking feature that lets users track profitable traders using Polymarket Data API.

## Current State Analysis
- Basic top holders already displayed in MarketDetailClient.tsx (uses `/holders` endpoint)
- Existing navigation structure with Sidebar.tsx
- LocalStorage pattern used for watchlist and alerts
- Server Actions pattern in `/app/actions/markets.ts`

## API Endpoints Available
1. `GET https://data-api.polymarket.com/positions?user={wallet}` - User positions with P&L
2. `GET https://data-api.polymarket.com/activity?user={wallet}` - User trade history
3. `GET https://data-api.polymarket.com/leaderboard` - Top traders

## Implementation Tasks

### 1. Create Polymarket Data API Functions
**File**: `/lib/api/polymarketData.ts` (NEW)
- [ ] `fetchUserPositions(wallet: string)` - Get positions with P&L
- [ ] `fetchUserActivity(wallet: string)` - Get recent trades
- [ ] `fetchLeaderboard()` - Get top profitable traders
- Add TypeScript types for responses

### 2. Create Server Actions
**File**: `/app/actions/whales.ts` (NEW)
- [ ] `getWhalePositions(wallet: string)` - Server action wrapper
- [ ] `getWhaleActivity(wallet: string)` - Server action wrapper
- [ ] `getLeaderboard()` - Server action wrapper

### 3. Create Whale Tracker Page
**File**: `/app/whales/page.tsx` (NEW)
- [ ] Server component that fetches leaderboard data
- [ ] Pass data to client component
- [ ] Add metadata

### 4. Create Whale Tracker Client Component
**File**: `/app/whales/WhaleTrackerClient.tsx` (NEW)
- [ ] Leaderboard section (top profitable wallets)
- [ ] Tracked wallets section
- [ ] Add/remove wallet functionality (localStorage)
- [ ] View wallet details (positions, P&L, recent trades)
- [ ] Simple card-based layout

### 5. Update Navigation
**File**: `/components/layout/Sidebar.tsx`
- [ ] Add "Whales" link in navigation (after Alerts, before Discover section)
- [ ] Whale icon SVG

### 6. Update Types
**File**: `/lib/api/types.ts` or create `/types/whale.ts`
- [ ] `WhalePosition` type
- [ ] `WhaleActivity` type
- [ ] `LeaderboardEntry` type

## Design Decisions
- **Free feature** - no premium restrictions
- **LocalStorage** for tracked wallets (same pattern as watchlist)
- **Simple UI** - cards and tables, no complex charts
- **Focus on P&L** - highlight profitable traders
- **Minimal code changes** - keep it focused

## File Structure
```
/app/whales/
  - page.tsx (server component)
  - WhaleTrackerClient.tsx (client component)

/app/actions/
  - whales.ts (server actions)

/lib/api/
  - polymarketData.ts (data API functions)

/types/
  - whale.ts (optional, or add to existing types.ts)
```

## Next Steps
1. Review this plan with user
2. Start with API functions and types
3. Build server actions
4. Create page components
5. Update navigation
6. Test functionality

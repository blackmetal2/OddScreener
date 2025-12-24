# Arbitrage Scanner Implementation Plan

## Overview
Build a cross-platform arbitrage scanner that finds price discrepancies between Polymarket and Kalshi for similar markets.

## Tasks

### 1. Create Type Definitions
- [ ] Add `ArbitrageOpportunity` interface to `/types/market.ts`
  - polymarketMarket, kalshiMarket
  - spread, profitPotential
  - executionInstructions

### 2. Create Arbitrage Server Action
- [ ] Add `findArbitrageOpportunities()` to `/app/actions/markets.ts`
  - Fetch markets from both platforms
  - Implement simple string similarity matching
  - Match by title, end date (within 24h), category
  - Calculate spread: |polymarket_price - kalshi_price|
  - Calculate net profit after fees (Polymarket ~1%, Kalshi ~2%)
  - Filter to only show opportunities >3% spread
  - Return sorted by profit potential

### 3. Create Arbitrage Client Component
- [ ] Create `/app/arbitrage/ArbitrageClient.tsx`
  - Display arbitrage opportunities in a table
  - Show: Market name, Polymarket price, Kalshi price, Spread %, Profit %
  - Highlight profitable opportunities (>3% spread)
  - Show execution instructions (which platform to buy/sell)
  - Add loading states
  - Add empty state when no opportunities found

### 4. Create Arbitrage Page
- [ ] Create `/app/arbitrage/page.tsx`
  - Server component that calls `findArbitrageOpportunities()`
  - Pass data to ArbitrageClient
  - Add page metadata

### 5. Update Sidebar Navigation
- [ ] Update `/components/layout/Sidebar.tsx`
  - Add "Arbitrage" menu item under "Discover" section
  - Add arbitrage icon (swap/arrows icon)
  - Link to `/arbitrage`

### 6. Implement String Similarity Helper
- [ ] Add `calculateStringSimilarity()` to `/lib/utils.ts`
  - Simple Levenshtein distance or Jaccard similarity
  - No external dependencies
  - Return similarity score 0-1

## Technical Details

### Market Matching Criteria
```typescript
Markets match if:
1. Title similarity > 70%
2. End date within 24 hours of each other
3. Same category
4. Both are binary markets (not multi-outcome)
```

### Profit Calculation
```typescript
// Example: Polymarket YES = 60%, Kalshi YES = 65%
spread = Math.abs(polymarket_price - kalshi_price)
grossProfit = spread * 100  // as percentage

// Account for fees
polymarketFee = 1%
kalshiFee = 2%
totalFees = polymarketFee + kalshiFee

netProfit = grossProfit - totalFees

// Only show if netProfit > 3%
```

### Execution Instructions
```typescript
if (polymarket_price < kalshi_price) {
  return "Buy YES on Polymarket, Sell YES on Kalshi"
} else {
  return "Buy YES on Kalshi, Sell YES on Polymarket"
}
```

## Simplicity Guidelines
- Use existing UI patterns from the codebase
- No external libraries for matching (simple string similarity)
- Reuse existing components where possible
- Keep initial version focused on binary markets only
- Basic table layout similar to MarketsTable

## Review Section
_To be filled after implementation_

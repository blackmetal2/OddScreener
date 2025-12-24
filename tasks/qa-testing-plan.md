# QA Testing Plan for OddScreener

## Test Areas

### 1. Markets Page (Home) - `/`
- [ ] Markets table loads with data
- [ ] ENDS column shows urgency colors (red < 1h, orange < 24h, yellow < 7d, green > 7d)
- [ ] 1h/6h/24h price changes showing values (not all +0.00%)
- [ ] Pagination works (50 per page, prev/next buttons)
- [ ] Filters work (timeframe, category, search)
- [ ] Click market row → navigates to market detail

### 2. Market Detail Page - `/market/[id]`
- [ ] Market info displays correctly
- [ ] Price chart renders
- [ ] Tabs work (Overview, Trades, Holders, News)

### 3. Whale Tracker Page - `/whales`
- [ ] Leaderboard loads with top traders
- [ ] Click trader row → navigates to `/trader/{address}`
- [ ] Track star button works (adds to tracked list)
- [ ] Tracked wallets section shows tracked whales
- [ ] Click tracked whale → navigates to trader profile

### 4. Trader Profile Page - `/trader/[address]`
- [ ] Profile header with name, rank, links
- [ ] Stats cards show PnL, gains, losses, etc.
- [ ] 4 tabs work: Overview, Positions, Trades, Deposits/Withdrawals
- [ ] Tables have data and pagination
- [ ] Back button works

### 5. Watchlist Page - `/watchlist`
- [ ] Page loads correctly

### 6. General
- [ ] Navigation between pages smooth
- [ ] No console errors
- [ ] Responsive layout
- [ ] Loading states appear

## Test Results

[Results will be added during testing]

## Bugs Found

[Bugs will be documented here]

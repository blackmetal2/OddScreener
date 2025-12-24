# BetMoar/Polymarket Analytics API Investigation

## Task
Investigate how betmoar.fun (which redirects to polymarketanalytics.com) fetches market-specific trades from Polymarket.

## Findings

### Domain Redirect
- betmoar.fun redirects to polymarketanalytics.com
- The site is a Polymarket analytics dashboard built on Next.js/Vercel

### Key API Endpoints Discovered

#### 1. Activity Trades Endpoint
- **URL**: `POST https://polymarketanalytics.com/api/activity-trades`
- **Method**: POST
- **Status**: Returns 500 error with empty body `{}`
- **Error Response**: `{"error":"An error occurred while fetching data"}`
- **Headers**:
  - `Content-Type: application/json`
  - `x-ratelimit-limit: 120`
  - `x-ratelimit-remaining: 118`

#### 2. Combined Markets Endpoint
- **URL**: `POST https://polymarketanalytics.com/api/combined-markets`
- **Method**: POST
- **Note**: Also returned 500 errors during testing

#### 3. Market Metrics Endpoint
- **URL**: `POST https://polymarketanalytics.com/api/market-metrics`
- **Method**: POST
- **Note**: Also returned 500 errors during testing

### Site Structure
- **Markets Page**: `/markets` - Lists all prediction markets
- **Activity Page**: `/activity` - Shows trades, positions, and deposits/withdrawals
  - Has tabs for: Trades, Positions, Deposits/Withdrawals (Beta)
- **Traders Page**: `/traders`
- **Creators Page**: `/creators`

### External APIs Used
The site also calls:
- `https://data-api.polymarket.com/positions` - Polymarket's official API
- `https://gamma-api.polymarket.com/events` - Polymarket's gamma API
- `https://proxy.bm-store.org` - Proxy service for Polymarket data

## Next Steps Required

To fully understand their API:

1. **Capture Working Request**: Need to intercept a successful API call with actual parameters
2. **Find Market ID Format**: Determine how they identify specific markets
3. **Parameter Structure**: Understand what parameters `/api/activity-trades` expects:
   - Market ID/slug?
   - Pagination parameters (offset, limit)?
   - Time range filters?
   - Sort options?

4. **Response Structure**: Need to see a successful response to understand:
   - Trade data format
   - Pagination metadata
   - Available fields per trade

## Technical Observations

- Site uses Server-Side Rendering (SSR) with Next.js
- API routes are server-side Next.js API routes
- Protected by rate limiting (120 requests per time window)
- Responses include Vercel-specific headers
- Uses RSC (React Server Components) architecture

## Recommended Approach

Since the site's API is currently returning errors, we should:

1. Navigate directly to Polymarket's official site
2. Intercept their API calls to understand the source data structure
3. Use Polymarket's official API endpoints instead:
   - `https://data-api.polymarket.com`
   - `https://gamma-api.polymarket.com`

This will give us the actual trade data source that polymarketanalytics.com is using.

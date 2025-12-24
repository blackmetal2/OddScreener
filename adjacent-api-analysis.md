# Adjacent News API - Unauthenticated Access Analysis

**Analysis Date:** December 24, 2025
**Base URL:** `https://api.data.adj.news`
**Documentation:** https://docs.adj.news

## Executive Summary

The Adjacent News API provides extensive prediction market data from multiple platforms (Kalshi, Polymarket, Metaculus) with significant capabilities available WITHOUT authentication. The API offers real-time market data with a generous free tier suitable for building market screening and analysis tools.

---

## 1. AUTHENTICATION STATUS

### What Works WITHOUT Authentication:

1. **Market Data (Recent)** - Full access to markets from the last 24 hours
2. **Individual Market Details** - Complete details for any market by ID
3. **Related Markets** - Discover conceptually similar markets
4. **Pagination** - Full pagination support up to 100 results per query

### What REQUIRES Authentication:

1. **Historical Data** - Markets older than 1 day
2. **Large Datasets** - More than 100 results per request
3. **Search API** - Semantic search functionality
4. **News API** - News articles related to markets
5. **Trade Data** - Trading activity and price history
6. **Analytics Endpoints** - All analytics features
7. **Indices API** - Index creation and management

---

## 2. AVAILABLE ENDPOINTS (Without Auth)

### 2.1 GET /api/markets

**Purpose:** List prediction markets with filtering, sorting, and pagination

**Query Parameters Tested:**
- `limit` (integer, max 100) - Number of results to return
- `offset` (integer) - Pagination offset
- `status` (string) - Filter by status (e.g., "active")
- `sort` (string) - Sort results (tested: "volume")

**Response Structure:**
```json
{
  "data": [
    {
      "market_id": "KXTX34R-26-BMOR",
      "platform_id": "KXTX34R-26-BMOR",
      "ticker": "KXTX34R-26-BMOR",
      "adj_ticker": "adj_kalshi_kxtx34r_26_bmor",
      "market_slug": "KXTX34R-26-BMOR",
      "platform": "kalshi",
      "market_type": "binary",
      "question": "Will Bam Morales be the Republican nominee for TX-34?",
      "description": "Will Bam Morales be the Republican nominee for TX-34?",
      "rules": "If Bam Morales wins the nomination...",
      "result": null,
      "link": "https://kalshi.com/markets/KXTX34R",
      "status": "active",
      "reported_date": "2025-12-23T15:02:37.333Z",
      "created_at": "2025-12-23T15:00:00Z",
      "updated_at": "2025-12-24T11:15:30.864Z",
      "end_date": "2027-11-03T15:00:00Z",
      "resolution_date": "2027-11-03T15:00:00Z",
      "probability": 0,
      "volume": 0,
      "open_interest": 0,
      "liquidity": 0.8,
      "category": null,
      "tags": [],
      "platform_ids": {
        "event_ticker": "KXTX34R-26"
      },
      "status_details": {
        "is_active": true,
        "is_resolved": false,
        "accepting_orders": true,
        "tradeable": true
      },
      "settlement_sources": [],
      "comments_count": 0,
      "has_comments": 0,
      "trades_count": 0,
      "event": "KXTX34R-26"
    }
  ],
  "meta": {
    "count": 4085317,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

**Key Data Fields:**
- **Market Identifiers:** `market_id`, `platform_id`, `ticker`, `adj_ticker`, `market_slug`
- **Platform Info:** `platform` (kalshi, polymarket, metaculus)
- **Market Details:** `question`, `description`, `rules`, `market_type`
- **Status:** `status`, `is_active`, `is_resolved`, `accepting_orders`, `tradeable`
- **Dates:** `created_at`, `updated_at`, `end_date`, `resolution_date`, `reported_date`
- **Market Metrics:**
  - `probability` (0-100 scale)
  - `volume` (total trading volume)
  - `open_interest` (current open positions)
  - `liquidity` (0-1 scale)
- **Engagement:** `comments_count`, `has_comments`, `trades_count`
- **Links:** `link` (direct link to platform)
- **Grouping:** `event` (groups related markets together)
- **Categorization:** `category`, `tags`

**Metadata Fields:**
- `count` - Total number of markets in database (4,085,317+ as of test)
- `limit` - Results returned in this response
- `offset` - Pagination offset used
- `hasMore` - Boolean indicating more results available

---

### 2.2 GET /api/markets/{market_id}

**Purpose:** Retrieve detailed information about a specific market

**URL Pattern:** `/api/markets/KXTX34R-26-BMOR`

**Response Structure:** Single market object (same structure as array item above)

**Use Cases:**
- Get real-time updates for specific markets
- Fetch complete market details including rules
- Monitor market status changes

---

### 2.3 GET /api/markets/{market_id}/related

**Purpose:** Find markets conceptually related to a given market

**URL Pattern:** `/api/markets/KXTX34R-26-BMOR/related`

**Response Structure:**
```json
{
  "data": []
}
```

**Note:** Returns empty array for markets without identified related markets. This suggests AI-powered relationship detection that may require more context/data.

---

## 3. RATE LIMITS & RESTRICTIONS

### Unauthenticated Tier:
- **Rate Limit:** 300 requests per minute
- **Results per Request:** Maximum 100 markets
- **Data Recency:** Markets from last 24 hours only
- **Total Database Size:** 4+ million markets

### Error Response (When Limits Exceeded):
```json
{
  "error": "Free API queries are limited to markets 1d old and/or 100 markets per query. Consider upgrading your plan reach out to lucas@adj.news"
}
```

### Authenticated Tier Benefits:
- **Rate Limit:** 1,000 requests per minute
- **Results per Request:** No limit
- **Data Access:** Full historical data
- **Additional Features:** Search, news, trade data, analytics

---

## 4. MULTI-PLATFORM COVERAGE

### Supported Platforms:
1. **Kalshi** - Regulated prediction market exchange
2. **Polymarket** - Crypto-based prediction markets
3. **Metaculus** - Forecasting tournament platform

### Platform Identification:
- Each market has a `platform` field
- Platform-specific IDs in `platform_id` and `platform_ids` object
- Direct links to original platform in `link` field

---

## 5. CONNECTION TO NEWS & PREDICTION MARKETS

### How the API Bridges News and Markets:

**From Documentation:**
- Integrates 5,000+ news sources
- 50,000+ daily article additions
- Excludes prediction platforms to prevent circular references
- Provides semantic connection between events and markets

**Accessible Without Auth:**
- Market questions and descriptions (show what events are being predicted)
- Settlement sources (show official sources for resolution)
- Related markets (conceptual connections between predictions)

**Requires Auth:**
- `/api/news/{market}` - Actual news articles related to markets
- Semantic search to find markets based on news topics

---

## 6. DATA FRESHNESS & UPDATES

### Update Frequency:
- `updated_at` timestamps show real-time updates
- Markets tested showed updates within hours
- Probability, volume, and liquidity update in real-time

### Example Timestamps:
```
created_at: "2025-12-23T15:00:00Z"
updated_at: "2025-12-24T11:15:30.864Z"
reported_date: "2025-12-23T15:02:37.333Z"
```

---

## 7. PRACTICAL USE CASES (Without Auth)

### What You CAN Build:

1. **Market Screener**
   - Filter active markets by platform
   - Sort by liquidity, volume, probability
   - Monitor new market creation (last 24h)
   - Track market status changes

2. **Real-Time Dashboard**
   - Display current probabilities
   - Show trending markets (high volume)
   - Monitor market activity metrics
   - Track tradeable vs non-tradeable status

3. **Market Comparison Tool**
   - Compare similar markets across platforms
   - Analyze probability differences
   - Identify arbitrage opportunities (same event, different platforms)

4. **Event Tracker**
   - Group markets by event (using `event` field)
   - Track multi-outcome predictions
   - Monitor resolution dates

5. **Alert System**
   - Trigger alerts on probability changes
   - Notify when markets become active/tradeable
   - Track approaching resolution dates

### What You CANNOT Build (Without Auth):

1. Historical trend analysis (requires old data)
2. News-driven market discovery (requires news API)
3. Trading pattern analysis (requires trade data)
4. Deep search functionality (requires search API)
5. Large-scale data downloads (100 result limit)

---

## 8. FILTERING & SEARCH CAPABILITIES

### Available Filters (Tested):
- `status` - Filter by market status (active, resolved, etc.)
- `limit` - Control result count (max 100)
- `offset` - Pagination support
- `sort` - Sort results (volume tested, likely others available)

### Likely Available Filters (Based on Data Structure):
- `platform` - Filter by kalshi, polymarket, metaculus
- `market_type` - Filter by binary, multiple-choice, etc.
- Date range filters (created_at, end_date, etc.)
- Minimum volume/liquidity thresholds

**Note:** Advanced filtering requires more testing. Some filters may trigger the "1d old" restriction.

---

## 9. RESPONSE FORMAT & ERROR HANDLING

### Standard Response Format:
```json
{
  "data": <array or object>,
  "meta": <pagination and count info>
}
```

### Error Response Format:
```json
{
  "error": "<error message>"
}
```

### HTTP Status Codes (From Documentation):
- **200:** Success
- **400:** Bad Request
- **401:** Unauthorized/invalid API key
- **403:** Insufficient permissions
- **404:** Resource not found
- **429:** Rate limited
- **500:** Server error

---

## 10. MARKET DATA STRUCTURE DEEP DIVE

### Status Details Object:
```json
"status_details": {
  "is_active": true,
  "is_resolved": false,
  "accepting_orders": true,
  "tradeable": true
}
```

**Use Cases:**
- `is_active` - Market is currently open
- `is_resolved` - Market has settled
- `accepting_orders` - Can place new trades
- `tradeable` - Available for trading

### Platform IDs Object:
```json
"platform_ids": {
  "event_ticker": "KXTX34R-26"
}
```

**Purpose:** Maps to platform-specific identifiers for deep linking and grouping

### Probability Scale:
- Range: 0-100 (integer percentage)
- Example: `"probability": 43` = 43% chance
- Updates in real-time as trades occur

### Volume & Liquidity:
- `volume` - Total contracts/shares traded (integer)
- `open_interest` - Currently held positions (integer)
- `liquidity` - 0-1 scale indicating market depth

---

## 11. PAGINATION STRATEGY

### Optimal Pagination Pattern:
```
Request 1: /api/markets?limit=100&offset=0
Request 2: /api/markets?limit=100&offset=100
Request 3: /api/markets?limit=100&offset=200
...continue until hasMore = false
```

### Meta Information:
```json
"meta": {
  "count": 4085317,     // Total markets in database
  "limit": 100,          // Results in this response
  "offset": 0,           // Starting position
  "hasMore": true        // More results available
}
```

### Rate Limit Considerations:
- 300 requests/minute = 30,000 markets/minute max
- Can retrieve 1.8 million markets per hour
- Limited to last 24 hours of data

---

## 12. SDK & INTEGRATION OPTIONS

### MCP Integration:
```bash
npx @mintlify/mcp@latest add adjacent
```

**MCP (Model Context Protocol):** Allows AI models to directly interact with the API

### Direct HTTP Integration:
- RESTful API - works with any HTTP client
- JSON responses - standard parsing
- No authentication headers needed for free tier

---

## 13. LIMITATIONS & WORKAROUNDS

### Limitation: No Historical Data
**Workaround:** Build your own database by polling every 24 hours and storing snapshots

### Limitation: 100 Result Maximum
**Workaround:** Use pagination to retrieve data in chunks (respecting rate limits)

### Limitation: No News Without Auth
**Workaround:** Use market questions/descriptions + external news APIs to correlate events

### Limitation: No Semantic Search
**Workaround:** Implement client-side text search on question/description fields

### Limitation: Advanced Filters May Require Auth
**Workaround:** Fetch large datasets and filter client-side (within 100 result limit)

---

## 14. COMPARISON: FREE vs PAID FEATURES

| Feature | Free (Unauthenticated) | Paid (Authenticated) |
|---------|------------------------|----------------------|
| Market Data (Recent) | Last 24 hours | Full history |
| Results per Query | 100 max | Unlimited |
| Rate Limit | 300/min | 1,000/min |
| Market Details | Full access | Full access |
| Related Markets | Available | Available |
| Search API | Not available | Available |
| News API | Not available | Available |
| Trade Data | Not available | Available |
| Analytics | Not available | Available |
| Indices | Not available | Available |

---

## 15. MARKET CATEGORIES & TYPES

### Market Types Observed:
- `"market_type": "binary"` - Yes/No predictions

### Likely Additional Types:
- Multiple-choice (categorical outcomes)
- Scalar (numerical predictions)
- Conditional markets

### Categories:
- Field exists but often null in test data
- Likely populated for major market segments
- May require authentication for filtered access

---

## 16. SETTLEMENT & RESOLUTION

### Settlement Sources:
```json
"settlement_sources": []
```

**Purpose:** Links to authoritative sources used for market resolution

**Use Cases:**
- Verify market credibility
- Understand resolution criteria
- Track settlement timing

### Resolution Process:
- Markets have `resolution_date` (when they should resolve)
- `result` field contains outcome (null until resolved)
- `is_resolved` status flag indicates settled markets

---

## 17. REAL-WORLD DATA EXAMPLES

### High-Volume Market Example:
```json
{
  "question": "Will Cory Booker be the Democratic Presidential nominee in 2028?",
  "platform": "kalshi",
  "probability": 2,
  "volume": 1305473,
  "open_interest": 718135,
  "liquidity": 0.5
}
```

### Low-Volume Market Example:
```json
{
  "question": "Will Bam Morales be the Republican nominee for TX-34?",
  "platform": "kalshi",
  "probability": 0,
  "volume": 0,
  "open_interest": 0,
  "liquidity": 0.8
}
```

---

## 18. RECOMMENDED IMPLEMENTATION STRATEGY

### For a Market Screener Tool:

1. **Initial Load:**
   - Fetch first 100 markets: `GET /api/markets?limit=100`
   - Display in table format with key metrics

2. **Filtering:**
   - Apply client-side filters for immediate response
   - Use API filters where available (status, platform)

3. **Sorting:**
   - Test server-side sorting for optimal performance
   - Fallback to client-side sorting if needed

4. **Real-Time Updates:**
   - Poll every 30-60 seconds for active markets
   - Update probability, volume, liquidity fields

5. **Detail View:**
   - Fetch individual market: `GET /api/markets/{market_id}`
   - Display full rules, description, status

6. **Related Markets:**
   - Show conceptually similar markets
   - Build market relationship graphs

### For Historical Analysis:

1. **Build Local Database:**
   - Schedule daily snapshots (within 24h window)
   - Store in local database (SQLite, PostgreSQL)
   - Track probability changes over time

2. **Data Collection:**
   - Run automated job every 12 hours
   - Retrieve all new markets (last 24h)
   - Update existing market probabilities

3. **Analysis:**
   - Query local database for trends
   - Calculate probability volatility
   - Identify prediction accuracy

---

## 19. ERROR HANDLING RECOMMENDATIONS

### Common Errors to Handle:

1. **Rate Limit (429):**
   - Implement exponential backoff
   - Track request count locally
   - Queue requests to stay under 300/min

2. **1-Day Restriction:**
   - Monitor for specific error message
   - Adjust queries to recent data only
   - Consider upgrading to paid tier

3. **Result Limit (100):**
   - Implement pagination automatically
   - Track `hasMore` flag
   - Build complete datasets iteratively

4. **Market Not Found (404):**
   - Cache market IDs locally
   - Validate before requesting
   - Handle gracefully in UI

---

## 20. CONTACT & UPGRADE INFORMATION

**API Support:** lucas@adj.news

**Related Services:**
- Trading interface: trade.adj.news
- News platform: adj.news
- Status monitoring: status.adj.news

**Upgrade Benefits:**
- Historical data access
- News article integration
- Semantic search capabilities
- Higher rate limits
- Larger result sets
- Trade data access

---

## 21. CONCLUSION & RECOMMENDATIONS

### What Makes This API Valuable (Without Auth):

1. **Real-Time Market Data** - Up-to-date probabilities and metrics
2. **Multi-Platform Coverage** - Aggregate view across Kalshi, Polymarket, Metaculus
3. **Generous Free Tier** - 300 req/min, 100 results is substantial for many use cases
4. **Rich Data Structure** - Comprehensive market details including status, rules, metrics
5. **Direct Platform Links** - Easy integration with source platforms
6. **Event Grouping** - Logical clustering of related predictions

### Best Use Cases for Free Tier:

1. **Market Discovery Dashboard** - Browse and filter recent markets
2. **Real-Time Probability Tracker** - Monitor active markets
3. **Cross-Platform Comparison** - Find similar markets across platforms
4. **New Market Alerts** - Notify on newly created prediction markets
5. **Market Status Monitor** - Track active/tradeable state changes

### When to Upgrade:

- Need historical trend analysis
- Want news article integration
- Require semantic search capabilities
- Need to analyze >100 markets per query
- Building production trading tools
- Require trade-level data

### Overall Assessment:

The Adjacent News API provides **exceptional value** for building prediction market tools even without authentication. The 24-hour data window, combined with real-time updates and comprehensive market details, enables sophisticated market screening and monitoring applications. The main limitation is lack of historical data, which can be partially addressed through regular polling and local storage.

For a prediction market screener focused on current opportunities, the free tier is **highly suitable** and provides professional-grade data access.

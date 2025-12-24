# API Research Report: Kalshi & Polymarket

**Generated:** December 23, 2025
**Purpose:** Comprehensive documentation of Kalshi and Polymarket API capabilities, endpoints, and integration opportunities

---

## Table of Contents

1. [Kalshi API](#kalshi-api)
2. [Polymarket API](#polymarket-api)
3. [Comparison & Integration Recommendations](#comparison--integration-recommendations)
4. [Missing Features & Opportunities](#missing-features--opportunities)

---

## Kalshi API

### Official Documentation
- **Primary Docs:** [https://docs.kalshi.com/welcome](https://docs.kalshi.com/welcome)
- **API Reference:** [https://trading-api.readme.io/reference/getting-started](https://trading-api.readme.io/reference/getting-started)
- **Help Center:** [https://help.kalshi.com/kalshi-api](https://help.kalshi.com/kalshi-api)
- **OpenAPI Spec:** Available for download
- **Developer Support:** Discord #dev channel

### Base URLs

**Production:**
- REST: `https://api.elections.kalshi.com/trade-api/v2/`
- WebSocket: `wss://api.elections.kalshi.com/trade-api/ws/v2`

**Demo/Testing:**
- REST: `https://demo-api.kalshi.co/trade-api/v2/`
- WebSocket: `wss://demo-api.kalshi.co/trade-api/ws/v2`

**Important Note:** The `api.elections.kalshi.com` domain serves ALL Kalshi markets, not just elections (includes economics, climate, tech, entertainment, etc.)

### Authentication

**Required Headers:**
```http
KALSHI-ACCESS-KEY: your_api_key_id
KALSHI-ACCESS-SIGNATURE: signed_request_hash
KALSHI-ACCESS-TIMESTAMP: timestamp_in_milliseconds
```

**Signature Generation:**
- Sign concatenation of: timestamp + HTTP method + path (without query params)
- Uses RSA-PSS signatures
- Example: For request to `/trade-api/v2/portfolio/orders?limit=5`, sign only `/trade-api/v2/portfolio/orders`

**Key Generation:**
1. Go to Settings → API in Kalshi dashboard
2. Generate API key pair (Key ID + Private Key)
3. Private key cannot be retrieved after initial generation - store securely

**Token Expiration:** 30 minutes (requires periodic re-authentication)

### Rate Limits

- Rate limits are documented but exact thresholds not publicly specified
- Different limits for authenticated vs unauthenticated requests
- Cursor-based pagination for large datasets
- Recommend checking documentation for current limits

### REST API Endpoints

#### Exchange Status & Metadata

| Endpoint | Method | Authentication | Description |
|----------|--------|----------------|-------------|
| `/exchange/status` | GET | Optional | Exchange operational status |
| `/exchange/schedule` | GET | Optional | Trading schedule information |
| `/exchange/announcements` | GET | Optional | System-wide announcements |

#### Series & Events

| Endpoint | Method | Authentication | Description |
|----------|--------|----------------|-------------|
| `/series` | GET | Optional | Browse series templates by category |
| `/series/{series_ticker}` | GET | Optional | Get specific series details |
| `/events` | GET | Optional | List events (filter: open/closed/settled) |
| `/events/{event_ticker}` | GET | Optional | Get specific event details |
| `/events/multivariate` | GET | Optional | Get multivariate event collections |

**Series Structure:** Template for recurring events (e.g., "Monthly Jobs Report")
**Event Structure:** Real-world occurrence with one or more markets
**Hierarchy:** Series → Events → Markets

#### Markets

| Endpoint | Method | Authentication | Description |
|----------|--------|----------------|-------------|
| `/markets` | GET | Optional | List markets with status filtering |
| `/markets/{ticker}` | GET | Optional | Specific market details |
| `/markets/{ticker}/orderbook` | GET | Optional | Current order book (bids only) |
| `/markets/trades` | GET | Optional | All trades across all markets |
| `/series/{series_ticker}/markets/{ticker}/candlesticks` | GET | Optional | OHLC candlestick data |
| `/markets/candlesticks` | GET | Optional | Bulk candlesticks (up to 10k total) |

**Trade Endpoint Parameters:**
```http
GET /markets/trades
  ?limit=100          # 1-1000, default 100
  &cursor=string      # Pagination cursor
  &ticker=string      # Filter by market
  &min_ts=integer     # Unix timestamp filter
  &max_ts=integer     # Unix timestamp filter
```

**Trade Response:**
```json
{
  "trades": [{
    "trade_id": "string",
    "ticker": "string",
    "price": 65,
    "count": 100,
    "yes_price": 65,
    "no_price": 35,
    "yes_price_dollars": "0.65",
    "no_price_dollars": "0.35",
    "taker_side": "yes",
    "created_time": "2025-01-15T10:30:00Z"
  }],
  "cursor": "string"
}
```

**Candlesticks Endpoint:**
```http
GET /series/{series_ticker}/markets/{ticker}/candlesticks
  ?start_ts=1234567890    # Required: Unix timestamp
  &end_ts=1234567890      # Required: Unix timestamp
  &period_interval=60     # Required: 1, 60, or 1440 (minutes)
```

**Candlestick Response:**
```json
{
  "ticker": "MARKET-TICKER",
  "candlesticks": [{
    "end_period_ts": 123,
    "yes_bid": {
      "open": 123,
      "close": 123,
      "high": 123,
      "low": 123,
      "open_dollars": "0.5600"
    },
    "yes_ask": { "..." },
    "price": {
      "open": 123,
      "close": 123,
      "high": 123,
      "low": 123,
      "mean": 123,
      "previous": 123
    },
    "volume": 123,
    "open_interest": 123
  }]
}
```

**Important Notes:**
- Order book returns bids only (no asks) because in binary markets, a bid for yes at price X = ask for no at price (100-X)
- Prices in cents (divide by 100 for dollar amounts)
- Candlestick intervals: 1m, 1h, 1d only

#### Trading (Portfolio)

| Endpoint | Method | Authentication | Description |
|----------|--------|----------------|-------------|
| `/portfolio/orders` | POST | Required | Submit single order |
| `/portfolio/orders` | GET | Required | List orders by status |
| `/portfolio/orders/{order_id}` | GET | Required | Get specific order |
| `/portfolio/orders/{order_id}` | DELETE | Required | Cancel specific order |
| `/portfolio/orders/batched` | POST | Required | Batch submit (max 20 orders) |
| `/portfolio/orders/batched` | DELETE | Required | Batch cancel orders |
| `/portfolio/balance` | GET | Required | Account balance & portfolio value |
| `/portfolio/positions` | GET | Required | Current position holdings |
| `/portfolio/fills` | GET | Required | Trade execution history |
| `/portfolio/settlements` | GET | Required | Settlement records with P&L |

**Balance Response:**
```json
{
  "balance": 1000000,          // Available balance in cents
  "portfolio_value": 1250000   // Total value (balance + positions) in cents
}
```

**Settlements Response:**
```json
{
  "settlements": [{
    "ticker": "MARKET-TICKER",
    "market_result": "yes",
    "yes_count": 100,
    "no_count": 0,
    "yes_total_cost": 6500,
    "no_total_cost": 0,
    "revenue": 10000,
    "settled_time": "2025-01-15T12:00:00Z",
    "value": 10000
  }]
}
```

**Order Limits:**
- Maximum 200,000 open orders
- Batch operations: 20 orders max per request

#### API Keys Management

| Endpoint | Method | Authentication | Description |
|----------|--------|----------------|-------------|
| `/api_keys` | POST | Required | Create new API key pair |
| `/api_keys` | GET | Required | List API keys |
| `/api_keys/{key_id}` | DELETE | Required | Delete specific API key |

### WebSocket API

**Connection:** Single persistent WebSocket with subscription model

**Keep-Alive:** Server sends Ping frames every 10 seconds with body `heartbeat`

**Available Channels:**

| Channel | Auth Required | Market Spec | Description |
|---------|---------------|-------------|-------------|
| `ticker` | Optional | Optional | Market price, volume, open interest updates |
| `orderbook_delta` | Optional | Required | Incremental orderbook updates with initial snapshot |
| `trades` | Optional | Optional | Public trade notifications |
| `fill` | **Required** | N/A | Personal order fill notifications |
| `market_positions` | **Required** | Optional | Position updates (in centi-cents, divide by 10k) |
| `market_lifecycle_v2` | Optional | Optional | Market state changes & settlements |
| `multivariate` | Optional | Optional | Multivariate collection updates |
| `communications` | **Required** | N/A | RFQ and quote notifications |

**Subscription Message:**
```json
{
  "id": 1,
  "cmd": "subscribe",
  "params": {
    "channels": ["ticker", "orderbook_delta"],
    "market_ticker": "MARKET-TICKER"
    // OR "market_tickers": ["TICKER1", "TICKER2"]
  }
}
```

**List Subscriptions:**
```json
{
  "id": 2,
  "cmd": "list_subscriptions"
}
```

**Message Types:**
- `subscribed` - Subscription confirmation
- `orderbook_snapshot` - Initial full orderbook state
- `orderbook_delta` - Incremental updates (includes optional `client_order_id` for your orders)
- `ticker` - Price/volume/OI updates
- `trade` - Public trade executed
- `fill` - Your order filled
- `error` - Error with code and message

**Error Codes:** 17 defined codes including auth errors, invalid params, market not found

**Important Notes:**
- Repeated subscriptions add new tickers to existing subscriptions (no error)
- Python `websockets` library handles ping/pong automatically
- Position values in `market_positions` are in centi-cents (divide by 10,000 for dollars)

### Recent API Updates (November 2025)

**New Features:**
- `POST /portfolio/orders/batched` now generally available (no longer requires Advanced API access)
- `GET /markets/candlesticks` - bulk candlestick retrieval (up to 10k total)
- Subpenny fields: `yes_bid_dollars`, `no_bid_dollars` on quote API

**Breaking Changes:**
- `GET /markets` - timestamp filters now mutually exclusive for performance
- `GET /portfolio/positions` - removed `resting_orders_count` field
- `resting_order_count` filter no longer supported (returns 400 error)

### Client SDKs

**Official:**
- **Python:** `kalshi-python` (v2.1.4, Sep 2025) - [PyPI](https://pypi.org/project/kalshi-python/)
- **TypeScript:** Available on npm

**Third-Party:**
- **Rust:** Full SDK with 50+ endpoints (Dec 2025)
- **Go:** [github.com/ammario/kalshi](https://github.com/ammario/kalshi)
- **C++:** High-performance market data feed for algorithmic trading

### Data Formats

- **Monetary Values (Portfolio):** Cents (divide by 100 for dollars)
- **Monetary Values (WebSocket positions):** Centi-cents (divide by 10,000 for dollars)
- **Timestamps:** Unix timestamps in milliseconds
- **Candlestick Intervals:** 1, 60, or 1440 minutes only

---

## Polymarket API

### Official Documentation
- **Primary Docs:** [https://docs.polymarket.com/](https://docs.polymarket.com/)
- **Gamma API Docs:** [https://docs.polymarket.com/developers/gamma-markets-api/gamma-structure](https://docs.polymarket.com/developers/gamma-markets-api/gamma-structure)
- **CLOB Docs:** [https://docs.polymarket.com/developers/CLOB/introduction](https://docs.polymarket.com/developers/CLOB/introduction)

### API Architecture Overview

Polymarket uses **three separate API systems:**

1. **Gamma API** - Market data & metadata (public, read-only)
2. **CLOB API** - Central Limit Order Book (trading, orderbooks, prices)
3. **Data API** - User analytics, positions, leaderboards

### 1. Gamma API (Market Data)

**Base URL:** `https://gamma-api.polymarket.com`

**Authentication:** Not required (public data)

**Rate Limits:** Same for all users (no priority tiers)

#### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/events` | GET | List events with filtering |
| `/events/slug/{slug}` | GET | Get event by slug |
| `/markets` | GET | List markets with filtering |
| `/markets/slug/{slug}` | GET | Get market by slug |
| `/tags` | GET | List available tags/categories |
| `/sports` | GET | Sports metadata, resolution sources |
| `/tags/{id}/related-tags` | GET | Related tags by ID |
| `/tags/slug/{slug}/related-tags` | GET | Related tags by slug |
| `/series` | GET | List series (similar to Kalshi) |
| `/series/{id}` | GET | Get specific series |

#### Events Endpoint Query Parameters

```http
GET /events
  ?limit=50                  # Results per page (default: 50)
  &offset=0                  # Pagination offset
  &order=id                  # Sort field
  &ascending=false           # Sort direction
  &closed=false              # Filter closed markets
  &active=true               # Filter active markets
  &archived=false            # Include archived
  &liquidity_min=1000        # Min liquidity filter
  &liquidity_max=100000      # Max liquidity filter
  &volume_min=500            # Min volume filter
  &volume_max=50000          # Max volume filter
  &start_date_min=2025-01-01 # Event start date range
  &start_date_max=2025-12-31
  &end_date_min=2025-01-01   # Event end date range
  &end_date_max=2025-12-31
  &tag=politics              # Filter by tag name
  &tag_id=100381             # Filter by tag ID
  &related_tags=true         # Include related tag markets
  &tag_slug=sports           # Filter by tag slug
```

**Example Requests:**
```bash
# Get newest active events
GET https://gamma-api.polymarket.com/events?order=id&ascending=false&closed=false&limit=100

# Get politics markets (page 1)
GET https://gamma-api.polymarket.com/markets?tag_id=100381&closed=false&limit=25&offset=0

# Get politics markets (page 2)
GET https://gamma-api.polymarket.com/markets?tag_id=100381&closed=false&limit=25&offset=25

# Get specific event by slug
GET https://gamma-api.polymarket.com/events/slug/fed-decision-in-october
```

#### Markets Endpoint Query Parameters

Same as events endpoint, plus:
```http
  ?exclude_tag_id=100        # Omit specific tags
```

#### Sports Endpoint

Returns comprehensive sports metadata:
- Tag IDs for each sport
- Sport images/icons
- Resolution sources
- Ordering preferences
- Series information

#### Best Practices

**Three Market Fetching Strategies:**
1. **By Slug** - When you know the exact market/event slug (fastest)
2. **By Tags** - Filter by category/sport (most organized)
3. **Via Events** - Retrieve all active markets (most comprehensive)

**Always include:**
- `closed=false` unless you need historical data
- Pagination parameters for large datasets
- `order=id&ascending=false` for newest-first results

#### Gamma API Special Fields

- `negRisk` (boolean) - Indicates negative risk events
- Related tags functionality for market discovery
- Sports-specific metadata and resolution sources

### 2. CLOB API (Central Limit Order Book)

**Base URL:** `https://clob.polymarket.com`

**Chain ID:** 137 (Polygon mainnet)

**Architecture:** Hybrid-decentralized (off-chain matching, on-chain settlement)

#### Authentication Levels

**Public Methods** - No authentication required:
- Market data
- Order books
- Prices
- Midpoints

**L1 Methods** - Private key authentication:
- Create/derive API keys (L2 credentials)
- Wallet signature operations
- Uses EIP-712 message signing

**L2 Methods** - API key authentication:
- Place/manage orders
- Query user positions
- Requires: `apiKey`, `secret`, `passphrase`
- Still requires wallet signature for order placement

**Builder Methods** - Builder API credentials:
- Order attribution for builder program
- Special credentials for platform builders

#### Creating API Credentials (L1 → L2)

```python
# L1 Client (wallet-based)
from py_clob_client.client import ClobClient

l1_client = ClobClient(
    "https://clob.polymarket.com",
    chain_id=137,
    key=private_key  # Your wallet private key
)

# Create L2 credentials
api_creds = l1_client.create_or_derive_api_creds()
# Returns: {apiKey, secret, passphrase}

# L2 Client (API key-based)
l2_client = ClobClient(
    "https://clob.polymarket.com",
    chain_id=137,
    key=private_key,
    creds=api_creds
)
```

**Important Notes:**
- Each wallet can only have ONE active API key at a time
- Creating new key invalidates previous one
- L2 methods still require wallet signer for order creation

#### Public Endpoints (No Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/book` | GET | Single order book summary |
| `/books` | GET/POST | Multiple order books |
| `/price` | GET | Token price (BUY/SELL side) |
| `/prices` | GET/POST | Multiple token prices |
| `/midpoint` | GET | Single midpoint price |
| `/midpoints` | POST | Multiple midpoint prices |
| `/prices-history` | GET | Historical price data |
| `/markets` | GET | List all markets |
| `/trades` | GET | Historical trades |
| `/last-trade-price` | GET | Most recent trade price |

**Midpoint Endpoint:**
```bash
# Single token
GET https://clob.polymarket.com/midpoint?token_id={token_id}

# Multiple tokens
POST https://clob.polymarket.com/midpoints
Body: {
  "token_ids": ["token1", "token2", "token3"]
}
```

**Response Format:**
```json
{
  "tokenId": "0x123...",
  "midpoint": "0.6532",
  "formattedPrice": "0.6532",
  "percentagePrice": "65.32%",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Price History Endpoint:**
```http
GET /prices-history
  ?token_id=0x123...
  &interval=1h           # Time interval (mutually exclusive with startTs/endTs)
  &startTs=1234567890    # Unix timestamp (mutually exclusive with interval)
  &endTs=1234567890      # Unix timestamp
```

**Order Book Response:**
```json
{
  "market": "0x123...",
  "asset_id": "0x456...",
  "bids": [
    {
      "price": "0.65",
      "size": "100"
    }
  ],
  "asks": [
    {
      "price": "0.67",
      "size": "150"
    }
  ]
}
```

#### Trading Endpoints (L2 Auth Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/orders` | POST | Create single order |
| `/orders` | GET | Get user orders |
| `/orders/{order_id}` | GET | Get specific order |
| `/orders/{order_id}` | DELETE | Cancel order |
| `/orders/batch` | POST | Batch create orders |
| `/orders/batch` | DELETE | Batch cancel orders |

**Creating an Order:**

```typescript
// TypeScript example
const order = await client.createAndPostOrder(
  {
    tokenID: "0x123...",
    price: 0.65,      // Price between 0 and 1
    size: 100,        // Number of shares
    side: "BUY"       // or "SELL"
  },
  {
    tickSize: "0.01",
    negRisk: false
  }
);
```

```python
# Python example
from py_clob_client.order_builder.constants import BUY

order_args = {
    "token_id": "0x123...",
    "price": 0.65,
    "size": 100,
    "side": BUY
}

signed_order = client.create_order(order_args)
resp = client.post_order(signed_order, OrderType.GTC)
```

**Order Requirements:**
- All orders are limit orders (marketable limit orders enable "market" behavior)
- Must set allowances for maker asset (USDC for buying, conditional token for selling)
- Funder address must have sufficient balance
- Order signature required even with L2 auth

**Signature Types:**
- Type 1: Polymarket Proxy (Magic Link email login)
- Type 2: Polymarket Proxy (Browser wallet: MetaMask, Coinbase, etc.)
- No type specified: Direct EOA trading

#### Adjusted Midpoint (For Rewards)

Size-cutoff adjusted midpoint calculation:
```
(best_bid_min_shares_adjusted + best_ask_min_shares_adjusted) / 2
```
Accounts for cumulative order size at/better than price levels.

#### WebSocket (CLOB)

**Endpoint:** Not explicitly documented in search results, but mentioned as available

**Channels:**
- **USER Channel** - Personal order/position updates
- **MARKET Channel** - Market-specific updates

**Subscription Format:**
```json
{
  "auth": {...},              // See WSS Authentication docs
  "markets": ["0x123..."],    // Condition IDs (for USER channel)
  "assets_ids": ["0x456..."], // Token IDs (for MARKET channel)
  "type": "USER"              // or "MARKET"
}
```

**Dynamic Subscription Updates:**
```json
{
  "assets_ids": ["0x789..."],
  "operation": "subscribe"    // or "unsubscribe"
}
```

### 3. Data API (User Analytics)

**Base URL:** `https://data-api.polymarket.com`

**Authentication:** Not required for most endpoints (public data)

**Rate Limits:** Same for all users

#### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/positions` | GET | User positions with P&L |
| `/activity` | GET | User trade/activity history |
| `/trades` | GET | All trades (user or market filter) |
| `/holders` | GET | Top holders for markets |
| `/leaderboard` | GET | Trader leaderboard rankings |

#### User Positions Endpoint

```http
GET /positions
  ?user=0x123...               # Required: User wallet address
  &market=0x456...             # Optional: Filter by condition ID(s)
  &eventId=123                 # Optional: Filter by event ID(s)
  &sizeThreshold=1             # Min position size (default: 1)
  &redeemable=false            # Filter redeemable positions
  &mergeable=false             # Filter mergeable positions
  &limit=100                   # Results per page (0-500, default: 100)
  &offset=0                    # Pagination offset (0-10000)
  &sortBy=TOKENS               # Sort field (see below)
  &sortDirection=DESC          # ASC or DESC (default: DESC)
  &title=market%20title        # Search by title (max 100 chars)
```

**Sort Options:**
- `TOKENS` - Position size in tokens/"To Win"
- `CURRENT` - Current value
- `INITIAL` - Initial value
- `CASHPNL` - Cash profit/loss
- `PERCENTPNL` - Percent profit/loss
- `TITLE` - Market title
- `RESOLVING` - When market resolves
- `PRICE` - Current price
- `AVGPRICE` - Average price

**Response:**
```json
[
  {
    "proxyWallet": "0x123...",
    "asset": "0x456...",
    "conditionId": "0x789...",
    "size": "100.5",
    "avgPrice": "0.65",
    "initialValue": "65.00",
    "currentValue": "72.00",
    "cashPnl": "7.00",
    "percentPnl": "10.77",
    "totalBought": "150",
    "realizedPnl": "5.00",
    "percentRealizedPnl": "8.33",
    "curPrice": "0.72",
    "redeemable": false,
    "mergeable": false,
    "title": "Will Bitcoin reach $100k?",
    "slug": "bitcoin-100k",
    "icon": "...",
    "eventSlug": "crypto-2025",
    "outcome": "Yes",
    "outcomeIndex": 0,
    "oppositeOutcome": "No",
    "oppositeAsset": "0xabc...",
    "endDate": "2025-12-31T23:59:59Z",
    "negativeRisk": false
  }
]
```

#### Top Holders Endpoint

```http
GET /holders
  ?market=0x123...,0x456...    # Required: Comma-separated condition IDs
  &limit=20                     # Max holders per token (0-20, default: 20)
  &minBalance=1                 # Min balance filter (0-999999, default: 1)
```

**Response:**
```json
[
  {
    "token": "0x123...",
    "holders": [
      {
        "proxyWallet": "0x567...",
        "bio": "Trader bio",
        "asset": "0x123...",
        "pseudonym": "TraderName",
        "amount": 5000,
        "displayUsernamePublic": true,
        "outcomeIndex": 0,
        "name": "Real Name",
        "profileImage": "https://...",
        "profileImageOptimized": "https://..."
      }
    ]
  }
]
```

#### User Activity Endpoint

```http
GET /activity
  ?user=0x123...               # Required: User wallet address
  &market=0x456...             # Optional: Filter by market
  &type=trade                  # Optional: Activity type
  &side=BUY                    # Optional: BUY/SELL
  &startTime=1234567890        # Optional: Unix timestamp
  &endTime=1234567890          # Optional: Unix timestamp
```

Returns trades and activity history for specified wallet.

#### Leaderboard Endpoints

**Trader Leaderboard:**
```http
GET /leaderboard
  ?window=7d                   # Time window: 1d, 7d, 30d, all
  &limit=100                   # Max 100 results
  &type=profit                 # profit or volume
```

**User Rank:**
```http
GET /leaderboard/rank
  ?user=0x123...
  &window=7d
  &type=profit
```

#### Builder Program APIs

**Aggregated Builder Leaderboard:**
```http
GET /builders/leaderboard
  ?period=week                 # Time period
  &offset=0
  &limit=50
```

**Response:**
```json
[
  {
    "rank": 1,
    "builder": "BuilderName",
    "volume": "1000000",
    "activeUsers": 500,
    "verified": true,
    "builderLogo": "https://..."
  }
]
```

**Builder Volume Time-Series:**
```http
GET /builders/{builder_id}/volume
  ?startDate=2025-01-01
  &endDate=2025-01-31
```

### 4. GraphQL API (Subgraphs)

**Platform:** Goldsky + The Graph Network

**Base Endpoints:**

**Orders Subgraph:**
```
https://api.goldsky.com/api/public/project_cl6mb8i9h0003e201j6li0diw/subgraphs/orderbook-subgraph/0.0.1/gn
```

**Positions Subgraph:**
```
https://api.goldsky.com/api/public/project_cl6mb8i9h0003e201j6li0diw/subgraphs/positions-subgraph/0.0.7/gn
```

**Activity Subgraph:**
```
https://api.goldsky.com/api/public/project_cl6mb8i9h0003e201j6li0diw/subgraphs/activity-subgraph/0.0.4/gn
```

**Open Interest Subgraph:**
```
https://api.goldsky.com/api/public/project_cl6mb8i9h0003e201j6li0diw/subgraphs/oi-subgraph/0.0.6/gn
```

**The Graph Network (Combined):**
```
https://gateway.thegraph.com/api/{api-key}/subgraphs/id/Bx1W4S7kDVxs9gC3s2G6DS8kdNBJNVhMviCtin2DiBp
```

**Free Tier:** 100k queries/month

**Features:**
- On-chain trade, volume, user, liquidity, market data
- GraphQL query interface
- Interactive playgrounds available
- Schema available in GitHub: `Polymarket/polymarket-subgraph`

**Available Subgraphs:**
1. **Orders** - Orderbook analytics
2. **Positions** - User positions & P&L
3. **Activity** - Trades & events
4. **Open Interest** - Market OI tracking
5. **PnL** - Profit/loss calculations

### Client Libraries

**Official Python:**
```bash
pip install py-clob-client
```

**Official TypeScript:**
```bash
npm install @polymarket/clob-client
```

**Unified Python (Community):**
```bash
pip install polymarket-apis
```
Features: Clob, Gamma, Data, Web3, WebSockets, GraphQL clients with Pydantic validation

**Rust:**
- `polymarket-rs` - Ergonomic client with strongly typed builders

**Go:**
- Gamma API client
- CLOB support

**Kotlin:**
- CLOB client for JVM applications

### Data Formats

- **Prices:** Decimal 0.00 to 1.00 (multiply by 100 for percentage)
- **Shares:** Whole or fractional units
- **Condition IDs:** 0x-prefixed 64 hex characters
- **Wallet Addresses:** 0x-prefixed 40 hex characters
- **Timestamps:** ISO 8601 or Unix timestamps

---

## Comparison & Integration Recommendations

### Key Differences

| Feature | Kalshi | Polymarket |
|---------|--------|------------|
| **API Architecture** | Single unified REST + WebSocket | Multiple specialized APIs (Gamma/CLOB/Data) |
| **Authentication** | RSA-PSS signatures | L1 (wallet) + L2 (API key) |
| **Token Expiration** | 30 minutes | API keys don't expire (1 per wallet) |
| **Order Book** | Bids only (yes/no symmetry) | Full bid/ask spreads |
| **Blockchain** | Centralized settlement | Polygon chain (on-chain settlement) |
| **WebSocket** | 8 channels, very detailed | USER + MARKET channels |
| **GraphQL** | Not available | 5 subgraphs on Goldsky/Graph |
| **Price Format** | Cents (0-100) | Decimal (0.00-1.00) |
| **Historical Data** | Candlesticks (3 intervals) | Price history (flexible intervals) |
| **Builder Program** | No | Yes (leaderboard + attribution) |
| **Sports Data** | Via series/events | Dedicated `/sports` endpoint |

### Data Availability

**Kalshi Strengths:**
- Structured candlestick data (OHLC)
- Settlement records with P&L automatically tracked
- Multivariate event collections
- FIX protocol support for institutional trading
- Very detailed WebSocket channels (8 types)

**Polymarket Strengths:**
- Top holders data (see whale positions)
- GraphQL for complex queries
- User activity history (all trades/events)
- Builder attribution & leaderboards
- More granular position analytics
- Sports-specific metadata

### Integration Opportunities

#### Currently Missing in Our Integration

**For Kalshi:**
1. **Candlestick data** - We're not fetching OHLC candlesticks
2. **Settlement tracking** - Not showing P&L from settled markets
3. **WebSocket integration** - No real-time ticker/orderbook updates
4. **Batch operations** - Not using batched order endpoints
5. **Series/Events hierarchy** - Not showing series templates
6. **Multivariate events** - Not supporting complex event structures
7. **Portfolio analytics** - Missing fills/settlements data

**For Polymarket:**
1. **Top holders** - Not showing whale positions
2. **User positions API** - Not fetching individual user P&L
3. **Activity history** - No trade history per user
4. **Builder leaderboard** - Missing builder stats
5. **GraphQL queries** - Not using subgraphs for complex data
6. **Sports metadata** - Not using `/sports` endpoint
7. **Price history charts** - Not using `/prices-history`
8. **Adjusted midpoint** - Missing rewards-adjusted pricing
9. **Related tags** - Not using tag relationships for discovery

#### Recommended Additions

**High Priority:**

1. **Price Charts (Both)**
   - Kalshi: Use `/candlesticks` for OHLC charts
   - Polymarket: Use `/prices-history` for line charts
   - Display 1h, 1d timeframes minimum

2. **Top Holders (Polymarket)**
   - Add "Whale Watch" section
   - Show top 10-20 holders per market
   - Display position sizes and profiles

3. **Real-time Updates (Kalshi)**
   - Implement WebSocket for ticker updates
   - Show live price movements
   - Real-time orderbook depth

4. **Historical Performance (Both)**
   - Kalshi: Show settlement P&L
   - Polymarket: Show user position history
   - Track accuracy over time

5. **Market Discovery**
   - Kalshi: Use series templates for grouping
   - Polymarket: Use related tags and sports metadata
   - Better category filtering

**Medium Priority:**

6. **Batch Operations (Kalshi)**
   - Enable multi-market order placement
   - Batch cancel for risk management

7. **Builder Attribution (Polymarket)**
   - If building a trading platform
   - Get credited on builder leaderboard
   - Track referred volume

8. **Advanced Analytics**
   - User leaderboard integration
   - Volume/profit rankings
   - Community trader profiles

9. **GraphQL Integration (Polymarket)**
   - Complex queries for dashboard
   - On-chain data verification
   - Position aggregation

**Low Priority:**

10. **FIX Protocol (Kalshi)** - For institutional clients
11. **Multivariate Events (Kalshi)** - For complex markets
12. **Communications Channel (Kalshi)** - For RFQ/quotes

---

## Missing Features & Opportunities

### Undocumented/Advanced Features Found

**Kalshi:**
1. **New Bulk Candlesticks Endpoint** (Nov 2025)
   - `/markets/candlesticks` - Up to 10k candlesticks across multiple markets
   - More efficient than individual market requests

2. **Subpenny Pricing** (Nov 2025)
   - `yes_bid_dollars`, `no_bid_dollars` fields
   - Higher precision than standard cents

3. **List Subscriptions Command**
   - WebSocket command to view active subscriptions
   - Helpful for debugging connection state

4. **Multiple Ticker Subscription**
   - Can subscribe to multiple markets in single message
   - Additive subscriptions (no error on repeat)

**Polymarket:**
1. **Adjusted Midpoint Pricing**
   - Size-adjusted midpoint for rewards calculations
   - Accounts for order depth

2. **NegRisk Events**
   - `negRisk` boolean field on events
   - Important for certain market types

3. **Mergeable/Redeemable Positions**
   - Position flags for settlement actions
   - Useful for managing resolved markets

4. **Related Tags Discovery**
   - Tag relationship endpoints
   - Better market discovery

5. **Interactive Notebooks**
   - Price history visualization notebooks
   - Data analysis examples

### API Limitations Discovered

**Kalshi:**
- Maximum 200,000 open orders
- Batch operations limited to 20 orders
- Candlestick intervals: only 1m, 1h, 1d (no custom)
- Token expiration every 30 minutes
- Orderbook returns bids only (must calculate asks)
- Rate limits not publicly specified

**Polymarket:**
- One API key per wallet maximum
- Top holders capped at 20 per market
- Position query offset max: 10,000
- User positions limit: 500 per request
- Price history intervals mutually exclusive with timestamps
- L2 methods still require wallet signer for orders
- No native candlestick/OHLC data

### Recommended Testing Approach

**Kalshi:**
1. Use demo environment: `demo-api.kalshi.co`
2. Test with small orders first
3. Implement WebSocket reconnection logic
4. Handle 30-minute token refresh
5. Parse both cents and dollar fields

**Polymarket:**
1. Start with public endpoints (no auth)
2. Test L1 key creation carefully (replaces existing)
3. Set proper allowances before trading
4. Test on small amounts (mainnet only, no testnet)
5. Handle wallet signature prompts in UI

### Advanced Integration Ideas

1. **Cross-Platform Arbitrage Detection**
   - Compare similar markets across Kalshi/Polymarket
   - Alert on price discrepancies
   - Show spread opportunities

2. **Whale Tracking Dashboard**
   - Monitor top holders (Polymarket)
   - Track large position changes
   - Alert on significant movements

3. **Performance Analytics**
   - Aggregate settlement data (Kalshi)
   - Track user P&L (Polymarket)
   - Show accuracy metrics

4. **Social Trading Features**
   - Follow top leaderboard traders
   - Copy trades (with consent)
   - Share strategies

5. **Market Maker Tools**
   - Real-time orderbook visualization
   - Spread analysis
   - Liquidity provision strategies

6. **Historical Backtesting**
   - Use candlestick data (Kalshi)
   - Use price history (Polymarket)
   - Test prediction strategies

---

## Sources

### Kalshi Resources
- [Kalshi API Documentation](https://docs.kalshi.com/welcome)
- [Kalshi API Reference](https://trading-api.readme.io/reference/getting-started)
- [Kalshi Help Center](https://help.kalshi.com/kalshi-api)
- [Get Trades Endpoint](https://docs.kalshi.com/api-reference/market/get-trades)
- [Get Market Candlesticks](https://docs.kalshi.com/api-reference/market/get-market-candlesticks)
- [WebSocket Quick Start](https://docs.kalshi.com/getting_started/quick_start_websockets)
- [Get Balance](https://docs.kalshi.com/api-reference/portfolio/get-balance)
- [Get Settlements](https://docs.kalshi.com/api-reference/portfolio/get-settlements)
- [API Changelog](https://docs.kalshi.com/changelog)
- [Get Series](https://docs.kalshi.com/api-reference/market/get-series)
- [Get Events](https://docs.kalshi.com/api-reference/events/get-events)
- [Kalshi Python SDK (PyPI)](https://pypi.org/project/kalshi-python/)
- [Kalshi API Guide - Zuplo](https://zuplo.com/learning-center/kalshi-api)
- [Kalshi API Guide - Alphascope](https://www.alphascope.app/blog/kalshi-api)

### Polymarket Resources
- [Polymarket Documentation](https://docs.polymarket.com/)
- [Gamma API Structure](https://docs.polymarket.com/developers/gamma-markets-api/gamma-structure)
- [Fetch Markets Guide](https://docs.polymarket.com/developers/gamma-markets-api/fetch-markets-guide)
- [CLOB Introduction](https://docs.polymarket.com/developers/CLOB/introduction)
- [CLOB Authentication](https://docs.polymarket.com/developers/CLOB/authentication)
- [Get Midpoint](https://docs.polymarket.com/developers/CLOB/prices-books/get-midpoint)
- [WebSocket Overview](https://docs.polymarket.com/developers/CLOB/websocket/wss-overview)
- [Get Top Holders](https://docs.polymarket.com/api-reference/core/get-top-holders-for-markets)
- [Get User Positions](https://docs.polymarket.com/developers/misc-endpoints/data-api-get-positions)
- [Get Trades for User](https://docs.polymarket.com/api-reference/core/get-trades-for-a-user-or-markets)
- [Place Single Order](https://docs.polymarket.com/developers/CLOB/orders/create-order)
- [L2 Methods](https://docs.polymarket.com/developers/CLOB/clients/methods-l2)
- [Historical Timeseries Data](https://docs.polymarket.com/developers/CLOB/timeseries)
- [Get Sports Metadata](https://docs.polymarket.com/api-reference/sports/get-sports-metadata-information)
- [Polymarket Subgraph Overview](https://docs.polymarket.com/developers/subgraph/overview)
- [Polymarket GraphQL Tutorial](https://www.polytrackhq.app/blog/polymarket-graphql-subgraph-guide)
- [The Graph - Polymarket Guide](https://thegraph.com/docs/en/subgraphs/guides/polymarket/)
- [py-clob-client GitHub](https://github.com/Polymarket/py-clob-client)
- [Polymarket APIs (PyPI)](https://pypi.org/project/polymarket-apis/)

---

**End of Report**

*Last Updated: December 23, 2025*

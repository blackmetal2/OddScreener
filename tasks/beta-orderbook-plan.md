# Feature Plan: Beta Badge + Order Book + Top Positions + News

## Research Summary (via Playwright exploration of Polymarket)

### 1. Top Holders Data (Polymarket UI)
- Shows **Yes holders** and **No holders** separately
- Data per holder: username, shares count
- Example: `nextdayoff: 209,757 shares (Yes)`
- Already have `fetchHolders()` in codebase

### 2. Activity Feed (Polymarket UI)
- Real-time trades feed (already implemented as "Trades" tab)
- Data: username, action (bought/sold), shares, outcome, price, $ value, time ago, tx link

### 3. Order Book (CLOB API)
**Endpoint:** `GET https://clob.polymarket.com/book?token_id=<token_id>`

**Response:**
```json
{
  "market": "0x1b6f...",
  "asset_id": "1234567890",
  "timestamp": "2023-10-01T12:00:00Z",
  "bids": [{ "price": "0.31", "size": "10.5" }],
  "asks": [{ "price": "0.32", "size": "8.2" }],
  "min_order_size": "0.001",
  "tick_size": "0.01"
}
```

**Key insight:** Requires `token_id` (CLOB token), not our market ID. Markets have 2 tokens (YES/NO).

### 4. Trading Panel Features
- Market orders and Limit orders supported
- Limit: price in cents, shares quantity, expiration toggle

---

## Implementation Plan

### Task 1: Add "Beta" Badge to Logo ✅ SIMPLE
**File:** `components/layout/Sidebar.tsx` (lines 196-198)

**Current:**
```tsx
<span className="font-semibold text-lg tracking-tight">
  Odd<span className="text-accent">Screener</span>
</span>
```

**Change to:**
```tsx
<span className="font-semibold text-lg tracking-tight flex items-center">
  Odd<span className="text-accent">Screener</span>
  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-accent/20 text-accent rounded">
    Beta
  </span>
</span>
```

---

### Task 2: Order Book Feature 🔧 MEDIUM
**New files needed:**
- `lib/api/orderbook.ts` - API fetching
- `components/charts/OrderBook.tsx` - UI component

**API Integration:**
```typescript
// lib/api/orderbook.ts
interface OrderBookLevel {
  price: string;
  size: string;
}

interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  timestamp: string;
}

export async function fetchOrderBook(tokenId: string): Promise<OrderBook> {
  const res = await fetch(`https://clob.polymarket.com/book?token_id=${tokenId}`);
  const data = await res.json();

  const bestBid = parseFloat(data.bids[0]?.price || '0');
  const bestAsk = parseFloat(data.asks[0]?.price || '1');

  return {
    bids: data.bids,
    asks: data.asks,
    spread: bestAsk - bestBid,
    timestamp: data.timestamp
  };
}
```

**UI Options (pick one):**
1. **Depth Chart** - Horizontal bar chart showing cumulative liquidity
2. **Ladder View** - Vertical list of price levels with sizes
3. **Simple Spread Display** - Just show best bid/ask and spread

**Token ID Challenge:**
- Need to get `clobTokenIds` from market data
- Gamma API returns: `clobTokenIds: ["token_yes_id", "token_no_id"]`
- Store these when fetching market details

---

### Task 3: Enhance Top Positions Tab 🔧 SIMPLE
**Current state:** Already have `holders` state in MarketDetailClient, `positions` tab exists

**Enhancement:**
- Split into two columns: "YES Holders" | "NO Holders"
- Better card design with avatars
- Show position value in $ (shares × current price)

**File:** `app/market/[id]/MarketDetailClient.tsx` (positions tab section)

---

### Task 4: News Tab Polish 🔧 OPTIONAL
**Current state:** Already implemented with news tab, `fetchMarketNews` action

**Potential enhancements:**
- Better news card design
- Source icons/logos
- Time-based grouping (Today, Yesterday, This Week)

---

## Priority & Effort

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Beta Badge | HIGH | 5 min | None |
| Top Positions UI | HIGH | 30 min | None (data exists) |
| Order Book | MEDIUM | 2-3 hrs | Token ID mapping |
| News Polish | LOW | 1 hr | None |

---

## Questions for User Before Implementation

1. **Order Book Display Style:**
   - A) Depth chart (horizontal bars showing liquidity depth)
   - B) Ladder view (vertical price levels like trading platforms)
   - C) Simple spread only (just show bid/ask/spread numbers)

2. **Top Positions Scope:**
   - Show top 10, 15, or 20 holders per side?
   - Include estimated P&L (requires historical price data)?

3. **Tab Order in Market Detail:**
   - Current: Trades | Positions | News
   - Proposed: Trades | Order Book | Positions | News
   - Or: Order Book | Trades | Positions | News

---

## Technical Notes

### Getting CLOB Token IDs
The Polymarket Gamma API includes `clobTokenIds` in market responses:
```json
{
  "id": "0x123...",
  "clobTokenIds": [
    "71321045679252212594626385532706912750332728571942532289631379312455583992563",
    "52114319501245915516055106046884209969926127482827954674443846427813813222426"
  ]
}
```
- Index 0 = YES token
- Index 1 = NO token

### Real-time Order Book (Future)
For live updates, Polymarket offers WebSocket:
```
wss://ws-subscriptions-clob.polymarket.com/ws/market
```
Can subscribe to book updates for specific tokens.

---

## Checklist

- [ ] Add Beta badge to Sidebar logo
- [ ] Test Beta badge on mobile and desktop
- [ ] Add clobTokenIds to market data fetching
- [ ] Create orderbook API function
- [ ] Create OrderBook component
- [ ] Add Order Book tab to MarketDetailClient
- [ ] Enhance Positions tab UI (split Yes/No holders)
- [ ] Test all features
- [ ] Build compiles successfully

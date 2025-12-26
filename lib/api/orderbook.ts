/**
 * Polymarket CLOB Order Book API
 * Fetches order book data from Polymarket's CLOB API
 */

export interface OrderBookLevel {
  price: string;
  size: string;
}

export interface OrderBookResponse {
  market: string;
  asset_id: string;
  timestamp: string;
  hash: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  min_order_size: string;
  tick_size: string;
  neg_risk: boolean;
}

export interface OrderBook {
  tokenId: string;
  timestamp: Date;
  bids: Array<{ price: number; size: number; total: number }>;
  asks: Array<{ price: number; size: number; total: number }>;
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPercent: number;
  midPrice: number;
}

const CLOB_API_URL = 'https://clob.polymarket.com';

/**
 * Fetch order book for a specific token
 */
export async function fetchOrderBook(tokenId: string): Promise<OrderBook | null> {
  try {
    const response = await fetch(`${CLOB_API_URL}/book?token_id=${tokenId}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 10 }, // Cache for 10 seconds
    });

    if (!response.ok) {
      console.error(`[OrderBook] Failed to fetch: ${response.status}`);
      return null;
    }

    const data: OrderBookResponse = await response.json();

    // Parse and sort bids (highest first)
    const bids = data.bids
      .map((b) => ({
        price: parseFloat(b.price),
        size: parseFloat(b.size),
        total: 0, // Will calculate cumulative
      }))
      .sort((a, b) => b.price - a.price);

    // Parse and sort asks (lowest first)
    const asks = data.asks
      .map((a) => ({
        price: parseFloat(a.price),
        size: parseFloat(a.size),
        total: 0, // Will calculate cumulative
      }))
      .sort((a, b) => a.price - b.price);

    // Calculate cumulative totals
    let bidTotal = 0;
    for (const bid of bids) {
      bidTotal += bid.size;
      bid.total = bidTotal;
    }

    let askTotal = 0;
    for (const ask of asks) {
      askTotal += ask.size;
      ask.total = askTotal;
    }

    // Calculate spread
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 1;
    const spread = bestAsk - bestBid;
    const midPrice = (bestBid + bestAsk) / 2;
    const spreadPercent = midPrice > 0 ? (spread / midPrice) * 100 : 0;

    return {
      tokenId,
      timestamp: new Date(data.timestamp),
      bids,
      asks,
      bestBid,
      bestAsk,
      spread,
      spreadPercent,
      midPrice,
    };
  } catch (error) {
    console.error('[OrderBook] Error fetching order book:', error);
    return null;
  }
}

/**
 * Fetch order books for both YES and NO tokens of a market
 */
export async function fetchMarketOrderBooks(
  clobTokenIds: string[]
): Promise<{ yes: OrderBook | null; no: OrderBook | null }> {
  if (!clobTokenIds || clobTokenIds.length < 2) {
    return { yes: null, no: null };
  }

  const [yesBook, noBook] = await Promise.all([
    fetchOrderBook(clobTokenIds[0]),
    fetchOrderBook(clobTokenIds[1]),
  ]);

  return { yes: yesBook, no: noBook };
}

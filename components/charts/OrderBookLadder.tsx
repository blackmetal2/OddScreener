'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn, formatCompactNumber } from '@/lib/utils';
import { fetchOrderBook, OrderBook } from '@/lib/api/orderbook';

interface OrderBookLadderProps {
  clobTokenIds?: string[];
  outcomeName?: string; // "YES" or outcome name for multi
}

export default function OrderBookLadder({ clobTokenIds, outcomeName = 'YES' }: OrderBookLadderProps) {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadOrderBook = useCallback(async () => {
    if (!clobTokenIds || clobTokenIds.length === 0) {
      setError('No token IDs available');
      setLoading(false);
      return;
    }

    try {
      // Fetch YES token order book (first token)
      const book = await fetchOrderBook(clobTokenIds[0]);
      if (book) {
        setOrderBook(book);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('Failed to load order book');
      }
    } catch (e) {
      setError('Error loading order book');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [clobTokenIds]);

  useEffect(() => {
    loadOrderBook();

    // Refresh every 15 seconds
    const interval = setInterval(loadOrderBook, 15000);
    return () => clearInterval(interval);
  }, [loadOrderBook]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error || !orderBook) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-muted">
        <svg className="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">{error || 'No order book data available'}</p>
      </div>
    );
  }

  // Limit to top 10 levels each side
  const topBids = orderBook.bids.slice(0, 10);
  const topAsks = orderBook.asks.slice(0, 10);

  // Find max size for bar scaling
  const maxBidSize = Math.max(...topBids.map((b) => b.size), 1);
  const maxAskSize = Math.max(...topAsks.map((a) => a.size), 1);
  const maxSize = Math.max(maxBidSize, maxAskSize);

  return (
    <div className="space-y-4">
      {/* Header with spread info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-text-primary">{outcomeName} Order Book</span>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="text-green-400">Bid: {(orderBook.bestBid * 100).toFixed(1)}¢</span>
            <span>|</span>
            <span className="text-red-400">Ask: {(orderBook.bestAsk * 100).toFixed(1)}¢</span>
            <span>|</span>
            <span>Spread: {orderBook.spreadPercent.toFixed(2)}%</span>
          </div>
        </div>
        {lastUpdated && (
          <span className="text-xs text-text-muted">
            Updated {Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago
          </span>
        )}
      </div>

      {/* Order book ladder */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bids (Buy orders) - Left side */}
        <div className="space-y-1">
          <div className="grid grid-cols-3 text-xs text-text-muted pb-1 border-b border-border">
            <span className="text-left">Size</span>
            <span className="text-center">Price</span>
            <span className="text-right">Total</span>
          </div>
          {topBids.length === 0 ? (
            <div className="text-center text-text-muted text-sm py-4">No bids</div>
          ) : (
            topBids.map((bid, i) => {
              const widthPercent = (bid.size / maxSize) * 100;
              return (
                <div
                  key={`bid-${i}`}
                  className="relative grid grid-cols-3 text-xs py-1.5 hover:bg-surface-hover transition-colors"
                >
                  {/* Background bar */}
                  <div
                    className="absolute inset-y-0 left-0 bg-green-500/10"
                    style={{ width: `${widthPercent}%` }}
                  />
                  <span className="relative text-left font-mono text-green-400">
                    {formatCompactNumber(bid.size)}
                  </span>
                  <span className="relative text-center font-mono text-text-primary">
                    {(bid.price * 100).toFixed(1)}¢
                  </span>
                  <span className="relative text-right font-mono text-text-muted">
                    {formatCompactNumber(bid.total)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Asks (Sell orders) - Right side */}
        <div className="space-y-1">
          <div className="grid grid-cols-3 text-xs text-text-muted pb-1 border-b border-border">
            <span className="text-left">Price</span>
            <span className="text-center">Size</span>
            <span className="text-right">Total</span>
          </div>
          {topAsks.length === 0 ? (
            <div className="text-center text-text-muted text-sm py-4">No asks</div>
          ) : (
            topAsks.map((ask, i) => {
              const widthPercent = (ask.size / maxSize) * 100;
              return (
                <div
                  key={`ask-${i}`}
                  className="relative grid grid-cols-3 text-xs py-1.5 hover:bg-surface-hover transition-colors"
                >
                  {/* Background bar */}
                  <div
                    className="absolute inset-y-0 right-0 bg-red-500/10"
                    style={{ width: `${widthPercent}%` }}
                  />
                  <span className="relative text-left font-mono text-text-primary">
                    {(ask.price * 100).toFixed(1)}¢
                  </span>
                  <span className="relative text-center font-mono text-red-400">
                    {formatCompactNumber(ask.size)}
                  </span>
                  <span className="relative text-right font-mono text-text-muted">
                    {formatCompactNumber(ask.total)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <div className="text-xs text-text-muted">Mid Price</div>
          <div className="text-sm font-medium text-text-primary">
            {(orderBook.midPrice * 100).toFixed(1)}¢
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-text-muted">Spread</div>
          <div className="text-sm font-medium text-text-primary">
            {(orderBook.spread * 100).toFixed(2)}¢
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-text-muted">Bid Depth</div>
          <div className="text-sm font-medium text-green-400">
            {formatCompactNumber(topBids.reduce((sum, b) => sum + b.size, 0))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-text-muted">Ask Depth</div>
          <div className="text-sm font-medium text-red-400">
            {formatCompactNumber(topAsks.reduce((sum, a) => sum + a.size, 0))}
          </div>
        </div>
      </div>
    </div>
  );
}

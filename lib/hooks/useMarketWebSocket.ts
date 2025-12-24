'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MarketUpdate, Platform } from '@/types/market';

interface UseMarketWebSocketOptions {
  enabled?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

interface MarketSubscription {
  id: string;
  platform: Platform;
}

const POLYMARKET_WS_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws/market';

export function useMarketWebSocket(
  subscriptions: MarketSubscription[],
  options: UseMarketWebSocketOptions = {}
) {
  const {
    enabled = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [updates, setUpdates] = useState<Map<string, MarketUpdate>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const polymarketWsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Handle WebSocket message for Polymarket
  const handlePolymarketMessage = useCallback((event: MessageEvent) => {
    try {
      // Skip non-JSON messages (e.g., "INVALID OPERATION" text responses)
      const rawData = event.data;
      if (typeof rawData === 'string' && !rawData.startsWith('{') && !rawData.startsWith('[')) {
        // Silently ignore non-JSON messages like connection status or error strings
        return;
      }

      const data = JSON.parse(rawData);

      // Polymarket WebSocket message format (based on typical CLOB structure)
      // Expected: { event_type: 'market', market_id: string, data: { price: number, volume: number } }
      if (data.event_type === 'market' || data.type === 'ticker') {
        const marketId = data.market_id || data.id;
        const price = data.data?.price || data.price;
        const volume = data.data?.volume || data.volume;

        if (marketId && price !== undefined) {
          setUpdates((prev) => {
            const updated = new Map(prev);
            updated.set(marketId, {
              id: marketId,
              platform: 'polymarket',
              probability: Math.round(price * 100), // Convert 0-1 to percentage
              volume24h: volume,
              timestamp: new Date(),
            });
            return updated;
          });
        }
      }
    } catch (err) {
      console.error('Error parsing Polymarket WebSocket message:', err);
    }
  }, []);

  // Connect to Polymarket WebSocket
  const connectPolymarket = useCallback((marketIds: string[]) => {
    if (marketIds.length === 0) return;

    try {
      const ws = new WebSocket(POLYMARKET_WS_URL);

      ws.onopen = () => {
        console.log('Polymarket WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Subscribe to market updates
        marketIds.forEach((id) => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            market_id: id,
          }));
        });
      };

      ws.onmessage = handlePolymarketMessage;

      ws.onerror = (err) => {
        console.error('Polymarket WebSocket error:', err);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('Polymarket WebSocket disconnected');
        setIsConnected(false);
        polymarketWsRef.current = null;

        // Attempt reconnection
        if (
          enabled &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          const delay = reconnectDelay * reconnectAttemptsRef.current;
          console.log(`Reconnecting Polymarket WebSocket in ${delay}ms...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connectPolymarket(marketIds);
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached. Falling back to polling.');
        }
      };

      polymarketWsRef.current = ws;
    } catch (err) {
      console.error('Failed to create Polymarket WebSocket:', err);
      setError('Failed to initialize WebSocket connection');
    }
  }, [enabled, handlePolymarketMessage, maxReconnectAttempts, reconnectDelay]);

  // Connect/disconnect based on subscriptions
  useEffect(() => {
    if (!enabled || subscriptions.length === 0) {
      // Clean up existing connections
      if (polymarketWsRef.current) {
        polymarketWsRef.current.close();
        polymarketWsRef.current = null;
      }
      return;
    }

    // Get Polymarket IDs
    const polymarketIds = subscriptions
      .filter((s) => s.platform === 'polymarket')
      .map((s) => s.id);

    // Connect to Polymarket if needed
    if (polymarketIds.length > 0 && !polymarketWsRef.current) {
      connectPolymarket(polymarketIds);
    }

    // Cleanup on unmount
    return () => {
      if (polymarketWsRef.current) {
        polymarketWsRef.current.close();
        polymarketWsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enabled, subscriptions, connectPolymarket]);

  return {
    updates,
    isConnected,
    error,
    clearError: () => setError(null),
  };
}

/**
 * USE REALTIME HOOK
 *
 * React hook for receiving real-time market updates via Server-Sent Events.
 * Returns current prices for all markets, updated live.
 */

import { useState, useEffect } from 'react';

export function useRealtime() {
  const [prices, setPrices] = useState({}); // { ticker: price }
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let eventSource = null;

    try {
      // Connect to SSE endpoint
      const API_BASE = import.meta.env.VITE_API_URL ||
        (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');
      eventSource = new EventSource(`${API_BASE}/realtime/updates`);

      eventSource.onopen = () => {
        console.log('✅ Connected to real-time updates');
        setConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'snapshot') {
            // Initial snapshot of all market prices
            const newPrices = {};
            data.markets.forEach((market) => {
              newPrices[market.ticker] = market.price;
            });
            setPrices(newPrices);
          } else if (data.type === 'update') {
            // Live price update for a single market
            setPrices((prev) => ({
              ...prev,
              [data.ticker]: data.price,
            }));
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setConnected(false);
        eventSource.close();
      };
    } catch (error) {
      console.error('Failed to connect to SSE:', error);
      setConnected(false);
    }

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
        console.log('🔌 Disconnected from real-time updates');
      }
    };
  }, []);

  return { prices, connected };
}

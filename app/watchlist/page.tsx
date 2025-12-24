'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import AlertsModal from '@/components/modals/AlertsModal';
import { cn } from '@/lib/utils';
import { Market, Category } from '@/types/market';
import { StackedProgressBar } from '@/components/table/StackedProgressBar';

interface WatchlistItem {
  id: string;
  name: string;
  platform: 'polymarket';
  addedAt: string;
}

// Category colors for badges
const categoryColors: Record<Category, { bg: string; text: string }> = {
  politics: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  sports: { bg: 'bg-green-500/20', text: 'text-green-400' },
  crypto: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  finance: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  world: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  culture: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  tech: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  science: { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
};

function WatchlistContent() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [marketData, setMarketData] = useState<Map<string, Market>>(new Map());
  const [loading, setLoading] = useState(true);
  const [alertsOpen, setAlertsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('oddscreener-watchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  // Fetch market data for watchlist items
  useEffect(() => {
    if (watchlist.length === 0) return;

    const fetchMarketData = async () => {
      try {
        const { fetchMarkets } = await import('@/app/actions/markets');
        const allMarkets = await fetchMarkets();
        const marketMap = new Map<string, Market>();

        allMarkets.forEach((market) => {
          if (watchlist.some((item) => item.id === market.id)) {
            marketMap.set(market.id, market);
          }
        });

        setMarketData(marketMap);
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };

    fetchMarketData();
  }, [watchlist]);

  const removeFromWatchlist = (id: string) => {
    const updated = watchlist.filter((item) => item.id !== id);
    setWatchlist(updated);
    localStorage.setItem('oddscreener-watchlist', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onOpenAlerts={() => setAlertsOpen(true)} />

      <main className="ml-[200px] p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Watchlist</h1>
          <p className="text-text-secondary">
            Markets you're tracking. Add markets from any market detail page.
          </p>
        </div>

        {watchlist.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Your watchlist is empty
            </h3>
            <p className="text-text-muted mb-4">
              Browse markets and click "Watch" to add them to your watchlist.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-background font-medium rounded-lg hover:bg-accent/90 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Browse Markets
            </Link>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                  <th className="py-3 px-4 text-left font-medium">Market</th>
                  <th className="py-3 px-4 text-left font-medium">Category</th>
                  <th className="py-3 px-4 text-right font-medium">Prob</th>
                  <th className="py-3 px-4 text-left font-medium">Added</th>
                  <th className="py-3 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item) => {
                  const market = marketData.get(item.id);
                  const category = market?.category || 'world';
                  const colors = categoryColors[category];
                  const probability = market?.probability ?? null;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <Link
                          href={`/market/${item.platform}-${item.id}`}
                          className="text-text-primary hover:text-accent transition-colors font-medium"
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={cn(
                            'badge uppercase text-[8px] font-medium tracking-wide',
                            colors.bg,
                            colors.text
                          )}
                        >
                          {category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {market ? (
                          <div className="flex items-center gap-2">
                            <StackedProgressBar market={market} />
                            <span className={cn(
                              'font-mono text-sm font-semibold w-10 text-right',
                              probability !== null && probability >= 70 ? 'text-positive' :
                              probability !== null && probability >= 40 ? 'text-text-primary' :
                              'text-orange-400'
                            )}>
                              {probability !== null ? `${probability.toFixed(0)}%` : '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-text-muted text-sm">
                        {new Date(item.addedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => removeFromWatchlist(item.id)}
                          className="text-text-muted hover:text-negative transition-colors"
                          title="Remove from watchlist"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Alerts Modal */}
      <AlertsModal isOpen={alertsOpen} onClose={() => setAlertsOpen(false)} />
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WatchlistContent />
    </Suspense>
  );
}

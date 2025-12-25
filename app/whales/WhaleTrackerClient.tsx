'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LeaderboardEntry } from './page';
import { formatNumber, cn } from '@/lib/utils';
// Max tracked whales limit
const MAX_TRACKED_WHALES = 3;

// Get Polymarket profile URL
function getPolymarketProfileUrl(address: string): string {
  return `https://polymarket.com/profile/${address}`;
}
import { fetchTrackedWhaleTrades } from '@/app/actions/markets';
import { TraderTrade } from '@/types/market';

interface TrackedWallet {
  address: string;
  name: string;
  addedAt: string;
}

interface WhaleTrackerClientProps {
  initialLeaderboard: LeaderboardEntry[];
}

// Format relative time (e.g., "2h ago", "3d ago")
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function WhaleTrackerClient({ initialLeaderboard }: WhaleTrackerClientProps) {
  const router = useRouter();
  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>([]);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletName, setNewWalletName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Recent trades state
  const [recentTrades, setRecentTrades] = useState<Record<string, TraderTrade | null>>({});
  const [tradesLoading, setTradesLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Fetch recent trades for tracked wallets
  const fetchTrades = useCallback(async (wallets: TrackedWallet[]) => {
    if (wallets.length === 0) {
      setRecentTrades({});
      return;
    }

    setTradesLoading(true);
    try {
      const addresses = wallets.map(w => w.address);
      const trades = await fetchTrackedWhaleTrades(addresses);
      setRecentTrades(trades);
      setLastFetched(new Date());
    } catch (error) {
      console.error('Error fetching whale trades:', error);
    } finally {
      setTradesLoading(false);
    }
  }, []);

  // Load tracked wallets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('oddscreener-tracked-wallets');
    if (saved) {
      const wallets = JSON.parse(saved);
      setTrackedWallets(wallets);
      // Fetch trades for loaded wallets
      fetchTrades(wallets);
    }
  }, [fetchTrades]);

  const saveTrackedWallets = (wallets: TrackedWallet[]) => {
    localStorage.setItem('oddscreener-tracked-wallets', JSON.stringify(wallets));
    setTrackedWallets(wallets);
    // Refetch trades when wallets change
    fetchTrades(wallets);
  };

  const addWallet = () => {
    if (!newWalletAddress.trim()) return;
    if (trackedWallets.length >= MAX_TRACKED_WHALES) return;
    const wallet: TrackedWallet = {
      address: newWalletAddress.trim(),
      name: newWalletName.trim() || 'Wallet ' + (trackedWallets.length + 1),
      addedAt: new Date().toISOString(),
    };
    saveTrackedWallets([...trackedWallets, wallet]);
    setNewWalletAddress('');
    setNewWalletName('');
    setShowAddForm(false);
  };

  const canAddMore = trackedWallets.length < MAX_TRACKED_WHALES;

  const removeWallet = (address: string) => {
    saveTrackedWallets(trackedWallets.filter(w => w.address !== address));
  };

  const trackFromLeaderboard = (entry: LeaderboardEntry) => {
    // Toggle: if already tracked, remove it; otherwise add it
    if (trackedWallets.some(w => w.address === entry.address)) {
      saveTrackedWallets(trackedWallets.filter(w => w.address !== entry.address));
      return;
    }
    // Check limit before adding
    if (trackedWallets.length >= MAX_TRACKED_WHALES) return;
    const wallet: TrackedWallet = {
      address: entry.address,
      name: entry.displayName,
      addedAt: new Date().toISOString(),
    };
    saveTrackedWallets([...trackedWallets, wallet]);
  };

  const isTracked = (address: string) => trackedWallets.some(w => w.address === address);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </Link>
          <div className="w-px h-6 bg-border" />
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Whale Tracker</h1>
            <p className="text-sm text-text-secondary">Track profitable Polymarket traders</p>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Tracked Whales ({trackedWallets.length}/{MAX_TRACKED_WHALES})
              </h2>
              <p className="text-xs text-text-muted mt-0.5">Track whales to monitor their recent trading activity</p>
            </div>
            <div className="flex items-center gap-2">
              {trackedWallets.length > 0 && (
                <button
                  onClick={() => fetchTrades(trackedWallets)}
                  disabled={tradesLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-text-secondary hover:text-text-primary border border-border rounded-lg text-sm transition-colors disabled:opacity-50"
                  title={lastFetched ? `Last updated: ${formatTimeAgo(lastFetched)}` : 'Refresh trades'}
                >
                  <svg className={cn("w-4 h-4", tradesLoading && "animate-spin")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {tradesLoading ? 'Loading...' : 'Refresh'}
                </button>
              )}
              {canAddMore ? (
                <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-3 py-1.5 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Wallet
                </button>
              ) : (
                <span className="text-xs text-text-muted px-3 py-1.5">Limit reached</span>
              )}
            </div>
          </div>

          {showAddForm && (
            <div className="bg-surface rounded-xl border border-border p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-text-muted mb-1 block">Wallet Address</label>
                  <input type="text" value={newWalletAddress} onChange={(e) => setNewWalletAddress(e.target.value)} placeholder="0x..." className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Name (optional)</label>
                  <input type="text" value={newWalletName} onChange={(e) => setNewWalletName(e.target.value)} placeholder="e.g., Theo" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
                <button onClick={addWallet} className="px-4 py-1.5 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors">Track Wallet</button>
              </div>
            </div>
          )}

          {trackedWallets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {trackedWallets.map((wallet) => {
                const trade = recentTrades[wallet.address.toLowerCase()];
                const isLoadingTrade = tradesLoading && !trade;

                return (
                  <div
                    key={wallet.address}
                    className="bg-surface rounded-xl border border-border p-4 hover:border-accent/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/trader/${wallet.address}`)}
                  >
                    {/* Header: Name + Actions */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium">
                          {wallet.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                            {wallet.name}
                          </p>
                          <p className="text-xs text-text-muted font-mono">
                            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={getPolymarketProfileUrl(wallet.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-text-muted hover:text-accent transition-colors"
                          title="View on Polymarket"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </a>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeWallet(wallet.address); }}
                          className="p-1 text-text-muted hover:text-negative transition-colors"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Recent Trade */}
                    <div className="border-t border-border/50 pt-3">
                      {isLoadingTrade ? (
                        <div className="animate-pulse">
                          <div className="h-4 bg-surface-hover rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-surface-hover rounded w-full"></div>
                        </div>
                      ) : trade ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              'text-xs font-medium px-1.5 py-0.5 rounded',
                              trade.side === 'buy' ? 'bg-positive/20 text-positive' :
                              trade.side === 'sell' ? 'bg-negative/20 text-negative' :
                              'bg-text-muted/20 text-text-muted'
                            )}>
                              {trade.side === 'buy' ? 'Bought' : trade.side === 'sell' ? 'Sold' : trade.side.toUpperCase()}
                            </span>
                            <span className="text-xs text-text-muted">
                              {formatTimeAgo(new Date(trade.timestamp))}
                            </span>
                          </div>
                          <p className="text-sm text-text-primary font-medium">
                            {formatNumber(trade.value)} {trade.outcome} @ {Math.round(trade.price * 100)}%
                          </p>
                          <p className="text-xs text-text-muted truncate mt-0.5" title={trade.marketTitle}>
                            {trade.marketTitle}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-text-muted italic">No recent trades</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-border p-8 text-center mt-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-text-primary mb-2">No whales tracked yet</h3>
              <p className="text-sm text-text-secondary max-w-md mx-auto mb-4">
                Track top traders from the leaderboard below to monitor their recent trades and copy their strategies.
              </p>
              <p className="text-xs text-text-muted">
                Click the <span className="inline-flex items-center"><svg className="w-4 h-4 mx-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg></span> button on any trader to start tracking
              </p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Top Traders (7 Day)</h2>
          {initialLeaderboard.length > 0 ? (
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                    <th className="py-3 px-4 text-left font-medium">Rank</th>
                    <th className="py-3 px-4 text-left font-medium">Trader</th>
                    <th className="py-3 px-4 text-right font-medium">Profit <span className="text-text-muted font-normal">(7d)</span></th>
                    <th className="py-3 px-4 text-right font-medium">Volume <span className="text-text-muted font-normal">(7d)</span></th>
                    <th className="py-3 px-4 text-center font-medium">Track</th>
                    <th className="py-3 px-4 text-center font-medium w-16">View</th>
                  </tr>
                </thead>
                <tbody>
                  {initialLeaderboard.map((entry) => (
                    <tr
                      key={entry.address}
                      className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/trader/${entry.address}`)}
                    >
                      <td className="py-3 px-4"><span className={cn('text-sm font-mono', entry.rank <= 3 ? 'text-accent font-bold' : 'text-text-muted')}>#{entry.rank}</span></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium">{entry.displayName.charAt(0).toUpperCase()}</div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{entry.displayName}</p>
                            <p className="text-xs text-text-muted font-mono">{entry.address.slice(0, 6)}...{entry.address.slice(-4)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right"><span className={cn('font-mono text-sm font-medium', entry.profit >= 0 ? 'text-positive' : 'text-negative')}>{entry.profit >= 0 ? '+' : ''}{formatNumber(entry.profit)}</span></td>
                      <td className="py-3 px-4 text-right"><span className="font-mono text-sm text-text-secondary">{entry.volume > 0 ? formatNumber(entry.volume) : '-'}</span></td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const tracked = isTracked(entry.address);
                          const disabled = !tracked && !canAddMore;
                          return (
                            <button
                              onClick={(e) => { e.stopPropagation(); if (!disabled) trackFromLeaderboard(entry); }}
                              disabled={disabled}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors',
                                tracked ? 'text-accent bg-accent/20' :
                                disabled ? 'text-text-muted/50 cursor-not-allowed' :
                                'text-text-muted hover:text-accent hover:bg-accent/10'
                              )}
                              title={tracked ? 'Tracking' : disabled ? 'Limit reached' : 'Track'}
                            >
                              <svg className="w-5 h-5" fill={tracked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                              </svg>
                            </button>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <svg className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-border p-12 text-center">
              <h3 className="text-lg font-medium text-text-primary mb-2">Leaderboard Unavailable</h3>
              <p className="text-sm text-text-secondary">Unable to fetch leaderboard data. Try again later.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

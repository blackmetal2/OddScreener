'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LeaderboardEntry } from './page';
import { formatNumber, cn } from '@/lib/utils';
import { getPolygonscanAddressUrl } from '@/lib/api/polygonscan';

interface TrackedWallet {
  address: string;
  name: string;
  addedAt: string;
}

interface WhaleTrackerClientProps {
  initialLeaderboard: LeaderboardEntry[];
}

export default function WhaleTrackerClient({ initialLeaderboard }: WhaleTrackerClientProps) {
  const router = useRouter();
  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>([]);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletName, setNewWalletName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Load tracked wallets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('oddscreener-tracked-wallets');
    if (saved) {
      setTrackedWallets(JSON.parse(saved));
    }
  }, []);

  const saveTrackedWallets = (wallets: TrackedWallet[]) => {
    localStorage.setItem('oddscreener-tracked-wallets', JSON.stringify(wallets));
    setTrackedWallets(wallets);
  };

  const addWallet = () => {
    if (!newWalletAddress.trim()) return;
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

  const removeWallet = (address: string) => {
    saveTrackedWallets(trackedWallets.filter(w => w.address !== address));
  };

  const trackFromLeaderboard = (entry: LeaderboardEntry) => {
    // Toggle: if already tracked, remove it; otherwise add it
    if (trackedWallets.some(w => w.address === entry.address)) {
      saveTrackedWallets(trackedWallets.filter(w => w.address !== entry.address));
      return;
    }
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Tracked Wallets ({trackedWallets.length})</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-3 py-1.5 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Wallet
            </button>
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
            <div className="bg-surface rounded-xl border border-border divide-y divide-border">
              {trackedWallets.map((wallet) => (
                <div key={wallet.address} className="p-4 flex items-center justify-between hover:bg-surface-hover/50 transition-colors group">
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => router.push(`/trader/${wallet.address}`)}
                  >
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium">{wallet.name.charAt(0).toUpperCase()}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{wallet.name}</p>
                      <p className="text-xs text-text-muted font-mono">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</p>
                    </div>
                    {/* Arrow icon to indicate clickable */}
                    <svg className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={getPolygonscanAddressUrl(wallet.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-text-muted hover:text-accent transition-colors"
                      title="View on Polygonscan"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeWallet(wallet.address); }}
                      className="p-1.5 text-text-muted hover:text-negative transition-colors"
                      title="Remove"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-border p-8 text-center">
              <p className="text-sm text-text-secondary">No wallets tracked yet. Add a wallet or click the star on traders below.</p>
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
                    <th className="py-3 px-4 text-right font-medium">Profit</th>
                    <th className="py-3 px-4 text-right font-medium">Volume</th>
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
                      <td className="py-3 px-4 text-right"><span className="font-mono text-sm text-text-secondary">{formatNumber(entry.volume)}</span></td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); trackFromLeaderboard(entry); }}
                          className={cn('p-1.5 rounded-lg transition-colors', isTracked(entry.address) ? 'text-accent bg-accent/20' : 'text-text-muted hover:text-accent hover:bg-accent/10')}
                          title={isTracked(entry.address) ? 'Tracking' : 'Track'}
                        >
                          <svg className="w-5 h-5" fill={isTracked(entry.address) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                        </button>
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

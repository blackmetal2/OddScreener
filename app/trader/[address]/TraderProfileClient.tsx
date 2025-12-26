'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TraderProfile, TraderPosition, TraderTrade, TraderClosedPosition } from '@/types/market';
import { TokenTransfer, getPolygonscanAddressUrl, getPolygonscanTxUrl } from '@/lib/api/polygonscan';
import { formatNumber, formatCompactNumber, cn } from '@/lib/utils';
import PnLChart from '@/components/charts/PnLChart';

interface TraderProfileClientProps {
  address: string;
  profile: TraderProfile | null;
  positions: TraderPosition[];
  closedPositions: TraderClosedPosition[];
  trades: TraderTrade[];
  transfers: TokenTransfer[];
}

type TabType = 'overview' | 'positions' | 'trades' | 'transfers';
type TimeFilter = '7d' | '30d' | 'all';

export default function TraderProfileClient({
  address,
  profile,
  positions,
  closedPositions,
  trades,
  transfers,
}: TraderProfileClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [tradesPage, setTradesPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const tradesPerPage = 20;

  // Filter trades by time period
  const filteredTrades = useMemo(() => {
    if (timeFilter === 'all') return trades;

    const now = Date.now();
    const cutoffMs = timeFilter === '7d'
      ? 7 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;
    const cutoff = now - cutoffMs;

    return trades.filter(t => t.timestamp.getTime() >= cutoff);
  }, [trades, timeFilter]);

  // Filter closed positions by time period
  const filteredClosedPositions = useMemo(() => {
    if (timeFilter === 'all') return closedPositions;

    const now = Date.now();
    const cutoffMs = timeFilter === '7d'
      ? 7 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;
    const cutoff = now - cutoffMs;

    return closedPositions.filter(p => p.closedAt.getTime() >= cutoff);
  }, [closedPositions, timeFilter]);

  // Calculate stats from closed positions ONLY for gains/losses (to avoid double-counting)
  // positions.cashPnl already includes realized P&L, so we can't add closedPositions.realizedPnl
  const stats = useMemo(() => {
    const relevantClosedPositions = timeFilter === 'all' ? closedPositions : filteredClosedPositions;

    // Total PnL: Use leaderboard (most accurate) for all-time, otherwise calculate from closed only
    const closedPositionsPnl = relevantClosedPositions.reduce((sum, p) => sum + p.realizedPnl, 0);
    const totalPnl = timeFilter === 'all' && profile?.pnl
      ? profile.pnl
      : closedPositionsPnl;

    // Current portfolio value (open positions only)
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);

    // REALIZED Gains/Losses - ONLY from closed positions (avoid double-counting with open positions)
    const realizedGains = relevantClosedPositions.filter(p => p.realizedPnl > 0).reduce((sum, p) => sum + p.realizedPnl, 0);
    const realizedLosses = relevantClosedPositions.filter(p => p.realizedPnl < 0).reduce((sum, p) => sum + Math.abs(p.realizedPnl), 0);

    // Win rate: Only from closed positions (finalized outcomes)
    const closedWins = relevantClosedPositions.filter(p => p.realizedPnl > 0).length;
    const closedLosses = relevantClosedPositions.filter(p => p.realizedPnl < 0).length;
    const totalClosedCount = relevantClosedPositions.length;
    const winRate = totalClosedCount > 0 ? (closedWins / totalClosedCount) * 100 : 0;

    // Profit Factor = Realized Gains / Realized Losses
    const profitFactor = realizedLosses > 0 ? realizedGains / realizedLosses : realizedGains > 0 ? Infinity : 0;

    const activePositions = positions.filter(p => !p.resolved && p.currentValue > 0);

    const totalDeposits = transfers.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = transfers.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
    const netDeposits = totalDeposits - totalWithdrawals;

    // Trade count for the period
    const tradeCount = filteredTrades.length;

    return {
      totalPnl,
      totalGains: realizedGains,
      totalLosses: realizedLosses,
      winRate,
      profitFactor,
      totalValue,
      activePositions: activePositions.length,
      totalPositionsCount: totalClosedCount,
      totalDeposits,
      totalWithdrawals,
      netDeposits,
      tradeCount,
    };
  }, [positions, closedPositions, filteredClosedPositions, filteredTrades, transfers, profile, timeFilter]);

  // Top markets by PnL (combine open and closed positions)
  const topWins = useMemo(() => {
    const openWins = positions
      .filter(p => p.overallPnl > 0)
      .map(p => ({ title: p.marketTitle, pnl: p.overallPnl, id: p.marketId }));
    const closedWins = closedPositions
      .filter(p => p.realizedPnl > 0)
      .map(p => ({ title: p.marketTitle, pnl: p.realizedPnl, id: p.marketId }));
    return [...openWins, ...closedWins]
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 5);
  }, [positions, closedPositions]);

  const topLosses = useMemo(() => {
    const openLosses = positions
      .filter(p => p.overallPnl < 0)
      .map(p => ({ title: p.marketTitle, pnl: p.overallPnl, id: p.marketId }));
    const closedLosses = closedPositions
      .filter(p => p.realizedPnl < 0)
      .map(p => ({ title: p.marketTitle, pnl: p.realizedPnl, id: p.marketId }));
    return [...openLosses, ...closedLosses]
      .sort((a, b) => a.pnl - b.pnl)
      .slice(0, 5);
  }, [positions, closedPositions]);

  // Category breakdown stats
  const categoryStats = useMemo(() => {
    const statsMap = new Map<string, { wins: number; losses: number; totalPnl: number; count: number }>();

    // Process open positions
    positions.forEach(p => {
      const cat = p.category || 'world';
      const current = statsMap.get(cat) || { wins: 0, losses: 0, totalPnl: 0, count: 0 };
      statsMap.set(cat, {
        wins: current.wins + (p.overallPnl > 0 ? 1 : 0),
        losses: current.losses + (p.overallPnl < 0 ? 1 : 0),
        totalPnl: current.totalPnl + p.overallPnl,
        count: current.count + 1,
      });
    });

    // Process closed positions
    closedPositions.forEach(p => {
      const cat = p.category || 'world';
      const current = statsMap.get(cat) || { wins: 0, losses: 0, totalPnl: 0, count: 0 };
      statsMap.set(cat, {
        wins: current.wins + (p.realizedPnl > 0 ? 1 : 0),
        losses: current.losses + (p.realizedPnl < 0 ? 1 : 0),
        totalPnl: current.totalPnl + p.realizedPnl,
        count: current.count + 1,
      });
    });

    // Convert to array and calculate derived stats
    return [...statsMap.entries()]
      .map(([category, data]) => ({
        category,
        ...data,
        winRate: data.count > 0 ? ((data.wins / data.count) * 100) : 0,
      }))
      .sort((a, b) => b.totalPnl - a.totalPnl);
  }, [positions, closedPositions]);

  // Paginated trades
  const paginatedTrades = useMemo(() => {
    const start = (tradesPage - 1) * tradesPerPage;
    return trades.slice(start, start + tradesPerPage);
  }, [trades, tradesPage]);

  const totalTradesPages = Math.ceil(trades.length / tradesPerPage);

  const displayName = profile?.displayName || `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>
          <div className="w-px h-6 bg-border" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-text-primary">{displayName}</h1>
              {profile?.rank && profile.rank > 0 && (
                <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-medium rounded-full">
                  #{profile.rank}
                </span>
              )}
            </div>
            <p className="text-sm text-text-muted font-mono">{address}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://polymarket.com/profile/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm bg-surface-hover rounded-lg hover:bg-border transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Polymarket
            </a>
            <a
              href={getPolygonscanAddressUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm bg-surface-hover rounded-lg hover:bg-border transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Polygonscan
            </a>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-6 py-4 border-b border-border bg-surface">
        {/* Time Filter Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-text-muted mr-2">Period:</span>
          {(['7d', '30d', 'all'] as TimeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-lg transition-colors',
                timeFilter === f
                  ? 'bg-accent text-white'
                  : 'bg-surface-hover text-text-secondary hover:text-text-primary'
              )}
            >
              {f === 'all' ? 'All Time' : f.toUpperCase()}
            </button>
          ))}
          {timeFilter !== 'all' && (
            <span className="text-xs text-text-muted ml-2">
              ({stats.tradeCount} trades in period)
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <StatCard label="Total PnL" value={stats.totalPnl} isCurrency colored />
          <StatCard label="Realized Gains" value={stats.totalGains} isCurrency positive />
          <StatCard label="Realized Losses" value={-stats.totalLosses} isCurrency negative />
          <StatCard
            label="Profit Factor"
            value={stats.profitFactor === Infinity ? 999 : stats.profitFactor}
            suffix="x"
            colored
          />
          <StatCard label="Win Rate" value={stats.winRate} suffix="%" />
          <StatCard label="Portfolio Value" value={stats.totalValue} isCurrency />
          <StatCard label="Positions" value={stats.activePositions} />
          <StatCard label="Net Deposits" value={stats.netDeposits} isCurrency colored />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-border">
        <div className="flex gap-1">
          {(['overview', 'positions', 'trades', 'transfers'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
                activeTab === tab
                  ? 'text-accent border-accent'
                  : 'text-text-secondary border-transparent hover:text-text-primary'
              )}
            >
              {tab === 'transfers' ? 'Deposits/Withdrawals' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* P&L Chart */}
            <div className="bg-surface rounded-xl border border-border p-4 lg:col-span-2">
              <h3 className="text-sm font-medium text-text-secondary mb-3">Cumulative P&L Over Time</h3>
              <PnLChart trades={trades} />
            </div>

            {/* Top Wins */}
            <div className="bg-surface rounded-xl border border-border p-4">
              <h3 className="text-sm font-medium text-text-secondary mb-3">Biggest Wins</h3>
              {topWins.length > 0 ? (
                <div className="space-y-2">
                  {topWins.map((pos, i) => (
                    <div key={pos.id + i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-muted w-5">#{i + 1}</span>
                        <span className="text-sm text-text-primary truncate max-w-[200px]">{pos.title}</span>
                      </div>
                      <span className="text-sm font-mono text-positive">+{formatNumber(pos.pnl)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted py-4 text-center">No winning positions</p>
              )}
            </div>

            {/* Top Losses */}
            <div className="bg-surface rounded-xl border border-border p-4">
              <h3 className="text-sm font-medium text-text-secondary mb-3">Biggest Losses</h3>
              {topLosses.length > 0 ? (
                <div className="space-y-2">
                  {topLosses.map((pos, i) => (
                    <div key={pos.id + i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-muted w-5">#{i + 1}</span>
                        <span className="text-sm text-text-primary truncate max-w-[200px]">{pos.title}</span>
                      </div>
                      <span className="text-sm font-mono text-negative">{formatNumber(pos.pnl)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted py-4 text-center">No losing positions</p>
              )}
            </div>

            {/* Category Breakdown */}
            <div className="bg-surface rounded-xl border border-border p-4 lg:col-span-2">
              <h3 className="text-sm font-medium text-text-secondary mb-3">Performance by Category</h3>
              {categoryStats.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categoryStats.map((cat) => (
                    <div key={cat.category} className="bg-background rounded-lg p-3 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-text-secondary capitalize">{cat.category}</span>
                        <span className="text-xs text-text-muted">{cat.count} pos</span>
                      </div>
                      <div className={cn(
                        'text-lg font-mono font-semibold mb-1',
                        cat.totalPnl >= 0 ? 'text-positive' : 'text-negative'
                      )}>
                        {cat.totalPnl >= 0 ? '+' : ''}{formatNumber(cat.totalPnl)}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">Win Rate</span>
                        <span className={cn(
                          'font-medium',
                          cat.winRate >= 50 ? 'text-positive' : 'text-negative'
                        )}>
                          {cat.winRate.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-text-muted">W/L</span>
                        <span className="text-text-secondary">
                          <span className="text-positive">{cat.wins}</span>
                          /
                          <span className="text-negative">{cat.losses}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted py-4 text-center">No category data available</p>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-surface rounded-xl border border-border p-4 lg:col-span-2">
              <h3 className="text-sm font-medium text-text-secondary mb-3">Recent Trades</h3>
              {trades.length > 0 ? (
                <div className="space-y-2">
                  {trades.slice(0, 10).map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded',
                          trade.side === 'buy' ? 'bg-positive/20 text-positive' :
                          trade.side === 'sell' ? 'bg-negative/20 text-negative' :
                          trade.side === 'redeem' ? 'bg-accent/20 text-accent' :
                          'bg-purple-500/20 text-purple-400'
                        )}>
                          {trade.side.toUpperCase()}
                        </span>
                        <span className="text-sm text-text-primary truncate max-w-[300px]">{trade.marketTitle}</span>
                        <span className="text-xs text-text-muted">{trade.outcome}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono text-text-primary">{formatNumber(trade.value)}</span>
                        <span className="text-xs text-text-muted ml-2">@ {(trade.price * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted py-4 text-center">No trades found</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                  <th className="py-3 px-4 text-left font-medium">Market</th>
                  <th className="py-3 px-4 text-left font-medium">Position</th>
                  <th className="py-3 px-4 text-right font-medium">Shares</th>
                  <th className="py-3 px-4 text-right font-medium">Value</th>
                  <th className="py-3 px-4 text-right font-medium">Invested</th>
                  <th className="py-3 px-4 text-right font-medium">PnL</th>
                </tr>
              </thead>
              <tbody>
                {positions.length > 0 ? (
                  positions.map((pos) => (
                    <tr key={pos.marketId + pos.outcome} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm text-text-primary">{pos.marketTitle}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-text-secondary">{pos.outcome}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-mono text-text-primary">{formatCompactNumber(pos.shares)}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-mono text-text-primary">{formatNumber(pos.currentValue)}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-mono text-text-secondary">{formatNumber(pos.invested)}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={cn(
                          'text-sm font-mono font-medium',
                          pos.overallPnl >= 0 ? 'text-positive' : 'text-negative'
                        )}>
                          {pos.overallPnl >= 0 ? '+' : ''}{formatNumber(pos.overallPnl)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted">No positions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                  <th className="py-3 px-4 text-left font-medium">Time</th>
                  <th className="py-3 px-4 text-left font-medium">Side</th>
                  <th className="py-3 px-4 text-left font-medium">Market</th>
                  <th className="py-3 px-4 text-left font-medium">Outcome</th>
                  <th className="py-3 px-4 text-right font-medium">Value</th>
                  <th className="py-3 px-4 text-right font-medium">Price</th>
                  <th className="py-3 px-4 text-right font-medium">Shares</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrades.length > 0 ? (
                  paginatedTrades.map((trade) => (
                    <tr key={trade.id} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm text-text-secondary">
                          {new Date(trade.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded',
                          trade.side === 'buy' ? 'bg-positive/20 text-positive' :
                          trade.side === 'sell' ? 'bg-negative/20 text-negative' :
                          trade.side === 'redeem' ? 'bg-accent/20 text-accent' :
                          'bg-purple-500/20 text-purple-400'
                        )}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-text-primary truncate max-w-[250px] block">{trade.marketTitle}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-text-secondary">{trade.outcome}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-mono text-text-primary">{formatNumber(trade.value)}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-mono text-text-secondary">{(trade.price * 100).toFixed(0)}%</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-mono text-text-primary">{formatCompactNumber(trade.shares)}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">No trades found</td>
                  </tr>
                )}
              </tbody>
            </table>
            {totalTradesPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-sm text-text-secondary">
                  Page {tradesPage} of {totalTradesPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTradesPage(p => Math.max(1, p - 1))}
                    disabled={tradesPage === 1}
                    className="px-3 py-1 text-sm rounded bg-surface-hover disabled:opacity-50 hover:bg-border transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setTradesPage(p => Math.min(totalTradesPages, p + 1))}
                    disabled={tradesPage === totalTradesPages}
                    className="px-3 py-1 text-sm rounded bg-surface-hover disabled:opacity-50 hover:bg-border transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transfers' && (
          <div>
            {/* Transfer Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-surface rounded-xl border border-border p-4">
                <p className="text-xs text-text-muted mb-1">Total Deposits</p>
                <p className="text-lg font-mono font-semibold text-positive">+{formatNumber(stats.totalDeposits)}</p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4">
                <p className="text-xs text-text-muted mb-1">Total Withdrawals</p>
                <p className="text-lg font-mono font-semibold text-negative">-{formatNumber(stats.totalWithdrawals)}</p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-4">
                <p className="text-xs text-text-muted mb-1">Net Amount</p>
                <p className={cn(
                  'text-lg font-mono font-semibold',
                  stats.netDeposits >= 0 ? 'text-positive' : 'text-negative'
                )}>
                  {stats.netDeposits >= 0 ? '+' : ''}{formatNumber(stats.netDeposits)}
                </p>
              </div>
            </div>

            {/* Transfers Table */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                    <th className="py-3 px-4 text-left font-medium">Time</th>
                    <th className="py-3 px-4 text-left font-medium">Type</th>
                    <th className="py-3 px-4 text-right font-medium">Amount</th>
                    <th className="py-3 px-4 text-right font-medium">Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.length > 0 ? (
                    transfers.map((tx) => (
                      <tr key={tx.id} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-sm text-text-secondary">
                            {new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded',
                            tx.type === 'deposit' ? 'bg-positive/20 text-positive' : 'bg-negative/20 text-negative'
                          )}>
                            {tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn(
                            'text-sm font-mono',
                            tx.type === 'deposit' ? 'text-positive' : 'text-negative'
                          )}>
                            {tx.type === 'deposit' ? '+' : '-'}{formatNumber(tx.amount)} {tx.tokenSymbol}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={getPolygonscanTxUrl(tx.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-accent hover:underline font-mono"
                          >
                            {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-text-muted">No transfers found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  isCurrency,
  suffix,
  colored,
  positive,
  negative,
}: {
  label: string;
  value: number;
  isCurrency?: boolean;
  suffix?: string;
  colored?: boolean;
  positive?: boolean;
  negative?: boolean;
}) {
  const formattedValue = isCurrency
    ? formatNumber(value)
    : `${formatCompactNumber(value)}${suffix || ''}`;

  const colorClass = colored
    ? value >= 0 ? 'text-positive' : 'text-negative'
    : positive
    ? 'text-positive'
    : negative
    ? 'text-negative'
    : 'text-text-primary';

  return (
    <div>
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className={cn('text-lg font-mono font-semibold', colorClass)}>{formattedValue}</p>
    </div>
  );
}

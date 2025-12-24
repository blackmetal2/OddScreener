'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { MarketDetail, MarketTrade, MarketHolder, NewsArticle } from '@/types/market';
import { fetchHolders, fetchMarketNews } from '@/app/actions/markets';
import { useMarketWebSocket } from '@/lib/hooks/useMarketWebSocket';
import {
  formatNumber,
  formatCompactNumber,
  formatChange,
  formatTimeUntil,
  getCategoryColor,
  getCategoryLabel,
  getPlatformColor,
  cn,
} from '@/lib/utils';
import VolumeFlowChart from '@/components/charts/VolumeFlowChart';
import { processTradesForVolumeChart } from '@/lib/utils/volumeAggregator';

interface WatchlistItem {
  id: string;
  name: string;
  platform: 'polymarket';
  addedAt: string;
}

interface Alert {
  id: string;
  marketId: string;
  marketName: string;
  platform: 'polymarket';
  condition: 'above' | 'below';
  threshold: number;
  createdAt: string;
  notificationsEnabled: boolean;
}

interface MarketDetailClientProps {
  market: MarketDetail;
  trades: MarketTrade[];
}

export default function MarketDetailClient({
  market,
  trades,
}: MarketDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'trades' | 'positions' | 'news'>('trades');
  const [chartTimeframe, setChartTimeframe] = useState<'1h' | '6h' | '24h' | '7d' | '30d' | 'all'>('24h');
  const [holders, setHolders] = useState<MarketHolder[]>([]);
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const isMulti = market.marketType === 'multi' && market.outcomes;

  // Volume chart data processed from trades
  const volumeChartData = useMemo(() => {
    return processTradesForVolumeChart(trades, chartTimeframe);
  }, [trades, chartTimeframe]);

  // Real-time market data state
  const [liveMarket, setLiveMarket] = useState<MarketDetail>(market);

  // WebSocket subscription for real-time updates
  const marketSubscriptions = useMemo(() => [{
    id: market.id,
    platform: market.platform,
  }], [market.id, market.platform]);

  const { updates } = useMarketWebSocket(marketSubscriptions, {
    enabled: false, // Disabled by default - WebSocket endpoints require authentication
  });

  // Apply WebSocket updates to market
  useEffect(() => {
    const update = updates.get(market.id);
    if (!update) return;

    setLiveMarket((prev) => ({
      ...prev,
      probability: update.probability ?? prev.probability,
      volume24h: update.volume24h ?? prev.volume24h,
      change24h: update.change24h ?? prev.change24h,
    }));
  }, [updates, market.id]);

  // Watch functionality
  const [isWatched, setIsWatched] = useState(false);

  // Alert functionality
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
  const [alertThreshold, setAlertThreshold] = useState(market.probability);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Check if market is in watchlist on mount
  useEffect(() => {
    const saved = localStorage.getItem('oddscreener-watchlist');
    if (saved) {
      const watchlist: WatchlistItem[] = JSON.parse(saved);
      setIsWatched(watchlist.some((item) => item.id === market.id));
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [market.id]);

  // Fetch holders when positions tab is active
  useEffect(() => {
    if (activeTab === 'positions' && holders.length === 0 && !holdersLoading) {
      setHoldersLoading(true);
      fetchHolders(market.id, market.platform)
        .then(setHolders)
        .finally(() => setHoldersLoading(false));
    }
  }, [activeTab, market.id, market.platform, holders.length, holdersLoading]);

  // Fetch news when news tab is active
  useEffect(() => {
    if (activeTab === 'news' && news.length === 0 && !newsLoading) {
      setNewsLoading(true);
      fetchMarketNews(market.name)
        .then(setNews)
        .finally(() => setNewsLoading(false));
    }
  }, [activeTab, market.name, news.length, newsLoading]);

  // Toggle watchlist
  const toggleWatchlist = () => {
    const saved = localStorage.getItem('oddscreener-watchlist');
    let watchlist: WatchlistItem[] = saved ? JSON.parse(saved) : [];

    if (isWatched) {
      watchlist = watchlist.filter((item) => item.id !== market.id);
    } else {
      watchlist.push({
        id: market.id,
        name: market.name,
        platform: market.platform,
        addedAt: new Date().toISOString(),
      });
    }

    localStorage.setItem('oddscreener-watchlist', JSON.stringify(watchlist));
    setIsWatched(!isWatched);
  };

  // Request notification permission
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission === 'granted';
  };

  // Create alert
  const createAlert = async () => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      alert('Please enable notifications to receive alerts. You can change this in your browser settings.');
      return;
    }

    const saved = localStorage.getItem('oddscreener-alerts');
    const alerts: Alert[] = saved ? JSON.parse(saved) : [];

    const newAlert: Alert = {
      id: `${market.id}-${Date.now()}`,
      marketId: market.id,
      marketName: market.name,
      platform: market.platform,
      condition: alertCondition,
      threshold: alertThreshold,
      createdAt: new Date().toISOString(),
      notificationsEnabled: true,
    };

    alerts.push(newAlert);
    localStorage.setItem('oddscreener-alerts', JSON.stringify(alerts));
    setShowAlertForm(false);

    // Show confirmation notification
    new Notification('Alert Created', {
      body: `You'll be notified when ${market.name} goes ${alertCondition} ${alertThreshold}%`,
      icon: '/favicon.ico',
    });
  };

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
          <h1 className="text-xl font-semibold text-text-primary flex-1">{market.name}</h1>
          <span className={cn('badge uppercase text-xs font-semibold', getPlatformColor(market.platform))}>
            {market.platform}
          </span>
          <span className={cn('badge', getCategoryColor(market.category))}>
            {getCategoryLabel(market.category)}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm">
          {/* Countdown timer / Status */}
          {(() => {
            const isEnded = new Date(market.endsAt) <= new Date();
            const timeStr = formatTimeUntil(market.endsAt);
            const isUrgent = timeStr.includes('h') || timeStr.includes('m');

            return (
              <>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isEnded ? (
                    <span className="text-text-muted">Market Ended</span>
                  ) : (
                    <span className={cn(isUrgent ? 'text-orange-400 font-medium' : 'text-text-secondary')}>
                      Closes in {timeStr}
                    </span>
                  )}
                </div>
                <span className="text-text-muted">•</span>
                <div className="flex items-center gap-1.5">
                  {isEnded ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-text-muted"></span>
                      </span>
                      <span className="text-text-muted">Closed</span>
                    </>
                  ) : (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-positive"></span>
                      </span>
                      <span className="text-positive">Active</span>
                    </>
                  )}
                </div>
              </>
            );
          })()}
          <span className="text-text-muted">•</span>
          <span className="text-text-secondary">{formatCompactNumber(market.uniqueTraders)} Positions</span>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Probability/Outcomes Section */}
          <div className="bg-surface rounded-xl border border-border p-6 mb-6">
            {/* Unified multi-bar display for all market types */}
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Outcomes</h2>
              <div className="space-y-3">
                {(() => {
                  // Generate outcomes array for binary markets if needed
                  const outcomes = isMulti && market.outcomes
                    ? market.outcomes
                    : [
                        {
                          id: 'yes',
                          name: market.outcomes?.[0]?.name || 'Yes',
                          probability: liveMarket.probability,
                          change24h: liveMarket.change24h,
                          change1h: market.change1h,
                          change6h: market.change6h,
                          volume24h: liveMarket.volume24h * 0.5
                        },
                        {
                          id: 'no',
                          name: market.outcomes?.[1]?.name || 'No',
                          probability: 100 - liveMarket.probability,
                          change24h: -liveMarket.change24h,
                          change1h: -market.change1h,
                          change6h: -market.change6h,
                          volume24h: liveMarket.volume24h * 0.5
                        }
                      ];

                  return outcomes.map((outcome, idx) => {
                    // Determine color based on outcome type
                    const isYesType = idx === 0 || outcome.name.toLowerCase() === 'yes';
                    const isNoType = outcome.name.toLowerCase() === 'no';
                    const barColor = isYesType ? 'bg-positive' : isNoType ? 'bg-negative' : 'bg-accent';
                    const textColor = isYesType ? 'text-positive' : isNoType ? 'text-negative' : 'text-accent';

                    return (
                      <div
                        key={outcome.id}
                        className="flex items-center gap-4 p-4 bg-background rounded-lg"
                      >
                        {/* Label */}
                        <span className={cn('font-semibold w-24 truncate', textColor)}>
                          {outcome.name}
                        </span>

                        {/* Progress Bar */}
                        <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', barColor)}
                            style={{ width: `${outcome.probability}%` }}
                          />
                        </div>

                        {/* Percentage */}
                        <span className="font-mono text-xl font-bold text-text-primary w-16 text-right">
                          {outcome.probability}%
                        </span>

                        {/* 24H Change */}
                        <span className={cn(
                          'font-mono text-sm w-20 text-right',
                          outcome.change24h >= 0 ? 'text-positive' : 'text-negative'
                        )}>
                          {formatChange(outcome.change24h)}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Volume Flow Chart */}
          <div className="bg-surface rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Volume Flow</h2>
              <div className="flex items-center gap-0.5 bg-background rounded-lg p-1 border border-border">
                {(['1h', '6h', '24h', '7d', '30d', 'all'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartTimeframe(t)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                      chartTimeframe === t
                        ? 'bg-accent text-background shadow-sm'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    )}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 min-h-[256px] w-full min-w-[200px]">
              <VolumeFlowChart
                chartData={volumeChartData.chartData}
                outcomeNames={volumeChartData.outcomeNames}
              />
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-surface rounded-xl border border-border">
            <div className="flex items-center gap-4 px-6 py-4 border-b border-border">
              <button
                onClick={() => setActiveTab('trades')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
                  activeTab === 'trades'
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                Trades
              </button>
              <button
                onClick={() => setActiveTab('positions')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
                  activeTab === 'positions'
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                Top Positions
              </button>
              <button
                onClick={() => setActiveTab('news')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
                  activeTab === 'news'
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                </svg>
                News
              </button>
            </div>

            {/* Trades Table */}
            {activeTab === 'trades' && (
              <div>
                {trades.length > 0 ? (
                  <>
                    {/* Sticky Header */}
                    <div className="border-b border-border">
                      <table className="w-full">
                        <thead>
                          <tr className="text-text-secondary text-xs uppercase tracking-wider">
                            <th className="py-3 px-4 text-left font-medium w-[180px]">User</th>
                            <th className="py-3 px-4 text-left font-medium w-[60px]">Side</th>
                            <th className="py-3 px-4 text-right font-medium">Amount</th>
                            <th className="py-3 px-4 text-right font-medium w-[80px]">Time</th>
                          </tr>
                        </thead>
                      </table>
                    </div>
                    {/* Scrollable Body */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      <table className="w-full">
                        <tbody>
                          {trades.map((trade) => (
                            <tr
                              key={trade.id}
                              onClick={() => router.push(`/trader/${trade.traderAddress}`)}
                              className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors cursor-pointer group"
                            >
                              <td className="py-3 px-4 w-[180px]">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent">
                                    {trade.trader.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-sm text-text-primary group-hover:text-accent transition-colors truncate max-w-[100px]">
                                    {trade.trader}
                                  </span>
                                  <TradeRankBadge amount={trade.amount} />
                                </div>
                              </td>
                              <td className="py-3 px-4 w-[60px]">
                                <span className={cn(
                                  'text-xs font-medium px-2 py-0.5 rounded',
                                  trade.type === 'buy' ? 'bg-positive/20 text-positive' : 'bg-negative/20 text-negative'
                                )}>
                                  {trade.type === 'buy' ? 'BUY' : 'SELL'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="text-sm font-mono text-text-primary">
                                    ${trade.amount >= 1000 ? `${(trade.amount / 1000).toFixed(1)}K` : trade.amount.toFixed(0)}
                                  </span>
                                  <span className={cn(
                                    'text-xs',
                                    trade.outcome === 'YES' || trade.outcome === 'Yes'
                                      ? 'text-positive'
                                      : 'text-negative'
                                  )}>
                                    {trade.outcome} @ {(trade.price * 100).toFixed(0)}¢
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right w-[80px]">
                                <span className="text-xs text-text-muted font-mono">
                                  {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-text-muted">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                    <p>No recent trades</p>
                    <p className="text-xs mt-1">Check back later for trading activity</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'positions' && (
              <div>
                {holdersLoading ? (
                  <div className="p-8 text-center text-text-muted">
                    <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-2" />
                    <p>Loading top holders...</p>
                  </div>
                ) : holders.length > 0 ? (
                  <>
                    {/* Sticky Header */}
                    <div className="border-b border-border">
                      <div className="px-4 py-3 flex items-center text-xs text-text-secondary font-medium uppercase tracking-wider">
                        <span className="w-8">#</span>
                        <span className="flex-1">Trader</span>
                        <span className="w-20 text-right">Position</span>
                        <span className="w-24 text-right">Shares</span>
                      </div>
                    </div>
                    {/* Scrollable Body */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {holders.slice(0, 20).map((holder, index) => (
                        <div
                          key={holder.wallet}
                          onClick={() => router.push(`/trader/${holder.wallet}`)}
                          className="px-4 py-3 flex items-center border-b border-border/50 hover:bg-surface-hover/50 transition-colors cursor-pointer group"
                        >
                          <span className="w-8 text-text-secondary text-sm">{index + 1}</span>
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            {holder.profileImage ? (
                              <img
                                src={holder.profileImage}
                                alt={holder.name}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs">
                                {holder.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate group-hover:text-accent transition-colors">{holder.name}</p>
                              {holder.bio && (
                                <p className="text-xs text-text-secondary truncate">{holder.bio}</p>
                              )}
                            </div>
                            {/* Arrow icon to indicate clickable */}
                            <svg className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </div>
                          <span
                            className={cn(
                              'w-20 text-right text-xs font-medium px-2 py-0.5 rounded',
                              holder.outcome === 'YES' || holder.outcome === 'Yes'
                                ? 'bg-green-500/20 text-green-400'
                                : holder.outcome === 'NO' || holder.outcome === 'No'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-accent/20 text-accent'
                            )}
                          >
                            {holder.outcome}
                          </span>
                          <span className="w-24 text-right text-sm font-mono">
                            {formatNumber(holder.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-text-muted">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <p>No holder data available</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'news' && (
              <div>
                {newsLoading ? (
                  <div className="p-8 text-center text-text-muted">
                    <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-2" />
                    <p>Loading related news...</p>
                  </div>
                ) : news.length > 0 ? (
                  <>
                    {/* Sticky Header */}
                    <div className="border-b border-border">
                      <div className="px-4 py-3 flex items-center text-xs text-text-secondary font-medium uppercase tracking-wider">
                        <span className="flex-1">Article</span>
                        <span className="w-24 text-right">Source</span>
                        <span className="w-28 text-right">Date</span>
                      </div>
                    </div>
                    {/* Scrollable Body */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {news.map((article, idx) => (
                        <a
                          key={idx}
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-3 border-b border-border/50 hover:bg-surface-hover/50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-primary font-medium truncate group-hover:text-accent transition-colors">{article.title}</p>
                            </div>
                            <span className="w-24 text-right text-xs text-accent truncate">{article.source}</span>
                            <span className="w-28 text-right text-xs text-text-muted font-mono">
                              {new Date(article.pubDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <svg className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </div>
                        </a>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-text-muted">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                    </svg>
                    <p>No related news found</p>
                    <p className="text-xs mt-1">Try checking back later for updates</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l border-border p-6 space-y-6">
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-xl border border-border p-3">
              <div className="text-xs text-text-muted mb-1">24H Volume</div>
              <div className="font-mono text-lg font-semibold text-text-primary">{formatNumber(liveMarket.volume24h)}</div>
            </div>
            <div className="bg-surface rounded-xl border border-border p-3">
              <div className="text-xs text-text-muted mb-1">Open Interest</div>
              <div className="font-mono text-lg font-semibold text-text-primary">{formatNumber(market.openInterest)}</div>
            </div>
            <div className="bg-surface rounded-xl border border-border p-3">
              <div className="text-xs text-text-muted mb-1">All-Time High</div>
              <div className="font-mono text-lg font-semibold text-positive">{market.allTimeHigh}%</div>
            </div>
            <div className="bg-surface rounded-xl border border-border p-3">
              <div className="text-xs text-text-muted mb-1">All-Time Low</div>
              <div className="font-mono text-lg font-semibold text-negative">{market.allTimeLow}%</div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Market Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary text-sm">Total Volume</span>
                <span className="font-mono text-sm text-text-primary">{formatNumber(market.totalVolume)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary text-sm">Liquidity</span>
                <span className="font-mono text-sm text-text-primary">{formatNumber(market.liquidityDepth)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary text-sm">Unique Traders</span>
                <span className="font-mono text-sm text-text-primary">{formatCompactNumber(market.uniqueTraders)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary text-sm">1H Change</span>
                <span className={cn('font-mono text-sm', market.change1h >= 0 ? 'text-positive' : 'text-negative')}>
                  {formatChange(market.change1h)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary text-sm">6H Change</span>
                <span className={cn('font-mono text-sm', market.change6h >= 0 ? 'text-positive' : 'text-negative')}>
                  {formatChange(market.change6h)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary text-sm">24H Change</span>
                <span className={cn('font-mono text-sm', liveMarket.change24h >= 0 ? 'text-positive' : 'text-negative')}>
                  {formatChange(liveMarket.change24h)}
                </span>
              </div>
            </div>
          </div>

          {/* Resolution Info */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Resolution</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-text-muted mb-1">Source</div>
                <div className="text-text-primary">{market.resolutionSource}</div>
              </div>
              {market.rules && (
                <div>
                  <div className="text-text-muted mb-1">Rules</div>
                  <div className="text-text-primary text-xs line-clamp-4">{market.rules}</div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <a
              href={market.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-background font-medium rounded-lg hover:bg-accent-hover transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Trade on Polymarket
            </a>
            <div className="flex gap-2">
              <button
                onClick={toggleWatchlist}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  isWatched
                    ? 'bg-accent/20 border border-accent text-accent'
                    : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-border-light'
                )}
              >
                <svg
                  className="w-4 h-4"
                  fill={isWatched ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                {isWatched ? 'Watching' : 'Watch'}
              </button>
              <button
                onClick={() => setShowAlertForm(!showAlertForm)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  showAlertForm
                    ? 'bg-accent/20 border border-accent text-accent'
                    : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-border-light'
                )}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                Alert
              </button>
            </div>

            {/* Alert Creation Form */}
            {showAlertForm && (
              <div className="bg-surface rounded-xl border border-border p-4 mt-2 animate-fade-in">
                <h4 className="text-sm font-medium text-text-primary mb-3">Create Price Alert</h4>

                <div className="space-y-3">
                  {/* Condition selector */}
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Alert when price goes</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAlertCondition('above')}
                        className={cn(
                          'flex-1 px-3 py-2 text-sm rounded-lg transition-colors',
                          alertCondition === 'above'
                            ? 'bg-positive/20 text-positive border border-positive'
                            : 'bg-background text-text-secondary border border-border hover:border-border-light'
                        )}
                      >
                        Above
                      </button>
                      <button
                        onClick={() => setAlertCondition('below')}
                        className={cn(
                          'flex-1 px-3 py-2 text-sm rounded-lg transition-colors',
                          alertCondition === 'below'
                            ? 'bg-negative/20 text-negative border border-negative'
                            : 'bg-background text-text-secondary border border-border hover:border-border-light'
                        )}
                      >
                        Below
                      </button>
                    </div>
                  </div>

                  {/* Threshold input */}
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Threshold percentage</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={alertThreshold}
                        onChange={(e) => setAlertThreshold(Math.min(99, Math.max(1, parseInt(e.target.value) || 50)))}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-text-primary font-mono text-sm focus:outline-none focus:border-accent"
                      />
                      <span className="text-text-secondary">%</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      Current: {liveMarket.probability}%
                    </p>
                  </div>

                  {/* Notification permission status */}
                  {notificationPermission !== 'granted' && (
                    <p className="text-xs text-orange-400">
                      Notifications are not enabled. You'll be prompted to allow them.
                    </p>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={createAlert}
                    className="w-full px-4 py-2 bg-accent text-background font-medium rounded-lg hover:bg-accent-hover transition-colors"
                  >
                    Create Alert
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Trader Rank Badge Component
function TradeRankBadge({ amount }: { amount: number }) {
  const getRank = (value: number) => {
    if (value >= 250000) return { icon: '🦑', label: 'Kraken', color: 'text-purple-400 bg-purple-500/20' };
    if (value >= 50000) return { icon: '🐋', label: 'Whale', color: 'text-blue-400 bg-blue-500/20' };
    if (value >= 10000) return { icon: '🦈', label: 'Shark', color: 'text-cyan-400 bg-cyan-500/20' };
    if (value >= 1000) return { icon: '🐬', label: 'Dolphin', color: 'text-teal-400 bg-teal-500/20' };
    if (value >= 100) return { icon: '🐟', label: 'Fish', color: 'text-green-400 bg-green-500/20' };
    return { icon: '🦐', label: 'Plankton', color: 'text-gray-400 bg-gray-500/20' };
  };

  const rank = getRank(amount);

  return (
    <span
      className={cn('text-xs px-1.5 py-0.5 rounded flex-shrink-0', rank.color)}
      title={`${rank.label} (${amount >= 1000 ? `$${(amount / 1000).toFixed(0)}K` : `$${amount.toFixed(0)}`})`}
    >
      {rank.icon}
    </span>
  );
}

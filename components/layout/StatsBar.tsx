'use client';

import { useState, useEffect } from 'react';
import { formatNumber, formatCompactNumber } from '@/lib/utils';
import { GlobalStats } from '@/types/market';

interface StatsBarProps {
  stats: GlobalStats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeAgo, setTimeAgo] = useState('');

  // Set initial timestamp when stats change
  useEffect(() => {
    setLastUpdated(new Date());
  }, [stats.totalVolume24h, stats.activeMarkets]);

  // Update "time ago" every 10 seconds
  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastUpdated) return;
      const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (seconds < 60) {
        setTimeAgo('just now');
      } else if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        setTimeAgo(`${mins}m ago`);
      } else {
        const hours = Math.floor(seconds / 3600);
        setTimeAgo(`${hours}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="flex flex-wrap items-center gap-4 md:gap-8 px-4 md:px-6 py-3 bg-surface/50 border-b border-border">
      {/* Stats */}
      <div className="flex items-center gap-4 md:gap-8 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-xs md:text-sm">24H VOL:</span>
          <span className="font-mono text-base md:text-xl font-semibold text-text-primary">
            {formatNumber(stats.totalVolume24h)}
          </span>
        </div>

        <div className="hidden md:block w-px h-6 bg-border" />

        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-xs md:text-sm">24H POSITIONS:</span>
          <span className="font-mono text-base md:text-xl font-semibold text-text-primary">
            {stats.openPositions24h > 0 ? formatCompactNumber(stats.openPositions24h) : 'N/A'}
          </span>
        </div>

        <div className="hidden md:block w-px h-6 bg-border" />

        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-xs md:text-sm">MARKETS:</span>
          <span className="font-mono text-base md:text-xl font-semibold text-text-primary">
            {stats.activeMarkets}
          </span>
        </div>
      </div>

      {/* Live indicator with timestamp */}
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-positive"></span>
          </span>
          <span className="text-xs text-text-muted">LIVE</span>
        </div>
        {timeAgo && (
          <>
            <div className="w-px h-4 bg-border hidden md:block" />
            <span className="text-xs text-text-muted hidden md:inline">Updated {timeAgo}</span>
          </>
        )}
      </div>
    </div>
  );
}

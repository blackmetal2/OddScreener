'use client';

import { formatNumber, formatCompactNumber } from '@/lib/utils';
import { GlobalStats } from '@/types/market';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';

interface StatsBarProps {
  stats: GlobalStats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const { login, authenticated, user, logout } = usePrivy();

  // Get display name or truncated address
  const getDisplayName = () => {
    if (!user) return '';
    if (user.email?.address) return user.email.address.split('@')[0];
    if (user.google?.name) return user.google.name.split(' ')[0];
    if (user.twitter?.username) return `@${user.twitter.username}`;
    if (user.wallet?.address) {
      const addr = user.wallet.address;
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    return 'User';
  };

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

      {/* Login/User section */}
      <div className="ml-auto flex items-center gap-3">
        {authenticated ? (
          <div className="flex items-center gap-3">
            <Link
              href={user?.wallet?.address ? `/trader/${user.wallet.address}` : '#'}
              className="text-sm text-text-primary hover:text-accent transition-colors"
            >
              {getDisplayName()}
            </Link>
            <button
              onClick={logout}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="px-4 py-1.5 text-sm font-medium rounded-lg transition-colors"
            style={{ backgroundColor: '#00D4AA', color: '#0a0a0a' }}
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';
import { Category, Platform } from '@/types/market';

interface FilterBarProps {
  timeframe: string;
  setTimeframe: (t: string) => void;
  platform: Platform | 'all';
  setPlatform: (p: Platform | 'all') => void;
  category: Category | 'all';
  setCategory: (c: Category | 'all') => void;
  onOpenFilters?: () => void;
  hasActiveFilters?: boolean;
}

export default function FilterBar({
  timeframe,
  setTimeframe,
  platform,
  setPlatform,
  category,
  setCategory,
  onOpenFilters,
  hasActiveFilters,
}: FilterBarProps) {
  const timeframes = [
    { value: 'trending', label: 'Trending', icon: '🔥' },
    { value: '1h', label: '1H' },
    { value: '6h', label: '6H' },
    { value: '24h', label: '24H' },
  ];

  const platforms: { value: Platform | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'polymarket', label: 'Polymarket' },
  ];

  const categories: { value: Category | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'politics', label: 'Politics' },
    { value: 'sports', label: 'Sports' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'finance', label: 'Finance' },
    { value: 'world', label: 'World' },
    { value: 'tech', label: 'Tech' },
    { value: 'culture', label: 'Culture' },
  ];

  return (
    <div className="flex flex-col gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-border">
      {/* Top row: Timeframe and Platform */}
      <div className="flex items-center gap-2 md:gap-4 flex-wrap">
        {/* Timeframe pills */}
        <div className="flex items-center gap-1 bg-surface rounded-full p-1">
          {timeframes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTimeframe(t.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200',
                timeframe === t.value
                  ? 'bg-accent text-background shadow-sm shadow-accent/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )}
            >
              {t.icon && <span className="mr-1">{t.icon}</span>}
              {t.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-border hidden md:block" />

        {/* Platform pills */}
        <div className="flex items-center gap-1">
          {platforms.map((p) => (
            <button
              key={p.value}
              onClick={() => setPlatform(p.value)}
              className={cn(
                'px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-200',
                platform === p.value
                  ? p.value === 'polymarket'
                    ? 'bg-polymarket-bg text-polymarket'
                    : 'bg-accent/20 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )}
            >
              {p.value !== 'all' && (
                <span
                  className={cn(
                    'inline-block w-1.5 md:w-2 h-1.5 md:h-2 rounded-full mr-1 md:mr-2',
                    'bg-polymarket'
                  )}
                />
              )}
              <span className="hidden sm:inline">{p.label}</span>
              <span className="sm:hidden">{p.value === 'all' ? 'All' : p.value === 'polymarket' ? 'Poly' : 'Kal'}</span>
            </button>
          ))}
        </div>

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <div className="hidden md:flex items-center gap-2 text-text-secondary text-sm">
            <span>Rank by:</span>
            <select className="bg-surface border border-border rounded-lg px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:border-accent/50">
              <option value="volume">Volume 24H</option>
              <option value="change">% Change</option>
              <option value="probability">Probability</option>
              <option value="ending">Ending Soon</option>
            </select>
          </div>

          <button
            onClick={onOpenFilters}
            className={cn(
              'flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 text-sm rounded-lg transition-colors',
              hasActiveFilters
                ? 'bg-accent/20 text-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-accent" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom row: Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={cn(
              'px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all duration-200 border',
              category === c.value
                ? 'bg-accent/20 text-accent border-accent/30 font-medium'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover/50'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

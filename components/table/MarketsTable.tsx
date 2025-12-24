'use client';

import { useRouter } from 'next/navigation';
import { Market } from '@/types/market';
import { PlatformIcon } from '@/components/icons/PlatformIcons';
import CategoryBadge from '@/components/ui/CategoryBadge';
import {
  formatNumber,
  formatChange,
  formatTimeUntil,
  formatFullDate,
  cn,
} from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';
import { StackedProgressBar } from './StackedProgressBar';

export type SortColumn = 'probability' | 'change1h' | 'change6h' | 'change24h' | 'volume' | 'ends';
export type SortDirection = 'asc' | 'desc';

interface MarketsTableProps {
  markets: Market[];
  sortColumn?: SortColumn;
  sortDirection?: SortDirection;
  onSort?: (column: SortColumn) => void;
  startIndex?: number; // For pagination - first row number offset
}

// Sort indicator icon
function SortIndicator({ direction, active }: { direction?: SortDirection; active?: boolean }) {
  return (
    <span className={cn('ml-1 inline-flex', active ? 'text-accent' : 'text-text-muted opacity-0 group-hover:opacity-50')}>
      {direction === 'asc' ? '↑' : '↓'}
    </span>
  );
}

// Sortable column header
function SortableHeader({
  children,
  column,
  currentColumn,
  direction,
  onSort,
  align = 'right',
  width,
}: {
  children: React.ReactNode;
  column: SortColumn;
  currentColumn?: SortColumn;
  direction?: SortDirection;
  onSort?: (column: SortColumn) => void;
  align?: 'left' | 'right';
  width?: string;
}) {
  const isActive = currentColumn === column;
  return (
    <th
      onClick={() => onSort?.(column)}
      className={cn(
        'py-3 px-2 font-medium cursor-pointer hover:text-text-primary transition-colors group select-none',
        align === 'left' ? 'text-left' : 'text-right',
        isActive ? 'text-accent' : 'text-text-secondary',
        width
      )}
    >
      <span className="inline-flex items-center justify-end">
        {align === 'right' && <SortIndicator direction={direction} active={isActive} />}
        {children}
        {align === 'left' && <SortIndicator direction={direction} active={isActive} />}
      </span>
    </th>
  );
}

function ChangeCell({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={cn(
        'font-mono text-sm',
        isPositive ? 'text-positive' : 'text-negative'
      )}
    >
      {formatChange(value)}
    </span>
  );
}

// Get color class for ENDS column based on urgency
function getEndsColor(endsAt: Date): string {
  const now = new Date();
  const endDate = new Date(endsAt);
  const hoursRemaining = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursRemaining <= 0) return 'text-text-muted';      // Ended
  if (hoursRemaining < 1) return 'text-red-500';          // < 1 hour
  if (hoursRemaining < 24) return 'text-orange-400';      // < 24 hours
  if (hoursRemaining < 168) return 'text-yellow-500';     // < 7 days (168 hours)
  return 'text-green-500';                                 // > 7 days
}


export default function MarketsTable({ markets, sortColumn, sortDirection, onSort, startIndex = 0 }: MarketsTableProps) {
  const router = useRouter();

  const handleRowClick = (marketId: string, platform: string) => {
    // Encode platform in URL: platform-id
    router.push(`/market/${platform}-${encodeURIComponent(marketId)}`);
  };

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="text-xs uppercase tracking-wider border-b border-border">
            <th className="py-3 px-2 text-left font-medium w-[4%] text-text-secondary">#</th>
            <th className="py-3 px-2 text-left font-medium w-[32%] text-text-secondary">Market</th>
            <th className="py-3 px-2 text-left font-medium w-[10%] text-text-secondary">Category</th>
            <SortableHeader column="probability" currentColumn={sortColumn} direction={sortDirection} onSort={onSort} width="w-[9%]">
              Prob
            </SortableHeader>
            <SortableHeader column="change1h" currentColumn={sortColumn} direction={sortDirection} onSort={onSort} width="w-[8%]">
              1H
            </SortableHeader>
            <SortableHeader column="change6h" currentColumn={sortColumn} direction={sortDirection} onSort={onSort} width="w-[8%]">
              6H
            </SortableHeader>
            <SortableHeader column="change24h" currentColumn={sortColumn} direction={sortDirection} onSort={onSort} width="w-[8%]">
              24H
            </SortableHeader>
            <SortableHeader column="volume" currentColumn={sortColumn} direction={sortDirection} onSort={onSort} width="w-[11%]">
              Volume
            </SortableHeader>
            <SortableHeader column="ends" currentColumn={sortColumn} direction={sortDirection} onSort={onSort} width="w-[10%]">
              Ends
            </SortableHeader>
          </tr>
        </thead>
        <tbody>
          {markets.map((market, index) => (
            <tr
              key={market.id}
              onClick={() => handleRowClick(market.id, market.platform)}
              className="table-row-hover border-b border-border/50 cursor-pointer group"
            >
              {/* Row number */}
              <td className="py-3 px-2 text-text-muted text-sm font-mono">
                {startIndex + index + 1}
              </td>

              {/* Market name */}
              <td className="py-3 px-2">
                <div className="flex items-center gap-1.5">
                  {/* Platform icon - left of market image */}
                  <PlatformIcon platform={market.platform} size={16} className="shrink-0" />

                  {/* Market image or category icon */}
                  {market.imageUrl ? (
                    <img
                      src={market.imageUrl}
                      alt=""
                      className="w-6 h-6 rounded object-cover shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={cn(
                    "w-6 h-6 rounded bg-surface-hover flex items-center justify-center text-sm shrink-0",
                    market.imageUrl && "hidden"
                  )}>
                    {market.category === 'politics' && '🏛️'}
                    {market.category === 'sports' && '⚽'}
                    {market.category === 'crypto' && '₿'}
                    {market.category === 'finance' && '📈'}
                    {market.category === 'world' && '🌍'}
                    {market.category === 'culture' && '🎬'}
                    {market.category === 'tech' && '💻'}
                    {market.category === 'science' && '🔬'}
                  </div>

                  {/* Market name and badges */}
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="text-text-primary font-medium text-sm truncate group-hover:text-accent transition-colors">
                      {market.name}
                    </span>
                    {market.isHot && (
                      <span className="text-[10px] px-1 py-0.5 bg-orange-500/20 text-orange-400 rounded shrink-0">
                        HOT
                      </span>
                    )}
                    {market.marketType === 'multi' && (
                      <span className="text-[10px] px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded shrink-0">
                        {market.outcomes?.length}
                      </span>
                    )}
                  </div>
                </div>
              </td>

              {/* Category */}
              <td className="py-3 px-2">
                <CategoryBadge category={market.category} />
              </td>

              {/* Probability */}
              <td className="py-3 px-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <StackedProgressBar market={market} />
                  <span className={cn(
                    'font-mono text-sm font-semibold w-10 text-right',
                    market.probability >= 70 ? 'text-positive' :
                    market.probability >= 40 ? 'text-text-primary' :
                    'text-orange-400'
                  )}>
                    {market.probability}%
                  </span>
                </div>
              </td>

              {/* 1H Change */}
              <td className="py-3 px-2 text-right">
                <ChangeCell value={market.change1h} />
              </td>

              {/* 6H Change */}
              <td className="py-3 px-2 text-right">
                <ChangeCell value={market.change6h} />
              </td>

              {/* 24H Change */}
              <td className="py-3 px-2 text-right">
                <ChangeCell value={market.change24h} />
              </td>

              {/* Volume */}
              <td className="py-3 px-2 text-right">
                <span className="font-mono text-sm text-text-primary">
                  {formatNumber(market.volume24h)}
                </span>
              </td>

              {/* Ends */}
              <td className="py-3 px-2 text-right">
                <Tooltip content={formatFullDate(market.endsAt)} position="left">
                  <span
                    className={cn(
                      'font-mono text-sm cursor-help',
                      getEndsColor(market.endsAt)
                    )}
                  >
                    {formatTimeUntil(market.endsAt)}
                  </span>
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

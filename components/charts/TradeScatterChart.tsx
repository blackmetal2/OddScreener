'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { formatCompactNumber } from '@/lib/utils';
import { MarketTrade } from '@/types/market';
import { VolumeMetric, TIMEFRAME_CONFIGS } from '@/lib/utils/volumeAggregator';

// Color palette for outcomes
const OUTCOME_COLORS: { [key: string]: string } = {
  YES: '#22c55e',
  Yes: '#22c55e',
  NO: '#ef4444',
  No: '#ef4444',
};

const DEFAULT_COLORS = [
  '#22c55e', // green
  '#ef4444', // red
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#ec4899', // pink
];

// Whale threshold
const WHALE_THRESHOLD = 5000;
const MAX_TRADES = 500;

interface TradeScatterChartProps {
  trades: MarketTrade[];
  metric: VolumeMetric;
  timeframe: string;
  onTradeClick?: (tradeId: string) => void;
  isOverlay?: boolean;
}

interface ScatterDataPoint {
  id: string;
  x: number; // timestamp
  y: number; // amount or shares
  outcome: string;
  amount: number;
  shares: number;
  price: number;
  trader: string;
  traderAddress: string;
  timestamp: Date;
  isWhale: boolean;
  radius: number;
}

function getOutcomeColor(name: string): string {
  if (OUTCOME_COLORS[name]) return OUTCOME_COLORS[name];
  const normalized = name.toLowerCase();
  if (normalized === 'yes' || normalized === 'y') return '#22c55e';
  if (normalized === 'no' || normalized === 'n') return '#ef4444';
  // Generate consistent color for other outcomes
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEFAULT_COLORS[hash % DEFAULT_COLORS.length];
}

// Logarithmic dot sizing
function getDotRadius(value: number): number {
  if (value < 100) return 4;
  if (value < 500) return 6;
  if (value < 1000) return 8;
  if (value < 5000) return 10;
  if (value < 10000) return 14;
  return 18;
}

function formatTime(timestamp: number, isShortPeriod: boolean): string {
  const date = new Date(timestamp);
  if (isShortPeriod) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Custom Tooltip Component
function CustomTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ payload: ScatterDataPoint }>;
  metric: VolumeMetric;
}) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  const color = getOutcomeColor(data.outcome);

  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium text-text-primary">{data.outcome}</span>
        {data.isWhale && (
          <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
            🐋 WHALE
          </span>
        )}
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-text-muted">Volume:</span>
          <span className="font-mono text-text-primary">${formatCompactNumber(data.amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Shares:</span>
          <span className="font-mono text-text-primary">{formatCompactNumber(data.shares)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Price:</span>
          <span className="font-mono text-text-primary">{Math.round(data.price * 100)}¢</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Time:</span>
          <span className="font-mono text-text-primary">
            {data.timestamp.toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="flex justify-between pt-1 border-t border-border/50">
          <span className="text-text-muted">Trader:</span>
          <span className="font-mono text-text-secondary">
            {data.traderAddress.slice(0, 6)}...{data.traderAddress.slice(-4)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Custom dot shape with whale glow
function CustomDot(props: {
  cx: number;
  cy: number;
  payload: ScatterDataPoint;
  onClick?: (id: string) => void;
}) {
  const { cx, cy, payload, onClick } = props;
  const color = getOutcomeColor(payload.outcome);
  const isWhale = payload.isWhale;

  return (
    <g
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={() => onClick?.(payload.id)}
    >
      {/* Whale glow effect */}
      {isWhale && (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={payload.radius + 8}
            fill={color}
            opacity={0.15}
            className="animate-pulse"
          />
          <circle
            cx={cx}
            cy={cy}
            r={payload.radius + 4}
            fill={color}
            opacity={0.25}
          />
        </>
      )}
      {/* Main dot */}
      <circle
        cx={cx}
        cy={cy}
        r={payload.radius}
        fill={color}
        opacity={0.8}
        stroke={isWhale ? '#fbbf24' : color}
        strokeWidth={isWhale ? 2 : 1}
      />
    </g>
  );
}

export default function TradeScatterChart({
  trades,
  metric,
  timeframe,
  onTradeClick,
  isOverlay = false,
}: TradeScatterChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter and prepare scatter data
  const scatterData = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const config = TIMEFRAME_CONFIGS[timeframe] || TIMEFRAME_CONFIGS['24h'];
    const now = Date.now();

    // Filter by timeframe
    const filteredTrades = trades.filter((t) => {
      const tradeTime = new Date(t.timestamp).getTime();
      return now - tradeTime <= config.lookbackMs;
    });

    // Limit to most recent trades and sort by size (smaller first for z-index)
    const limitedTrades = filteredTrades
      .slice(0, MAX_TRADES)
      .sort((a, b) => a.amount - b.amount);

    // Transform to scatter data points
    return limitedTrades.map((trade): ScatterDataPoint => {
      const value = metric === 'shares' ? trade.shares : trade.amount;
      return {
        id: trade.id,
        x: new Date(trade.timestamp).getTime(),
        y: value,
        outcome: trade.outcome,
        amount: trade.amount,
        shares: trade.shares,
        price: trade.price,
        trader: trade.trader,
        traderAddress: trade.traderAddress,
        timestamp: new Date(trade.timestamp),
        isWhale: trade.amount >= WHALE_THRESHOLD,
        radius: getDotRadius(trade.amount),
      };
    });
  }, [trades, timeframe, metric]);

  // Determine if this is a short time period (< 24h of data)
  const isShortPeriod = useMemo(() => {
    if (scatterData.length < 2) return true;
    const timestamps = scatterData.map((d) => d.x);
    const timeRange = Math.max(...timestamps) - Math.min(...timestamps);
    return timeRange < 24 * 60 * 60 * 1000;
  }, [scatterData]);

  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    if (scatterData.length === 0) return [0, 1000];
    const values = scatterData.map((d) => d.y);
    const maxValue = Math.max(...values, 100);
    return [0, Math.ceil(maxValue * 1.2)];
  }, [scatterData]);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center text-text-muted">
        <div className="animate-pulse">Loading chart...</div>
      </div>
    );
  }

  if (scatterData.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
        <svg
          className="w-10 h-10 mb-2 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
        <p className="text-sm">No trade data available</p>
        <p className="text-xs mt-1">Need more trades to display scatter plot</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <XAxis
          dataKey="x"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(ts) => formatTime(ts, isShortPeriod)}
          stroke="#4a4b55"
          tick={{ fill: '#8a8b95', fontSize: 10 }}
          axisLine={{ stroke: '#2a2b35' }}
          tickLine={{ stroke: '#2a2b35' }}
          minTickGap={40}
        />

        <YAxis
          dataKey="y"
          type="number"
          domain={yDomain}
          tickFormatter={(v) =>
            metric === 'shares' ? formatCompactNumber(v) : `$${formatCompactNumber(v)}`
          }
          stroke="#4a4b55"
          tick={{ fill: '#8a8b95', fontSize: 10 }}
          axisLine={{ stroke: '#2a2b35' }}
          tickLine={{ stroke: '#2a2b35' }}
          width={55}
        />

        {/* Reference line for whale threshold */}
        {metric === 'usd' && (
          <ReferenceLine
            y={WHALE_THRESHOLD}
            stroke="#fbbf24"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
        )}

        <Tooltip
          content={<CustomTooltip metric={metric} />}
          cursor={{ strokeDasharray: '3 3', stroke: '#4a4b55' }}
        />

        <Scatter
          data={scatterData}
          shape={(props: unknown) => {
            const typedProps = props as { cx: number; cy: number; payload: ScatterDataPoint };
            return <CustomDot {...typedProps} onClick={onTradeClick} />;
          }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

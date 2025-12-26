'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TraderTrade } from '@/types/market';
import { formatNumber } from '@/lib/utils';

interface PnLChartProps {
  trades: TraderTrade[];
}

interface PnLDataPoint {
  date: string;
  displayDate: string;
  dailyPnL: number;
  cumulative: number;
}

export default function PnLChart({ trades }: PnLChartProps) {
  const pnlData = useMemo(() => {
    if (trades.length === 0) return [];

    const dailyMap = new Map<string, number>();

    // Calculate daily P&L from trades
    // Buy = spending money (negative), Sell/Redeem = receiving money (positive)
    trades.forEach((trade) => {
      const date = trade.timestamp.toISOString().split('T')[0];
      const impact =
        trade.side === 'buy'
          ? -trade.value
          : trade.side === 'sell' || trade.side === 'redeem'
          ? trade.value
          : 0;
      dailyMap.set(date, (dailyMap.get(date) || 0) + impact);
    });

    // Sort by date and compute cumulative
    let cumulative = 0;
    const data: PnLDataPoint[] = [...dailyMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, daily]) => {
        cumulative += daily;
        const d = new Date(date);
        return {
          date,
          displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dailyPnL: daily,
          cumulative,
        };
      });

    return data;
  }, [trades]);

  if (pnlData.length < 2) {
    return (
      <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">
        Not enough trade data to display chart
      </div>
    );
  }

  const isPositive = pnlData[pnlData.length - 1]?.cumulative >= 0;
  const minValue = Math.min(...pnlData.map((d) => d.cumulative));
  const maxValue = Math.max(...pnlData.map((d) => d.cumulative));

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pnlData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlGradientPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pnlGradientNegative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${formatNumber(value)}`}
            domain={[minValue < 0 ? minValue * 1.1 : 0, maxValue * 1.1]}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value, name) => [
              `$${formatNumber(typeof value === 'number' ? value : 0)}`,
              name === 'cumulative' ? 'Total P&L' : 'Daily P&L',
            ]}
          />
          <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke={isPositive ? '#22c55e' : '#ef4444'}
            strokeWidth={2}
            fill={isPositive ? 'url(#pnlGradientPositive)' : 'url(#pnlGradientNegative)'}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

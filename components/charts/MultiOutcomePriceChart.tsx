'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { MultiOutcomePricePoint } from '@/types/market';

// Colors for up to 10 outcomes
const OUTCOME_COLORS = [
  '#22c55e', // green (leading)
  '#3b82f6', // blue
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

interface MultiOutcomePriceChartProps {
  data: MultiOutcomePricePoint[];
  loading?: boolean;
}

export default function MultiOutcomePriceChart({ data, loading }: MultiOutcomePriceChartProps) {
  // Prevent SSR/hydration mismatch by only rendering chart on client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get all unique outcome names
  const outcomeNames = useMemo(() => {
    if (!data || data.length === 0) return [];
    const names = new Set<string>();
    for (const point of data) {
      Object.keys(point.outcomes).forEach((name) => names.add(name));
    }
    return Array.from(names);
  }, [data]);

  // Transform data for Recharts (flatten outcomes into separate keys)
  const chartData = useMemo(() => {
    return data.map((point) => ({
      timestamp: new Date(point.timestamp).getTime(),
      ...point.outcomes,
    }));
  }, [data]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - timestamp) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltipTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    // Sort by value descending
    const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));

    return (
      <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
        <p className="text-text-muted text-xs mb-2">{formatTooltipTime(label)}</p>
        <div className="space-y-1">
          {sortedPayload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-text-primary text-sm truncate max-w-[120px]">
                  {entry.name}
                </span>
              </div>
              <span className="font-mono text-sm text-text-primary">
                {(entry.value || 0).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    if (!payload) return null;

    // Get latest values for each outcome
    const latestPoint = chartData[chartData.length - 1] as Record<string, number> | undefined;

    // Sort by latest value descending
    const sortedPayload = [...payload].sort((a: any, b: any) => {
      const aVal = (latestPoint?.[a.value as string] as number) || 0;
      const bVal = (latestPoint?.[b.value as string] as number) || 0;
      return bVal - aVal;
    });

    return (
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {sortedPayload.map((entry: any, index: number) => {
          const latestValue = (latestPoint?.[entry.value as string] as number) || 0;
          return (
            <div key={index} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-text-secondary truncate max-w-[100px]">
                {entry.value}
              </span>
              <span className="font-mono text-text-primary">
                {latestValue.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Show loading spinner while mounting or loading
  if (!isMounted || loading) {
    return (
      <div className="w-full h-full min-h-[256px] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
        <svg className="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <p className="text-sm">No price data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTime}
          stroke="#4b5563"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#1e2029' }}
          minTickGap={50}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          stroke="#4b5563"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
        <ReferenceLine y={50} stroke="#1e2029" strokeDasharray="3 3" />

        {outcomeNames.map((name, index) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={OUTCOME_COLORS[index % OUTCOME_COLORS.length]}
            strokeWidth={2}
            dot={false}
            animationDuration={500}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCompactNumber } from '@/lib/utils';
import { VolumeMetric } from '@/lib/utils/volumeAggregator';

// Color palette for outcomes
const OUTCOME_COLORS: { [key: string]: string } = {
  YES: '#22c55e',   // green
  Yes: '#22c55e',
  NO: '#ef4444',    // red
  No: '#ef4444',
};

const DEFAULT_COLORS = [
  '#22c55e', // green (first/YES)
  '#ef4444', // red (second/NO)
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

interface VolumeFlowChartProps {
  chartData: Array<{ timestamp: number; [outcome: string]: number }>;
  outcomeNames: string[];
  loading?: boolean;
  metric?: VolumeMetric;
}

function getOutcomeColor(name: string, index: number): string {
  // Check for predefined colors
  if (OUTCOME_COLORS[name]) return OUTCOME_COLORS[name];
  // Use default palette
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

// Sanitize outcome name for use in gradient IDs
function sanitizeId(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
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
  label,
  outcomeNames,
  metric = 'usd',
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
  outcomeNames: string[];
  metric?: VolumeMetric;
}) {
  if (!active || !payload || !label) return null;

  const formatValue = (value: number) => {
    if (metric === 'shares') {
      return formatCompactNumber(value);
    }
    return `$${formatCompactNumber(value)}`;
  };

  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-text-muted mb-1">
        {new Date(label).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-text-secondary">{entry.name}</span>
            </span>
            <span className="text-xs font-mono text-text-primary">
              {formatValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom Legend Component
function CustomLegend({
  payload,
  chartData,
  metric = 'usd',
}: {
  payload?: Array<{ value: string; color: string }>;
  chartData: Array<{ timestamp: number; [outcome: string]: number }>;
  metric?: VolumeMetric;
}) {
  if (!payload || chartData.length === 0) return null;

  const latestData = chartData[chartData.length - 1];

  const formatValue = (value: number) => {
    if (metric === 'shares') {
      return formatCompactNumber(value);
    }
    return `$${formatCompactNumber(value)}`;
  };

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-2">
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-text-secondary">{entry.value}:</span>
          <span className="text-xs font-mono text-text-primary">
            {formatValue(latestData[entry.value] || 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function VolumeFlowChart({
  chartData,
  outcomeNames,
  loading = false,
  metric = 'usd',
}: VolumeFlowChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Determine if this is a short time period (< 24h of data)
  const isShortPeriod = useMemo(() => {
    if (chartData.length < 2) return true;
    const timeRange =
      chartData[chartData.length - 1].timestamp - chartData[0].timestamp;
    return timeRange < 24 * 60 * 60 * 1000; // Less than 24 hours
  }, [chartData]);

  // Calculate Y-axis domain with padding
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 1000];
    const allValues = chartData.flatMap((d) =>
      outcomeNames.map((name) => d[name] || 0)
    );
    const maxValue = Math.max(...allValues, 100);
    return [0, Math.ceil(maxValue * 1.1)]; // 10% padding on top
  }, [chartData, outcomeNames]);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center text-text-muted">
        <div className="animate-pulse">Loading chart...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-text-muted">
        <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (chartData.length === 0 || outcomeNames.length === 0) {
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
        <p className="text-sm">No volume data available</p>
        <p className="text-xs mt-1">Need more trades to display volume flow</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <defs>
          {outcomeNames.map((name, i) => {
            const color = getOutcomeColor(name, i);
            const gradientId = sanitizeId(name);
            return (
              <linearGradient
                key={name}
                id={`volume-gradient-${gradientId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            );
          })}
        </defs>

        <XAxis
          dataKey="timestamp"
          tickFormatter={(ts) => formatTime(ts, isShortPeriod)}
          stroke="#4a4b55"
          tick={{ fill: '#8a8b95', fontSize: 10 }}
          axisLine={{ stroke: '#2a2b35' }}
          tickLine={{ stroke: '#2a2b35' }}
          minTickGap={40}
        />

        <YAxis
          domain={yDomain}
          tickFormatter={(v) => metric === 'shares' ? formatCompactNumber(v) : `$${formatCompactNumber(v)}`}
          stroke="#4a4b55"
          tick={{ fill: '#8a8b95', fontSize: 10 }}
          axisLine={{ stroke: '#2a2b35' }}
          tickLine={{ stroke: '#2a2b35' }}
          width={55}
        />

        <Tooltip
          content={<CustomTooltip outcomeNames={outcomeNames} metric={metric} />}
          cursor={{ stroke: '#4a4b55', strokeDasharray: '3 3' }}
        />

        {outcomeNames.map((name, i) => {
          const color = getOutcomeColor(name, i);
          const gradientId = sanitizeId(name);
          return (
            <Area
              key={name}
              type="monotone"
              dataKey={name}
              stroke={color}
              fill={`url(#volume-gradient-${gradientId})`}
              strokeWidth={2}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color }}
              connectNulls={true}
              isAnimationActive={false}
              baseValue={0}
            />
          );
        })}

        <Legend
          content={<CustomLegend chartData={chartData} metric={metric} />}
          wrapperStyle={{ paddingTop: '10px' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

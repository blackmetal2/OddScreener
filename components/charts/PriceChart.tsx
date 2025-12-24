'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { PricePoint } from '@/types/market';

interface PriceChartProps {
  data: PricePoint[];
  loading?: boolean;
}

export default function PriceChart({ data, loading }: PriceChartProps) {
  // Prevent SSR/hydration mismatch by only rendering chart on client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const chartData = useMemo(() => {
    return data.map((point) => ({
      timestamp: new Date(point.timestamp).getTime(),
      probability: point.probability,
      volume: point.volume,
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

  // Calculate domain for Y-axis with some padding
  const probabilities = chartData.map((d) => d.probability);
  const minProb = Math.max(0, Math.min(...probabilities) - 5);
  const maxProb = Math.min(100, Math.max(...probabilities) + 5);

  // Determine if price is trending up or down
  const isUptrend = chartData.length > 1 && chartData[chartData.length - 1].probability >= chartData[0].probability;
  const gradientColor = isUptrend ? '#22c55e' : '#ef4444';
  const strokeColor = isUptrend ? '#22c55e' : '#ef4444';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="probabilityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={gradientColor} stopOpacity={0} />
          </linearGradient>
        </defs>
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
          domain={[minProb, maxProb]}
          tickFormatter={(value) => `${Math.round(value)}%`}
          stroke="#4b5563"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={45}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#13141b',
            border: '1px solid #1e2029',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          labelStyle={{ color: '#6b7280', fontSize: 11, marginBottom: 4 }}
          itemStyle={{ color: '#ffffff', fontSize: 13 }}
          labelFormatter={formatTooltipTime}
          formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Probability']}
        />
        <ReferenceLine y={50} stroke="#1e2029" strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="probability"
          stroke={strokeColor}
          strokeWidth={2}
          fill="url(#probabilityGradient)"
          animationDuration={500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

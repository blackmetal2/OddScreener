'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Market } from '@/types/market';

interface StackedProgressBarProps {
  market: Market;
}

interface Segment {
  label: string;
  percent: number;
  color: string;
  textColor: string;
}

function getSegments(market: Market): Segment[] {
  if (market.marketType === 'binary' || !market.outcomes || market.outcomes.length <= 2) {
    // Binary market: YES (green) vs NO (red)
    const yesProb = market.probability;
    const noProb = 100 - yesProb;
    return [
      { label: 'YES', percent: yesProb, color: 'bg-positive', textColor: 'text-positive' },
      { label: 'NO', percent: noProb, color: 'bg-negative', textColor: 'text-negative' },
    ];
  }

  // Multi-outcome: Top 2 + Others
  const sorted = [...market.outcomes].sort((a, b) => b.probability - a.probability);
  const top1 = sorted[0];
  const top2 = sorted[1];
  const othersProb = 100 - top1.probability - top2.probability;

  const colors = [
    { bg: 'bg-accent', text: 'text-accent' },         // Cyan for #1
    { bg: 'bg-purple-400', text: 'text-purple-400' }, // Purple for #2
    { bg: 'bg-gray-500', text: 'text-gray-400' },     // Gray for Others
  ];

  const segments: Segment[] = [
    { label: top1.name, percent: top1.probability, color: colors[0].bg, textColor: colors[0].text },
    { label: top2.name, percent: top2.probability, color: colors[1].bg, textColor: colors[1].text },
  ];

  if (othersProb > 0) {
    segments.push({ label: 'Others', percent: othersProb, color: colors[2].bg, textColor: colors[2].text });
  }

  return segments;
}

export function StackedProgressBar({ market }: StackedProgressBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const segments = getSegments(market);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Progress Bar */}
      <div className="w-16 h-1.5 bg-surface-hover rounded-full overflow-hidden flex">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={cn('h-full transition-all duration-300', seg.color)}
            style={{ width: `${seg.percent}%` }}
          />
        ))}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface border border-border rounded text-xs whitespace-nowrap z-50">
          {segments.map((seg, i) => (
            <span key={i}>
              {i > 0 && ' | '}
              <span className={seg.textColor}>{seg.label}: {seg.percent}%</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';

interface TableSkeletonProps {
  rows?: number;
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-surface-hover rounded', className)} />
  );
}

export default function TableSkeleton({ rows = 10 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden">
      <table className="w-full table-fixed">
        <thead>
          <tr className="text-xs uppercase tracking-wider border-b border-border">
            <th className="py-3 px-2 text-left font-medium w-[4%] text-text-secondary">#</th>
            <th className="py-3 px-2 text-left font-medium w-[32%] text-text-secondary">Market</th>
            <th className="py-3 px-2 text-left font-medium w-[10%] text-text-secondary">Category</th>
            <th className="py-3 px-2 text-right font-medium w-[9%] text-text-secondary">Prob</th>
            <th className="py-3 px-2 text-right font-medium w-[8%] text-text-secondary">1H</th>
            <th className="py-3 px-2 text-right font-medium w-[8%] text-text-secondary">6H</th>
            <th className="py-3 px-2 text-right font-medium w-[8%] text-text-secondary">24H</th>
            <th className="py-3 px-2 text-right font-medium w-[11%] text-text-secondary">Volume</th>
            <th className="py-3 px-2 text-right font-medium w-[10%] text-text-secondary">Ends</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="border-b border-border/50">
              {/* Row number */}
              <td className="py-3 px-2">
                <SkeletonPulse className="h-4 w-4" />
              </td>

              {/* Market name */}
              <td className="py-3 px-2">
                <div className="flex items-center gap-1.5">
                  <SkeletonPulse className="w-4 h-4 rounded-full shrink-0" />
                  <SkeletonPulse className="w-6 h-6 rounded shrink-0" />
                  <SkeletonPulse className="h-4 flex-1 max-w-[200px]" />
                </div>
              </td>

              {/* Category */}
              <td className="py-3 px-2">
                <SkeletonPulse className="h-5 w-16 rounded-full" />
              </td>

              {/* Probability */}
              <td className="py-3 px-2">
                <div className="flex items-center justify-end gap-2">
                  <SkeletonPulse className="w-16 h-1.5 rounded-full" />
                  <SkeletonPulse className="w-10 h-4" />
                </div>
              </td>

              {/* 1H Change */}
              <td className="py-3 px-2">
                <div className="flex justify-end">
                  <SkeletonPulse className="w-12 h-4" />
                </div>
              </td>

              {/* 6H Change */}
              <td className="py-3 px-2">
                <div className="flex justify-end">
                  <SkeletonPulse className="w-12 h-4" />
                </div>
              </td>

              {/* 24H Change */}
              <td className="py-3 px-2">
                <div className="flex justify-end">
                  <SkeletonPulse className="w-12 h-4" />
                </div>
              </td>

              {/* Volume */}
              <td className="py-3 px-2">
                <div className="flex justify-end">
                  <SkeletonPulse className="w-14 h-4" />
                </div>
              </td>

              {/* Ends */}
              <td className="py-3 px-2">
                <div className="flex justify-end">
                  <SkeletonPulse className="w-10 h-4" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

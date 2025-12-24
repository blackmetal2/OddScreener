'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface AdvancedFilters {
  probabilityMin: number;
  probabilityMax: number;
  volumeMin: number | null;
  volumeMax: number | null;
  closingWithin: 'any' | '24h' | '48h' | '7d' | '30d';
  showHotOnly: boolean;
  showMultiOnly: boolean;
}

export const defaultFilters: AdvancedFilters = {
  probabilityMin: 0,
  probabilityMax: 100,
  volumeMin: null,
  volumeMax: null,
  closingWithin: 'any',
  showHotOnly: false,
  showMultiOnly: false,
};

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onApply: (filters: AdvancedFilters) => void;
}

export default function FilterModal({ isOpen, onClose, filters, onApply }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);

  // Sync local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const closingOptions = [
    { value: 'any', label: 'Any time' },
    { value: '24h', label: '< 24 hours' },
    { value: '48h', label: '< 48 hours' },
    { value: '7d', label: '< 7 days' },
    { value: '30d', label: '< 30 days' },
  ];

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters(defaultFilters);
  };

  const hasActiveFilters =
    localFilters.probabilityMin > 0 ||
    localFilters.probabilityMax < 100 ||
    localFilters.volumeMin !== null ||
    localFilters.volumeMax !== null ||
    localFilters.closingWithin !== 'any' ||
    localFilters.showHotOnly ||
    localFilters.showMultiOnly;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Advanced Filters</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-text-secondary"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-6">
          {/* Probability Range */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              Probability Range
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={localFilters.probabilityMin}
                  onChange={(e) => setLocalFilters({ ...localFilters, probabilityMin: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/50"
                  placeholder="Min %"
                />
              </div>
              <span className="text-text-muted">to</span>
              <div className="flex-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={localFilters.probabilityMax}
                  onChange={(e) => setLocalFilters({ ...localFilters, probabilityMax: Math.max(0, Math.min(100, parseInt(e.target.value) || 100)) })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/50"
                  placeholder="Max %"
                />
              </div>
            </div>
            {/* Visual probability bar */}
            <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{
                  marginLeft: `${localFilters.probabilityMin}%`,
                  width: `${localFilters.probabilityMax - localFilters.probabilityMin}%`,
                }}
              />
            </div>
          </div>

          {/* Volume Range */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              24H Volume (USD)
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                <input
                  type="number"
                  min={0}
                  value={localFilters.volumeMin ?? ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, volumeMin: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full bg-background border border-border rounded-lg pl-7 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/50"
                  placeholder="Min"
                />
              </div>
              <span className="text-text-muted">to</span>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                <input
                  type="number"
                  min={0}
                  value={localFilters.volumeMax ?? ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, volumeMax: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full bg-background border border-border rounded-lg pl-7 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/50"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>

          {/* Closing Within */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              Closing Within
            </label>
            <div className="flex flex-wrap gap-2">
              {closingOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLocalFilters({ ...localFilters, closingWithin: option.value as AdvancedFilters['closingWithin'] })}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    localFilters.closingWithin === option.value
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-background border border-border text-text-secondary hover:text-text-primary hover:border-border-light'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle filters */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={localFilters.showHotOnly}
                onChange={(e) => setLocalFilters({ ...localFilters, showHotOnly: e.target.checked })}
                className="w-4 h-4 rounded border-border bg-background text-accent focus:ring-accent/50 focus:ring-offset-0"
              />
              <span className="text-sm text-text-secondary group-hover:text-text-primary">
                Show only HOT markets
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={localFilters.showMultiOnly}
                onChange={(e) => setLocalFilters({ ...localFilters, showMultiOnly: e.target.checked })}
                className="w-4 h-4 rounded border-border bg-background text-accent focus:ring-accent/50 focus:ring-offset-0"
              />
              <span className="text-sm text-text-secondary group-hover:text-text-primary">
                Show only multi-outcome markets
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background/50">
          <button
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              hasActiveFilters
                ? 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                : 'text-text-muted cursor-not-allowed'
            )}
          >
            Reset
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

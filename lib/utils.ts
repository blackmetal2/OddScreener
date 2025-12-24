import { Category, Platform } from '@/types/market';

export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '$0';
  }
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}

export function formatCompactNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}K`;
  }
  // For whole numbers or numbers >= 100, show no decimals; otherwise show 2 decimals
  if (Number.isInteger(num) || abs >= 100) {
    return `${sign}${abs.toFixed(0)}`;
  }
  return `${sign}${abs.toFixed(2)}`;
}

export function formatChange(change: number | undefined | null): string {
  if (change === undefined || change === null || isNaN(change)) {
    return '+0.00%';
  }
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

export function formatTimeUntil(date: Date | null | undefined | string): string {
  if (!date) return '--';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '--';

  const now = new Date();
  const diff = dateObj.getTime() - now.getTime();

  if (diff < 0) return 'Ended';

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  // Under 1 hour: show minutes
  if (hours < 1) {
    return `${minutes}m`;
  }
  // Under 24 hours: show hours
  if (hours < 24) {
    return `${hours}h`;
  }
  // Under 7 days: show days
  if (days < 7) {
    return `${days}d`;
  }
  // Under 30 days: show weeks
  if (days < 30) {
    return `${weeks}w`;
  }
  // Otherwise show months
  return `${months}mo`;
}

export function formatFullDate(date: Date | null | undefined | string): string {
  if (!date) return '--';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '--';

  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDistanceToNow(date: Date | null | undefined | string): string {
  if (!date) return 'just now';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'just now';

  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();

  if (diff < 0) return 'just now';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (days < 7) {
    return `${days}d ago`;
  }
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getCategoryColor(category: Category): string {
  const colors: Record<Category, string> = {
    politics: 'bg-blue-500/20 text-blue-400',
    sports: 'bg-orange-500/20 text-orange-400',
    crypto: 'bg-yellow-500/20 text-yellow-400',
    finance: 'bg-emerald-500/20 text-emerald-400',
    world: 'bg-purple-500/20 text-purple-400',
    culture: 'bg-pink-500/20 text-pink-400',
    tech: 'bg-cyan-500/20 text-cyan-400',
    science: 'bg-indigo-500/20 text-indigo-400',
  };
  return colors[category];
}

export function getCategoryLabel(category: Category): string {
  const labels: Record<Category, string> = {
    politics: 'Politics',
    sports: 'Sports',
    crypto: 'Crypto',
    finance: 'Finance',
    world: 'World',
    culture: 'Culture',
    tech: 'Tech',
    science: 'Science',
  };
  return labels[category];
}

export function getPlatformColor(platform: Platform): string {
  return 'bg-polymarket-bg text-polymarket';
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

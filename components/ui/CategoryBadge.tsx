'use client';

import { Category } from '@/types/market';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

// Crisp micro-icons for each category (12x12 viewBox)
const categoryIcons: Record<Category, React.ReactNode> = {
  politics: (
    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
      <path d="M6 1L1 4v1h10V4L6 1z" fill="currentColor" opacity="0.9"/>
      <path d="M2 6v4h2V6H2zM5 6v4h2V6H5zM8 6v4h2V6H8z" fill="currentColor" opacity="0.7"/>
      <path d="M1 10h10v1H1v-1z" fill="currentColor"/>
    </svg>
  ),
  sports: (
    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <path d="M6 1.5c1.5 1 2.5 2.5 2.5 4.5s-1 3.5-2.5 4.5" stroke="currentColor" strokeWidth="0.8"/>
      <path d="M6 1.5c-1.5 1-2.5 2.5-2.5 4.5s1 3.5 2.5 4.5" stroke="currentColor" strokeWidth="0.8"/>
      <path d="M1.5 6h9" stroke="currentColor" strokeWidth="0.8"/>
    </svg>
  ),
  crypto: (
    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
      <path d="M6 1v1M6 10v1M4 3h3.5a1.5 1.5 0 110 3H4M4 6h4a1.5 1.5 0 110 3H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M3.5 3v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
      <path d="M1 10l2.5-3 2 1.5 2.5-4L11 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="11" cy="2" r="1" fill="currentColor"/>
    </svg>
  ),
  world: (
    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
      <ellipse cx="6" cy="6" rx="2" ry="4.5" stroke="currentColor" strokeWidth="0.8"/>
      <path d="M1.5 6h9M2 3.5h8M2 8.5h8" stroke="currentColor" strokeWidth="0.6"/>
    </svg>
  ),
  culture: (
    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
      <path d="M3 2l6 4-6 4V2z" fill="currentColor" opacity="0.8"/>
      <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1"/>
    </svg>
  ),
  tech: (
    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
      <rect x="2" y="3" width="8" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4 8v2M8 8v2M3 10h6" stroke="currentColor" strokeWidth="1"/>
      <circle cx="6" cy="5.5" r="0.8" fill="currentColor"/>
    </svg>
  ),
  science: (
    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
      <path d="M4.5 1v3.5L2 9.5a1 1 0 00.8 1.5h6.4a1 1 0 00.8-1.5L7.5 4.5V1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M4 1h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="5" cy="8" r="0.7" fill="currentColor"/>
      <circle cx="7" cy="9" r="0.5" fill="currentColor"/>
    </svg>
  ),
};

// Enhanced color schemes with gradient stops and glow colors
const categoryStyles: Record<Category, {
  bg: string;
  text: string;
  border: string;
  glow: string;
  gradientFrom: string;
  gradientTo: string;
}> = {
  politics: {
    bg: 'bg-blue-950/40',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/20',
    gradientFrom: 'from-blue-500/10',
    gradientTo: 'to-blue-600/5',
  },
  sports: {
    bg: 'bg-orange-950/40',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/20',
    gradientFrom: 'from-orange-500/10',
    gradientTo: 'to-orange-600/5',
  },
  crypto: {
    bg: 'bg-amber-950/40',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
    gradientFrom: 'from-amber-500/10',
    gradientTo: 'to-yellow-600/5',
  },
  finance: {
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
    gradientFrom: 'from-emerald-500/10',
    gradientTo: 'to-green-600/5',
  },
  world: {
    bg: 'bg-violet-950/40',
    text: 'text-violet-400',
    border: 'border-violet-500/30',
    glow: 'shadow-violet-500/20',
    gradientFrom: 'from-violet-500/10',
    gradientTo: 'to-purple-600/5',
  },
  culture: {
    bg: 'bg-pink-950/40',
    text: 'text-pink-400',
    border: 'border-pink-500/30',
    glow: 'shadow-pink-500/20',
    gradientFrom: 'from-pink-500/10',
    gradientTo: 'to-rose-600/5',
  },
  tech: {
    bg: 'bg-cyan-950/40',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/20',
    gradientFrom: 'from-cyan-500/10',
    gradientTo: 'to-teal-600/5',
  },
  science: {
    bg: 'bg-indigo-950/40',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    glow: 'shadow-indigo-500/20',
    gradientFrom: 'from-indigo-500/10',
    gradientTo: 'to-blue-600/5',
  },
};

const categoryLabels: Record<Category, string> = {
  politics: 'Politics',
  sports: 'Sports',
  crypto: 'Crypto',
  finance: 'Finance',
  world: 'World',
  culture: 'Culture',
  tech: 'Tech',
  science: 'Science',
};

export default function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const styles = categoryStyles[category] || categoryStyles.world;
  const icon = categoryIcons[category] || categoryIcons.world;
  const label = categoryLabels[category] || 'World';

  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md',
        'font-mono text-[11px] font-medium uppercase tracking-wide',
        // Colors and gradient
        styles.bg,
        styles.text,
        'bg-gradient-to-br',
        styles.gradientFrom,
        styles.gradientTo,
        // Border with glow
        'border',
        styles.border,
        // Shadow/glow effect
        'shadow-sm',
        styles.glow,
        // Transitions
        'transition-all duration-200 ease-out',
        // Hover effects
        'hover:shadow-md hover:scale-[1.02]',
        'hover:border-opacity-50',
        // Cursor
        'cursor-default select-none',
        className
      )}
    >
      <span className="opacity-80 flex-shrink-0">
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}

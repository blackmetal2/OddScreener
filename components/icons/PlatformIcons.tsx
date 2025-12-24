'use client';

interface IconProps {
  size?: number;
  className?: string;
}

// Polymarket icon - Blue P logo (official brand color)
export function PolymarketIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="12" cy="12" r="12" fill="#0066FF" />
      <path
        d="M8 6h4.5a3.5 3.5 0 110 7H10v5H8V6z"
        fill="white"
      />
    </svg>
  );
}

// Kalshi icon - Red K logo (official brand color)
export function KalshiIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="12" cy="12" r="12" fill="#FF4444" />
      <path
        d="M8 6v12M8 12l6-6M8 12l6 6"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Wrapper component for dynamic platform selection
export function PlatformIcon({
  platform,
  size = 16,
  className,
}: {
  platform: 'polymarket' | 'kalshi';
  size?: number;
  className?: string;
}) {
  if (platform === 'kalshi') {
    return <KalshiIcon size={size} className={className} />;
  }
  return <PolymarketIcon size={size} className={className} />;
}

'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlatformIcon } from '@/components/icons/PlatformIcons';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  href?: string;
  onClick?: () => void;
}

// Hamburger menu icon component
export function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

// Close icon component
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SidebarItem({ icon, label, active, badge, href, onClick }: SidebarItemProps) {
  const content = (
    <>
      <span className="w-5 h-5 flex items-center justify-center opacity-70">
        {icon}
      </span>
      <span className="flex-1 text-left text-sm">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 text-xs bg-accent/20 text-accent rounded">
          {badge}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'sidebar-item w-full',
          active && 'sidebar-item-active'
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'sidebar-item w-full',
        active && 'sidebar-item-active'
      )}
    >
      {content}
    </button>
  );
}

interface PlatformItemProps {
  name: string;
  platform?: 'polymarket';
  value: string;
  active?: boolean;
  onClick: () => void;
}

function PlatformItem({ name, platform, active, onClick }: PlatformItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 w-full',
        active
          ? 'bg-surface-hover'
          : 'hover:bg-surface-hover/50'
      )}
    >
      {platform ? (
        <PlatformIcon platform={platform} size={14} />
      ) : (
        <span className="w-3.5 h-3.5 rounded-full bg-text-secondary" />
      )}
      <span className={cn(
        'text-sm',
        active ? 'text-text-primary' : 'text-text-secondary'
      )}>
        {name}
      </span>
    </button>
  );
}

interface SidebarProps {
  onOpenAlerts?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function Sidebar({ onOpenAlerts, isOpen = true, onClose, searchValue = '', onSearchChange }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentView = searchParams.get('view') || 'trending';
  const currentPlatform = searchParams.get('platform') || 'all';
  const isHomePage = pathname === '/';

  const handleViewChange = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    params.delete('page'); // Reset pagination when changing view
    router.push(`/?${params.toString()}`);
    onClose?.(); // Close sidebar on mobile after navigation
  };

  const handlePlatformChange = (platform: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('platform', platform);
    params.delete('page'); // Reset pagination when changing platform
    router.push(`/?${params.toString()}`);
    onClose?.(); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'w-[200px] h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 z-50',
          'transition-transform duration-300 ease-in-out',
          // On mobile: slide in/out based on isOpen state
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // On desktop (md+): always visible
          'md:translate-x-0'
        )}
      >
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-background"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight">
              Odd<span className="text-accent">Screener</span>
            </span>
          </Link>
          {/* Close button - mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-text-secondary"
            aria-label="Close sidebar"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search markets..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-8 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
          />
          {searchValue ? (
            <button
              onClick={() => onSearchChange?.('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              aria-label="Clear search"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          ) : (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted bg-surface px-1.5 py-0.5 rounded">
              /
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <SidebarItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          }
          label="Watchlist"
          href="/watchlist"
          active={pathname === '/watchlist'}
        />
        <SidebarItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          }
          label="Alerts"
          onClick={onOpenAlerts}
        />

        <div className="pt-4 pb-2">
          <span className="px-4 text-xs font-medium text-text-muted uppercase tracking-wider">
            Tools
          </span>
        </div>

        <SidebarItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          label="Whale Tracker"
          href="/whales"
          active={pathname === '/whales'}
          badge="NEW"
        />
        <SidebarItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          }
          label="Insider Tracker"
          href="/insiders"
          active={pathname === '/insiders'}
          badge="Soon"
        />
        <SidebarItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
          }
          label="News"
          href="/news"
          active={pathname === '/news'}
          badge="Soon"
        />
        <div className="pt-4 pb-2">
          <span className="px-4 text-xs font-medium text-text-muted uppercase tracking-wider">
            Discover
          </span>
        </div>

        <SidebarItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
          label="Trending"
          active={isHomePage && currentView === 'trending'}
          badge="HOT"
          onClick={() => handleViewChange('trending')}
        />
        <SidebarItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          }
          label="Biggest Movers"
          active={isHomePage && currentView === 'movers'}
          onClick={() => handleViewChange('movers')}
        />
        <SidebarItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          }
          label="New Markets"
          active={isHomePage && currentView === 'new'}
          onClick={() => handleViewChange('new')}
        />
        <SidebarItem
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
          label="Top Volume"
          active={isHomePage && currentView === 'volume'}
          onClick={() => handleViewChange('volume')}
        />

        <div className="pt-4 pb-2">
          <span className="px-4 text-xs font-medium text-text-muted uppercase tracking-wider">
            Platforms
          </span>
        </div>

        <PlatformItem
          name="Polymarket"
          platform="polymarket"
          value="polymarket"
          active={currentPlatform === 'polymarket'}
          onClick={() => handlePlatformChange('polymarket')}
        />
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg w-full opacity-50 cursor-not-allowed">
          <PlatformIcon platform="kalshi" size={14} />
          <span className="text-sm text-text-secondary">Kalshi</span>
          <span className="ml-auto px-1.5 py-0.5 text-xs bg-accent/20 text-accent rounded">
            Soon
          </span>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-center gap-4">
          {/* Telegram */}
          <span
            className="text-text-muted/50 cursor-not-allowed"
            aria-label="Telegram (coming soon)"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </span>
          {/* Discord */}
          <a
            href="https://discord.gg/eXCNazxUNe"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-accent transition-colors"
            aria-label="Discord"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
            </svg>
          </a>
          {/* X (Twitter) */}
          <a
            href="https://x.com/oddscreener"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-accent transition-colors"
            aria-label="X"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>
      </div>
    </aside>
    </>
  );
}

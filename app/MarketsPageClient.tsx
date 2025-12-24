'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar, { HamburgerIcon } from '@/components/layout/Sidebar';
import StatsBar from '@/components/layout/StatsBar';
import FilterBar, { RankBy } from '@/components/filters/FilterBar';
import FilterModal, { AdvancedFilters, defaultFilters } from '@/components/filters/FilterModal';
import MarketsTable, { SortColumn, SortDirection } from '@/components/table/MarketsTable';
import AlertsModal from '@/components/modals/AlertsModal';
import { Market, GlobalStats, Category, Platform } from '@/types/market';
import { useMarketWebSocket } from '@/lib/hooks/useMarketWebSocket';

interface MarketsPageClientProps {
  initialMarkets: Market[];
  initialStats: GlobalStats;
}

export default function MarketsPageClient({
  initialMarkets,
  initialStats,
}: MarketsPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get initial values from URL
  const urlView = searchParams.get('view') || 'trending';
  const urlPlatform = searchParams.get('platform') || 'all';
  const urlCategory = searchParams.get('category') || 'all';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);

  const [timeframe, setTimeframe] = useState(urlView);
  const [platform, setPlatform] = useState<Platform | 'all'>(urlPlatform as Platform | 'all');
  const [category, setCategory] = useState<Category | 'all'>(urlCategory as Category | 'all');
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [rankBy, setRankBy] = useState<RankBy>('volume');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(defaultFilters);
  const [markets, setMarkets] = useState<Market[]>(initialMarkets);
  const [currentPage, setCurrentPage] = useState(urlPage);
  const isProgrammaticNavRef = useRef(false); // Track when we're updating URL ourselves
  const marketsPerPage = 50;

  // WebSocket subscriptions for visible markets (subscribe to first 50)
  const marketSubscriptions = useMemo(() => {
    return markets.slice(0, 50).map((m) => ({
      id: m.id,
      platform: m.platform,
    }));
  }, [markets]);

  // Connect to WebSocket for real-time updates
  const { updates } = useMarketWebSocket(marketSubscriptions, {
    enabled: true,
  });

  // Apply WebSocket updates to markets
  useEffect(() => {
    if (updates.size === 0) return;

    setMarkets((prevMarkets) =>
      prevMarkets.map((market) => {
        const update = updates.get(market.id);
        if (!update) return market;

        return {
          ...market,
          probability: update.probability ?? market.probability,
          volume24h: update.volume24h ?? market.volume24h,
          change24h: update.change24h ?? market.change24h,
        };
      })
    );
  }, [updates]);

  // Sync markets with initial data when it changes
  useEffect(() => {
    setMarkets(initialMarkets);
  }, [initialMarkets]);

  // Check if any advanced filters are active
  const hasActiveFilters =
    advancedFilters.probabilityMin > 0 ||
    advancedFilters.probabilityMax < 100 ||
    advancedFilters.volumeMin !== null ||
    advancedFilters.volumeMax !== null ||
    advancedFilters.closingWithin !== 'any' ||
    advancedFilters.showHotOnly ||
    advancedFilters.showMultiOnly;

  // Update URL when filters change
  const updateUrl = useCallback((newPlatform: Platform | 'all', newCategory: Category | 'all', newView: string, newPage: number = 1) => {
    const params = new URLSearchParams();
    if (newView !== 'trending') params.set('view', newView);
    if (newPlatform !== 'all') params.set('platform', newPlatform);
    if (newCategory !== 'all') params.set('category', newCategory);
    if (newPage > 1) params.set('page', String(newPage));

    const queryString = params.toString();
    // Mark this as a programmatic navigation so URL sync effect doesn't override state
    isProgrammaticNavRef.current = true;
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
  }, [router]);

  // Handle page change with URL update
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    updateUrl(platform, category, timeframe, newPage);
  }, [platform, category, timeframe, updateUrl]);

  // Wrapper functions to update state and URL
  const handlePlatformChange = useCallback((newPlatform: Platform | 'all') => {
    setPlatform(newPlatform);
    setCurrentPage(1); // Reset pagination when changing filters
    updateUrl(newPlatform, category, timeframe);
  }, [category, timeframe, updateUrl]);

  const handleCategoryChange = useCallback((newCategory: Category | 'all') => {
    setCategory(newCategory);
    setCurrentPage(1); // Reset pagination when changing filters
    updateUrl(platform, newCategory, timeframe);
  }, [platform, timeframe, updateUrl]);

  const handleTimeframeChange = useCallback((newTimeframe: string) => {
    setTimeframe(newTimeframe);
    setSortColumn(undefined);
    setCurrentPage(1); // Reset pagination when changing view
    updateUrl(platform, category, newTimeframe);
  }, [platform, category, updateUrl]);

  const handleRankByChange = useCallback((newRankBy: RankBy) => {
    setRankBy(newRankBy);
    setSortColumn(undefined); // Clear table column sort when using Rank By
    setCurrentPage(1);
  }, []);

  // Handle column sort
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction or clear sort
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        // Clear sort (go back to default view-based sorting)
        setSortColumn(undefined);
        setSortDirection('desc');
      }
    } else {
      // New column, start with descending
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Sync state with URL changes (when user navigates with back/forward buttons)
  useEffect(() => {
    setTimeframe(urlView);
    setPlatform(urlPlatform as Platform | 'all');
    setCategory(urlCategory as Category | 'all');
  }, [urlView, urlPlatform, urlCategory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // But allow Escape to blur/close
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      switch (e.key) {
        case '/':
          // Focus search input
          e.preventDefault();
          setSidebarOpen(true); // Open sidebar on mobile
          // Focus the search input after a small delay to allow sidebar animation
          setTimeout(() => {
            const searchInput = document.querySelector('input[placeholder="Search markets..."]') as HTMLInputElement;
            searchInput?.focus();
          }, 100);
          break;
        case 'Escape':
          // Close any open modals
          if (filterModalOpen) setFilterModalOpen(false);
          if (alertsOpen) setAlertsOpen(false);
          if (sidebarOpen) setSidebarOpen(false);
          break;
        case 'f':
          // Open filter modal (only if not holding modifier keys)
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            setFilterModalOpen(true);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filterModalOpen, alertsOpen, sidebarOpen]);

  const filteredMarkets = useMemo(() => {
    let marketsToFilter = [...markets];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      marketsToFilter = marketsToFilter.filter((m) => m.name.toLowerCase().includes(query));
    }

    // Filter by platform
    if (platform !== 'all') {
      marketsToFilter = marketsToFilter.filter((m) => m.platform === platform);
    }

    // Filter by category
    if (category !== 'all') {
      marketsToFilter = marketsToFilter.filter((m) => m.category === category);
    }

    // Apply advanced filters
    if (advancedFilters.probabilityMin > 0 || advancedFilters.probabilityMax < 100) {
      marketsToFilter = marketsToFilter.filter(
        (m) => m.probability >= advancedFilters.probabilityMin && m.probability <= advancedFilters.probabilityMax
      );
    }

    if (advancedFilters.volumeMin !== null) {
      marketsToFilter = marketsToFilter.filter((m) => m.volume24h >= advancedFilters.volumeMin!);
    }

    if (advancedFilters.volumeMax !== null) {
      marketsToFilter = marketsToFilter.filter((m) => m.volume24h <= advancedFilters.volumeMax!);
    }

    if (advancedFilters.closingWithin !== 'any') {
      const now = new Date();
      const hoursMap = { '24h': 24, '48h': 48, '7d': 168, '30d': 720 };
      const maxHours = hoursMap[advancedFilters.closingWithin];
      const maxDate = new Date(now.getTime() + maxHours * 60 * 60 * 1000);
      marketsToFilter = marketsToFilter.filter((m) => new Date(m.endsAt) <= maxDate);
    }

    if (advancedFilters.showHotOnly) {
      marketsToFilter = marketsToFilter.filter((m) => m.isHot);
    }

    if (advancedFilters.showMultiOnly) {
      marketsToFilter = marketsToFilter.filter((m) => m.marketType === 'multi');
    }

    // Apply view-based sorting/filtering
    const now = new Date();
    switch (timeframe) {
      case 'trending':
        // Sort by trending score (volume spike + price movement + recency)
        // Filter out: ended markets, low volume garbage, settled markets (0% or 100%)

        // Find top 3 volume markets (override: keep high-volume settled markets)
        const sortedByVolume = [...marketsToFilter].sort((a, b) => b.volume24h - a.volume24h);
        const top3VolumeIds = new Set(sortedByVolume.slice(0, 3).map((m) => m.id));

        marketsToFilter = marketsToFilter
          .filter((m) => new Date(m.endsAt) > now) // Only active markets
          .filter((m) => (m.trendingScore || 0) > 0)
          // Hide settled markets (0% or 100%) unless in top 3 volume
          .filter((m) => {
            const isSettled = m.probability <= 0 || m.probability >= 100;
            if (isSettled) {
              return top3VolumeIds.has(m.id); // Override: keep top 3 volume
            }
            return true; // Keep active markets (1-99%)
          });
        marketsToFilter.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
        break;
      case 'new':
        // Filter to quality new markets: active, created in last 72 hours, minimum $5,000 volume
        const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
        const MIN_NEW_MARKET_VOLUME = 5000;
        marketsToFilter = marketsToFilter
          .filter((m) => new Date(m.endsAt) > now) // Only active markets
          .filter((m) => new Date(m.createdAt) > threeDaysAgo)
          .filter((m) => m.volume24h >= MIN_NEW_MARKET_VOLUME);
        // Sort by volume (best new markets first), not by date
        marketsToFilter.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'volume':
        // Sort by 24h volume
        marketsToFilter.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'movers':
        // Sort by absolute 24h change
        marketsToFilter.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
        break;
      case '1h':
        marketsToFilter.sort((a, b) => Math.abs(b.change1h) - Math.abs(a.change1h));
        break;
      case '6h':
        marketsToFilter.sort((a, b) => Math.abs(b.change6h) - Math.abs(a.change6h));
        break;
      case '24h':
        marketsToFilter.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
        break;
      default:
        break;
    }

    // Apply column-based sorting if active (overrides view sorting and rankBy)
    if (sortColumn) {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      switch (sortColumn) {
        case 'probability':
          marketsToFilter.sort((a, b) => (a.probability - b.probability) * multiplier);
          break;
        case 'change1h':
          marketsToFilter.sort((a, b) => (Math.abs(b.change1h) - Math.abs(a.change1h)) * multiplier);
          break;
        case 'change6h':
          marketsToFilter.sort((a, b) => (Math.abs(b.change6h) - Math.abs(a.change6h)) * multiplier);
          break;
        case 'change24h':
          marketsToFilter.sort((a, b) => (Math.abs(b.change24h) - Math.abs(a.change24h)) * multiplier);
          break;
        case 'volume':
          marketsToFilter.sort((a, b) => (a.volume24h - b.volume24h) * multiplier);
          break;
        case 'ends':
          marketsToFilter.sort((a, b) => (new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime()) * multiplier);
          break;
      }
    } else if (timeframe !== 'trending' && timeframe !== 'new') {
      // Apply rankBy sorting when no column sort is active (and not in trending/new views)
      switch (rankBy) {
        case 'volume':
          marketsToFilter.sort((a, b) => b.volume24h - a.volume24h);
          break;
        case 'change':
          marketsToFilter.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
          break;
        case 'probability':
          marketsToFilter.sort((a, b) => b.probability - a.probability);
          break;
        case 'ending':
          // Filter out ended markets, show only active ones sorted by soonest ending
          marketsToFilter = marketsToFilter.filter((m) => new Date(m.endsAt) > now);
          marketsToFilter.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
          break;
      }
    }

    return marketsToFilter;
  }, [markets, timeframe, platform, category, searchQuery, sortColumn, sortDirection, advancedFilters, rankBy]);

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    return {
      totalVolume24h: filteredMarkets.reduce((sum, m) => sum + m.volume24h, 0),
      openPositions24h: filteredMarkets.reduce((sum, m) => sum + Math.round(m.volume24h / 100), 0),
      activeMarkets: filteredMarkets.length,
    };
  }, [filteredMarkets]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredMarkets.length / marketsPerPage);
  const paginatedMarkets = useMemo(() => {
    const startIndex = (currentPage - 1) * marketsPerPage;
    return filteredMarkets.slice(startIndex, startIndex + marketsPerPage);
  }, [filteredMarkets, currentPage, marketsPerPage]);

  // Sync page from URL for browser back/forward navigation
  // Skip if this was a programmatic navigation (we already set the state)
  useEffect(() => {
    if (isProgrammaticNavRef.current) {
      // Reset flag after the URL update settles
      isProgrammaticNavRef.current = false;
      return;
    }
    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(pageFromUrl);
  }, [searchParams]);

  // Also listen for popstate events (browser back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pageFromUrl = parseInt(params.get('page') || '1', 10);
      setCurrentPage(pageFromUrl);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        onOpenAlerts={() => setAlertsOpen(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content - responsive margin */}
      <main className="ml-0 md:ml-[200px] max-w-full md:max-w-[calc(100vw-200px)] overflow-hidden">
        {/* Mobile Header with Hamburger */}
        <div className="md:hidden flex items-center gap-3 p-4 border-b border-border bg-surface sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
            aria-label="Open menu"
          >
            <HamburgerIcon className="w-6 h-6 text-text-primary" />
          </button>
          <span className="font-semibold text-lg tracking-tight">
            Odd<span className="text-accent">Screener</span>
          </span>
        </div>

        {/* Stats Bar */}
        <StatsBar stats={platform === 'all' && category === 'all' ? initialStats : filteredStats} />

        {/* Filter Bar */}
        <FilterBar
          timeframe={timeframe}
          setTimeframe={handleTimeframeChange}
          platform={platform}
          setPlatform={handlePlatformChange}
          category={category}
          setCategory={handleCategoryChange}
          rankBy={rankBy}
          setRankBy={handleRankByChange}
          onOpenFilters={() => setFilterModalOpen(true)}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Markets Table */}
        <div className="p-0">
          {filteredMarkets.length > 0 ? (
            <>
              <MarketsTable
                markets={paginatedMarkets}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                startIndex={(currentPage - 1) * marketsPerPage}
              />
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface">
                  <div className="text-sm text-text-secondary">
                    Showing {((currentPage - 1) * marketsPerPage) + 1}-{Math.min(currentPage * marketsPerPage, filteredMarkets.length)} of {filteredMarkets.length} markets
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm rounded-lg bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed hover:bg-border transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? 'bg-accent text-background'
                                : 'hover:bg-surface-hover'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm rounded-lg bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed hover:bg-border transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
              <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg">No markets found</p>
              <p className="text-sm mt-2">
                {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 text-sm bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Alerts Modal */}
      <AlertsModal isOpen={alertsOpen} onClose={() => setAlertsOpen(false)} />

      {/* Advanced Filters Modal */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={advancedFilters}
        onApply={setAdvancedFilters}
      />
    </div>
  );
}

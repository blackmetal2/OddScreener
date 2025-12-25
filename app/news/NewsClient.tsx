'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { AdjacentNewsItem, NEWS_CATEGORIES, NewsCategory } from '@/lib/api/adjacent-news';
import { formatDistanceToNow } from '@/lib/utils';

interface NewsClientProps {
  initialNews: AdjacentNewsItem[];
}

// Sound notification
const playNotificationSound = () => {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Ignore autoplay errors
  } catch (e) {
    // Fallback: use Web Audio API beep
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e2) {
      // Audio not available
    }
  }
};

export default function NewsClient({ initialNews }: NewsClientProps) {
  const [news, setNews] = useState<AdjacentNewsItem[]>(initialNews);
  const [category, setCategory] = useState<NewsCategory>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<AdjacentNewsItem | null>(null);
  const previousNewsIds = useRef<Set<string>>(new Set(initialNews.map(n => n.id)));

  // Fetch news from API route
  const fetchNews = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '50');
      if (category !== 'all') params.set('category', category);

      const res = await fetch(`/api/news?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const newNews: AdjacentNewsItem[] = data.news || [];

        // Check for new items
        const newItems = newNews.filter(n => !previousNewsIds.current.has(n.id));
        if (newItems.length > 0 && soundEnabled && previousNewsIds.current.size > 0) {
          playNotificationSound();
        }

        // Update refs
        previousNewsIds.current = new Set(newNews.map(n => n.id));
        setNews(newNews);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [category, soundEnabled]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNews(false);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchNews]);

  // Refetch when category changes
  useEffect(() => {
    fetchNews(true);
  }, [category]);

  // Filter news by category (client-side fallback)
  const filteredNews = category === 'all'
    ? news
    : news.filter(item => item.category?.toLowerCase() === category);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-0 md:ml-[200px]">
        {/* Header */}
        <header className="border-b border-border px-6 py-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                  News Feed
                  <span className="flex items-center gap-1.5 text-xs font-normal text-text-secondary">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live
                  </span>
                </h1>
                <p className="text-sm text-text-secondary">
                  Updated {formatDistanceToNow(lastUpdate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Category Filter */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsCategory)}
                className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent [&>option]:bg-background [&>option]:text-text-primary"
                style={{ colorScheme: 'dark' }}
              >
                {NEWS_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value} className="bg-background text-white">{cat.label}</option>
                ))}
              </select>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-accent/20 text-accent' : 'bg-card text-text-secondary'}`}
                title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
              >
                {soundEnabled ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>

              {/* Refresh Button */}
              <button
                onClick={() => fetchNews(true)}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-text-primary hover:bg-card-hover transition-colors disabled:opacity-50"
              >
                <svg
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* News Feed */}
        <div className="flex">
          {/* News List */}
          <div className="flex-1 divide-y divide-border">
            {filteredNews.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                {isRefreshing ? 'Loading news...' : 'No news items found'}
              </div>
            ) : (
              filteredNews.map((item) => (
                <article
                  key={item.id}
                  onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-card/50 ${selectedItem?.id === item.id ? 'bg-card/50 border-l-2 border-l-accent' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Score indicator */}
                    {item.score && item.score > 0 && (
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          item.score >= 4 ? 'bg-red-500/20 text-red-400' :
                          item.score >= 3 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {item.score}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Source and time */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-accent">
                          {item.source}
                        </span>
                        <span className="text-text-secondary">·</span>
                        <span className="text-sm text-text-secondary">
                          {formatDistanceToNow(new Date(item.publishedAt))}
                        </span>
                        {item.category && (
                          <>
                            <span className="text-text-secondary">·</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-card text-text-secondary capitalize">
                              {item.category}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-text-primary font-medium leading-snug mb-2">
                        {item.title}
                      </h3>

                      {/* Summary */}
                      {item.summary && (
                        <p className="text-sm text-text-secondary line-clamp-2">
                          {item.summary}
                        </p>
                      )}

                      {/* Related markets count */}
                      {item.markets && item.markets.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-sm text-text-secondary">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>{item.markets.length} related market{item.markets.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* External link */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0 p-2 text-text-secondary hover:text-accent transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Detail Panel */}
          {selectedItem && (
            <aside className="w-96 border-l border-border bg-card/30 p-4 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto hidden lg:block">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-text-primary">Related Markets</h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedItem.markets && selectedItem.markets.length > 0 ? (
                <div className="space-y-3">
                  {selectedItem.markets.map((market) => (
                    <Link
                      key={market.id}
                      href={`/market/${market.id}`}
                      className="block p-3 rounded-lg bg-card hover:bg-card-hover border border-border transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-medium text-text-primary line-clamp-2">
                          {market.question}
                        </h4>
                        {market.probability !== undefined && (
                          <span className="flex-shrink-0 text-sm font-bold text-accent">
                            {Math.round(market.probability)}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        <span className="uppercase">{market.platform}</span>
                        {market.volume24h && (
                          <span>Vol: ${(market.volume24h / 1000).toFixed(1)}K</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center text-text-secondary py-8">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="font-medium text-text-primary mb-1">Related Markets</p>
                  <p className="text-sm">Coming soon</p>
                  <span className="inline-block mt-3 px-2 py-1 text-xs bg-accent/20 text-accent rounded-full">
                    Soon
                  </span>
                </div>
              )}

              {/* Full article link */}
              <div className="mt-4 pt-4 border-t border-border">
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <span>Read Full Article</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

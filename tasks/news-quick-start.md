# News Page - Quick Start Guide

**Goal:** Get from zero to working news feed in 1 week

**Prerequisites:** 2 hours to read docs, 1 week of dev time

---

## Day 1: Setup & Planning (2-3 hours)

### Morning: Read & Decide
- [ ] Read `/tasks/news-summary-and-next-steps.md` (30 min)
- [ ] Skim `/tasks/news-feature-plan.md` (20 min)
- [ ] Choose path: MVP, MVP Plus, or Full (10 min)
- [ ] Get team buy-in (30 min meeting)

### Afternoon: Technical Setup
- [ ] Sign up for NewsAPI.org (5 min)
  - Go to: https://newsapi.org/register
  - Get free API key
  - Test in Postman/browser

- [ ] Sign up for Anthropic Claude API (5 min)
  - Go to: https://console.anthropic.com
  - Get API key
  - Test with curl:
  ```bash
  curl https://api.anthropic.com/v1/messages \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d '{
      "model": "claude-3-5-sonnet-20241022",
      "max_tokens": 100,
      "messages": [{"role": "user", "content": "Hello!"}]
    }'
  ```

- [ ] Add to `.env.local`:
  ```env
  NEWSAPI_KEY=your_key_here
  ANTHROPIC_API_KEY=your_key_here
  ```

---

## Day 2: Database & Types (4-6 hours)

### Create Database Schema
```sql
-- Add to your database (Postgres/MySQL)

-- News sources table
CREATE TABLE news_sources (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(500),
  reliability VARCHAR(20) CHECK (reliability IN ('high', 'medium', 'low')),
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News articles table
CREATE TABLE news (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  source_id VARCHAR(255) REFERENCES news_sources(id),
  published_at TIMESTAMP NOT NULL,
  url VARCHAR(500) NOT NULL UNIQUE,
  image_url VARCHAR(500),

  -- Metadata
  category VARCHAR(50),
  tags TEXT[], -- Postgres array, or JSON for MySQL
  language VARCHAR(10) DEFAULT 'en',

  -- Analytics
  impact_score INTEGER DEFAULT 0,
  sentiment_score INTEGER,
  trending_score INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_published_at (published_at),
  INDEX idx_category (category),
  INDEX idx_impact_score (impact_score)
);

-- Market-News relationship
CREATE TABLE market_news (
  market_id VARCHAR(255) NOT NULL,
  news_id VARCHAR(255) NOT NULL REFERENCES news(id),
  relevance_score FLOAT DEFAULT 0,
  price_impact FLOAT,

  PRIMARY KEY (market_id, news_id),
  INDEX idx_market_id (market_id),
  INDEX idx_news_id (news_id)
);

-- User interactions (optional for MVP)
CREATE TABLE user_news_interactions (
  user_id VARCHAR(255) NOT NULL,
  news_id VARCHAR(255) NOT NULL REFERENCES news(id),
  read BOOLEAN DEFAULT FALSE,
  saved BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,

  PRIMARY KEY (user_id, news_id)
);
```

### Create TypeScript Types
```typescript
// /types/news.ts
export interface NewsSource {
  id: string;
  name: string;
  logoUrl?: string;
  reliability: 'high' | 'medium' | 'low';
  color?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  source: NewsSource;
  publishedAt: Date;
  url: string;
  imageUrl?: string;

  // Metadata
  category: Category;
  tags: string[];
  language: string;

  // Analytics
  impactScore?: number;
  sentimentScore?: number;
  trendingScore?: number;

  // Relations
  relatedMarketIds: string[];
  relatedMarkets?: Market[]; // Populated when needed

  // User state
  readByUser?: boolean;
  savedByUser?: boolean;
}

export interface NewsFilter {
  category?: Category | 'all';
  timeframe?: '1h' | '6h' | '24h' | 'week' | 'all';
  sources?: string[]; // source IDs
  search?: string;
  sortBy?: 'latest' | 'impact' | 'trending';
  limit?: number;
  offset?: number;
}

// Reuse Category from existing types/market.ts
import { Category } from './market';
```

---

## Day 3: Backend - News Service (4-6 hours)

### Create News API Service
```typescript
// /lib/services/newsapi.ts
const NEWSAPI_BASE = 'https://newsapi.org/v2';
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

export async function fetchLatestNews(params: {
  query?: string;
  category?: string;
  from?: Date;
  pageSize?: number;
}) {
  const url = new URL(`${NEWSAPI_BASE}/everything`);

  if (params.query) url.searchParams.set('q', params.query);
  if (params.from) url.searchParams.set('from', params.from.toISOString());
  url.searchParams.set('pageSize', String(params.pageSize || 20));
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('language', 'en');
  url.searchParams.set('apiKey', NEWSAPI_KEY!);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('NewsAPI error');

  const data = await response.json();
  return data.articles;
}

export function transformNewsAPIArticle(article: any): NewsItem {
  return {
    id: hashString(article.url), // Simple hash function
    title: article.title,
    excerpt: article.description || '',
    content: article.content,
    source: {
      id: article.source.id || article.source.name.toLowerCase().replace(/\s/g, '-'),
      name: article.source.name,
      reliability: getSourceReliability(article.source.name),
    },
    publishedAt: new Date(article.publishedAt),
    url: article.url,
    imageUrl: article.urlToImage,
    category: inferCategory(article.title, article.description),
    tags: extractTags(article.title, article.description),
    language: 'en',
    relatedMarketIds: [],
  };
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getSourceReliability(sourceName: string): 'high' | 'medium' | 'low' {
  const tier1 = ['reuters', 'bloomberg', 'associated press', 'wall street journal'];
  const tier2 = ['cnbc', 'the hill', 'politico', 'financial times'];

  const lower = sourceName.toLowerCase();
  if (tier1.some(s => lower.includes(s))) return 'high';
  if (tier2.some(s => lower.includes(s))) return 'medium';
  return 'low';
}

function inferCategory(title: string, description: string): Category {
  const text = `${title} ${description}`.toLowerCase();

  if (/election|senate|congress|president|poll/i.test(text)) return 'politics';
  if (/bitcoin|crypto|ethereum|blockchain/i.test(text)) return 'crypto';
  if (/nfl|nba|mlb|soccer|football|sports/i.test(text)) return 'sports';
  if (/stock|market|economy|recession|inflation/i.test(text)) return 'finance';
  if (/war|peace|treaty|ukraine|china/i.test(text)) return 'world';
  if (/tech|software|ai|apple|google/i.test(text)) return 'tech';
  if (/science|research|study|discovery/i.test(text)) return 'science';

  return 'world'; // Default
}

function extractTags(title: string, description: string): string[] {
  // Simple keyword extraction (you can improve this)
  const keywords = [
    'Trump', 'Biden', 'election', 'Bitcoin', 'crypto', 'war',
    'economy', 'inflation', 'recession', 'NATO', 'China', 'Russia'
  ];

  const text = `${title} ${description}`;
  return keywords.filter(kw =>
    text.toLowerCase().includes(kw.toLowerCase())
  );
}
```

### Create Database Actions
```typescript
// /app/actions/news.ts
'use server';

import { db } from '@/lib/db'; // Your database client

export async function fetchNews(filters: NewsFilter) {
  let query = db.select().from('news');

  // Apply filters
  if (filters.category && filters.category !== 'all') {
    query = query.where('category', filters.category);
  }

  if (filters.timeframe && filters.timeframe !== 'all') {
    const since = getTimeframeCutoff(filters.timeframe);
    query = query.where('published_at', '>=', since);
  }

  if (filters.search) {
    query = query.where('title', 'ILIKE', `%${filters.search}%`);
  }

  // Sort
  if (filters.sortBy === 'impact') {
    query = query.orderBy('impact_score', 'desc');
  } else if (filters.sortBy === 'trending') {
    query = query.orderBy('trending_score', 'desc');
  } else {
    query = query.orderBy('published_at', 'desc');
  }

  // Pagination
  query = query.limit(filters.limit || 20);
  if (filters.offset) query = query.offset(filters.offset);

  const news = await query;
  return news;
}

function getTimeframeCutoff(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
    case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000);
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    default: return new Date(0);
  }
}
```

---

## Day 4: Frontend - Components (6-8 hours)

### NewsCard Component
```typescript
// /components/news/NewsCard.tsx
'use client';

import Link from 'next/link';
import { NewsItem, Market } from '@/types';

interface NewsCardProps {
  news: NewsItem;
  relatedMarkets?: Market[];
}

export default function NewsCard({ news, relatedMarkets }: NewsCardProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="bg-card-bg border border-border rounded-lg p-6 mb-4 hover:border-accent transition">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {news.imageUrl && (
          <img
            src={news.imageUrl}
            alt={news.title}
            className="w-24 h-24 object-cover rounded"
          />
        )}

        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">
                {news.source.name}
              </span>
              {news.source.reliability === 'high' && (
                <span className="text-xs">⭐⭐⭐</span>
              )}
            </div>
            <span className="text-sm text-text-secondary">
              {formatTime(news.publishedAt)}
            </span>
          </div>

          {news.impactScore && news.impactScore >= 80 && (
            <div className="text-warning text-sm mb-2">
              🔥🔥🔥 High Impact
            </div>
          )}

          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {news.title}
          </h3>
        </div>
      </div>

      {/* Excerpt */}
      <p className="text-text-secondary mb-4 line-clamp-3">
        {news.excerpt}
      </p>

      {/* Related Markets */}
      {relatedMarkets && relatedMarkets.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-text-secondary mb-2">
            📊 Related Markets:
          </div>
          <div className="flex flex-wrap gap-2">
            {relatedMarkets.slice(0, 3).map(market => (
              <Link
                key={market.id}
                href={`/market/${market.id}`}
                className="bg-background border border-border rounded px-3 py-2 hover:border-accent transition"
              >
                <div className="text-sm font-medium text-text-primary">
                  {market.name}
                </div>
                <div className="text-xs text-text-secondary">
                  {market.probability}%
                  <span className={market.change24h > 0 ? 'text-success ml-1' : 'text-danger ml-1'}>
                    {market.change24h > 0 ? '↑' : '↓'} {Math.abs(market.change24h)}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 text-sm">
        <button className="text-text-secondary hover:text-accent transition">
          💾 Save
        </button>
        <button className="text-text-secondary hover:text-accent transition">
          🔗 Share
        </button>
        <a
          href={news.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          → Read Full Article
        </a>
      </div>
    </div>
  );
}
```

### CategoryTabs Component
```typescript
// /components/news/CategoryTabs.tsx
'use client';

import { Category } from '@/types';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '📰' },
  { id: 'politics', name: 'Politics', icon: '🏛️' },
  { id: 'crypto', name: 'Crypto', icon: '₿' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'finance', name: 'Finance', icon: '📈' },
  { id: 'world', name: 'World', icon: '🌍' },
  { id: 'tech', name: 'Tech', icon: '💻' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'culture', name: 'Culture', icon: '🎭' },
] as const;

interface CategoryTabsProps {
  activeCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
}

export default function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex overflow-x-auto gap-6 border-b border-border pb-4 mb-6">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          className={`flex items-center gap-2 whitespace-nowrap transition ${
            activeCategory === cat.id
              ? 'text-accent border-b-2 border-accent font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => onCategoryChange(cat.id as Category | 'all')}
        >
          <span className="text-xl">{cat.icon}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );
}
```

---

## Day 5: Page Assembly (4-6 hours)

### News Page
```typescript
// /app/news/page.tsx
import { Suspense } from 'react';
import { fetchNews } from '../actions/news';
import NewsPageClient from './NewsPageClient';

export default async function NewsPage() {
  const initialNews = await fetchNews({
    category: 'all',
    timeframe: '24h',
    limit: 20,
  });

  return (
    <Suspense fallback={<LoadingState />}>
      <NewsPageClient initialNews={initialNews} />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

### Client Component
```typescript
// /app/news/NewsPageClient.tsx
'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import CategoryTabs from '@/components/news/CategoryTabs';
import NewsCard from '@/components/news/NewsCard';
import { NewsItem, NewsFilter, Category } from '@/types';

export default function NewsPageClient({ initialNews }: { initialNews: NewsItem[] }) {
  const [news, setNews] = useState(initialNews);
  const [filters, setFilters] = useState<NewsFilter>({
    category: 'all',
    timeframe: '24h',
    sortBy: 'latest',
  });
  const [loading, setLoading] = useState(false);

  // Fetch news when filters change
  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      const response = await fetch('/api/news?' + new URLSearchParams(filters as any));
      const data = await response.json();
      setNews(data);
      setLoading(false);
    };

    loadNews();
  }, [filters]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-0 md:ml-[200px] p-8">
        <h1 className="text-3xl font-bold text-text-primary mb-6">News</h1>

        {/* Category Tabs */}
        <CategoryTabs
          activeCategory={filters.category || 'all'}
          onCategoryChange={(category) => setFilters({ ...filters, category })}
        />

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            className="bg-card-bg border border-border rounded px-4 py-2 text-text-primary"
            value={filters.timeframe}
            onChange={(e) => setFilters({ ...filters, timeframe: e.target.value as any })}
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="all">All Time</option>
          </select>

          <select
            className="bg-card-bg border border-border rounded px-4 py-2 text-text-primary"
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
          >
            <option value="latest">Latest</option>
            <option value="impact">Impact</option>
            <option value="trending">Trending</option>
          </select>
        </div>

        {/* News Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            No news found. Try adjusting your filters.
          </div>
        ) : (
          <div className="max-w-4xl">
            {news.map(item => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

### API Route
```typescript
// /app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchNews } from '@/app/actions/news';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const filters = {
    category: searchParams.get('category') as any,
    timeframe: searchParams.get('timeframe') as any,
    sortBy: searchParams.get('sortBy') as any,
    search: searchParams.get('search') || undefined,
    limit: parseInt(searchParams.get('limit') || '20'),
    offset: parseInt(searchParams.get('offset') || '0'),
  };

  const news = await fetchNews(filters);

  return NextResponse.json(news);
}
```

---

## Day 6-7: Testing & Polish (4-6 hours)

### Manual Testing Checklist
- [ ] Page loads successfully
- [ ] News articles display correctly
- [ ] Category tabs work
- [ ] Time filter works
- [ ] Sort options work
- [ ] Images load (or fallback works)
- [ ] Links open correctly
- [ ] Mobile responsive
- [ ] Dark mode looks good
- [ ] No console errors

### Performance Testing
- [ ] Page loads in <2s
- [ ] Lighthouse score >80
- [ ] No layout shift
- [ ] Images lazy load

### Polish
- [ ] Add loading skeletons
- [ ] Add error states
- [ ] Add empty states
- [ ] Improve hover effects
- [ ] Add transitions
- [ ] Test on mobile device

---

## Launch Checklist

### Before Going Live:
- [ ] All tests pass
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Mobile works
- [ ] Accessibility checked
- [ ] Error handling in place
- [ ] Monitoring set up

### Launch Day:
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Fix critical issues immediately

### Week 1 Post-Launch:
- [ ] Track metrics (visits, reads, clicks)
- [ ] User interviews (5-10 users)
- [ ] Identify pain points
- [ ] Plan improvements
- [ ] Celebrate! 🎉

---

## What to Skip (For Now)

Don't build these in Week 1:
- ❌ AI summaries (add in Week 2)
- ❌ Sentiment analysis
- ❌ Real-time WebSocket
- ❌ Notifications
- ❌ Saved articles
- ❌ User comments
- ❌ Advanced visualizations

**Why?** Get core working first, then enhance.

---

## Common Pitfalls to Avoid

1. **Over-engineering** - Don't build everything at once
2. **Poor API management** - Cache aggressively, don't hit rate limits
3. **Slow page loads** - Optimize images, lazy load
4. **Bad mobile UX** - Test on real devices early
5. **No error handling** - APIs fail, handle gracefully
6. **Ignoring accessibility** - Add ARIA labels, keyboard nav

---

## Success = Basic Feed Working

**Minimum viable feature:**
- News articles display
- Can filter by category
- Can sort
- Links work
- Looks good
- No major bugs

**That's it!** Ship it, then iterate.

---

## Need Help?

**Stuck on something?**
1. Check the detailed docs (`/tasks/news-*`)
2. Review code examples
3. Search error message
4. Ask for help (team/forums)

**Moving too slow?**
- Cut scope (fewer categories, simpler UI)
- Use more third-party libraries
- Focus on core functionality
- Polish can come later

**Moving too fast?**
- Good! But test thoroughly
- Don't skip accessibility
- Document as you go
- Think about maintenance

---

## Week 2 Preview

Once basic feed works:
- Add AI summaries (big value add)
- Improve market linking
- Add sentiment indicators
- Polish UI based on feedback
- Optimize performance

---

**You've got this! Start with Day 1 and build momentum.** 🚀

# News Page UI Wireframes & Design Spec

**Purpose:** Visual guide for implementing the /news page UI

**Design System:** Follows existing OddScreener design patterns

---

## Color Palette (from existing app)

```css
--background: #0a0a0f
--card-bg: #131318
--border: #1f1f29
--text-primary: #e8e8f0
--text-secondary: #9494a8
--accent: #6366f1 (indigo)
--success: #10b981 (green)
--danger: #ef4444 (red)
--warning: #f59e0b (yellow)
```

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar (200px)  │           Main Content Area                 │
│                   │                                              │
│  [Logo]           │  ┌─────────────────────────────────────┐   │
│                   │  │     Category Tabs                    │   │
│  Markets          │  │  🏛️ Politics  ₿ Crypto  ⚽ Sports   │   │
│  News      ◄─     │  └─────────────────────────────────────┘   │
│  Whales           │                                              │
│  Insiders         │  ┌─────────────────────────────────────┐   │
│  Watchlist        │  │  Filters & Search Bar                │   │
│                   │  │  [Time▾] [Source▾] [🔍 Search...]   │   │
│                   │  └─────────────────────────────────────┘   │
│                   │                                              │
│                   │  ┌─────────────────────────────────────┐   │
│                   │  │  Trending Topics (scrollable)        │   │
│                   │  │  🔥 Trump Trial  Bitcoin ETF  War    │   │
│                   │  └─────────────────────────────────────┘   │
│                   │                                              │
│                   │  ┌─────────────────────────────────────┐   │
│                   │  │  News Card 1                         │   │
│                   │  └─────────────────────────────────────┘   │
│                   │  ┌─────────────────────────────────────┐   │
│                   │  │  News Card 2                         │   │
│                   │  └─────────────────────────────────────┘   │
│                   │  ┌─────────────────────────────────────┐   │
│                   │  │  News Card 3                         │   │
│                   │  └─────────────────────────────────────┘   │
│                   │                                              │
│                   │  [Load More...]                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Designs

### 1. News Card (Standard)

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────┐                                                    │
│  │      │  Reuters                              2 hours ago  │
│  │ IMG  │  🔥🔥 High Impact                                 │
│  │      │                                                    │
│  └──────┘  Trump Indicted on Federal Charges                │
│                                                              │
│  Former President Donald Trump was indicted today on        │
│  federal charges related to classified documents. This      │
│  marks the first time a former president has faced...       │
│                                                              │
│  📊 Related Markets:                                        │
│  ┌───────────────────────┐  ┌──────────────────────────┐  │
│  │ Trump Convicted 2024  │  │ Trump Wins 2024          │  │
│  │ 68% ↑ 5.2% | $2.4M    │  │ 42% ↓ 3.1% | $8.1M       │  │
│  └───────────────────────┘  └──────────────────────────┘  │
│                                                              │
│  🟢 Sentiment: +72 (Bullish for conviction market)          │
│                                                              │
│  [💾 Save] [🔗 Share] [→ Read Full Article]                 │
└─────────────────────────────────────────────────────────────┘
```

**Design Notes:**
- Card background: `var(--card-bg)` with border `var(--border)`
- Source badge: Small logo + name (top left)
- Impact indicator: 🔥 emoji count based on score
- Timestamp: Relative time ("2 hours ago")
- Market chips: Hover shows more details
- Sentiment: Color-coded (green/yellow/red)
- Actions: Icon buttons at bottom

**Code Structure:**
```tsx
<div className="news-card bg-card-bg border border-border rounded-lg p-6 mb-4 hover:border-accent transition">
  {/* Header */}
  <div className="flex items-start gap-4">
    {imageUrl && (
      <img src={imageUrl} className="w-24 h-24 object-cover rounded" />
    )}
    <div className="flex-1">
      <div className="flex justify-between items-start mb-2">
        <SourceBadge source={source} />
        <span className="text-sm text-text-secondary">{timestamp}</span>
      </div>
      {impactScore >= 80 && (
        <div className="text-warning mb-2">🔥🔥🔥 Critical Impact</div>
      )}
      <h3 className="text-xl font-semibold text-text-primary mb-2">
        {title}
      </h3>
    </div>
  </div>

  {/* Excerpt */}
  <p className="text-text-secondary mb-4">{excerpt}</p>

  {/* Related Markets */}
  <div className="mb-4">
    <div className="text-sm text-text-secondary mb-2">📊 Related Markets:</div>
    <div className="flex flex-wrap gap-2">
      {relatedMarkets.map(market => (
        <MarketChip key={market.id} market={market} />
      ))}
    </div>
  </div>

  {/* Sentiment */}
  {sentiment && (
    <div className="mb-4 flex items-center gap-2">
      <SentimentIndicator score={sentiment.score} />
      <span className="text-sm">{sentiment.label}</span>
    </div>
  )}

  {/* Actions */}
  <div className="flex gap-4 text-sm">
    <button className="text-text-secondary hover:text-accent">
      💾 Save
    </button>
    <button className="text-text-secondary hover:text-accent">
      🔗 Share
    </button>
    <a href={url} className="text-accent hover:underline">
      → Read Full Article
    </a>
  </div>
</div>
```

---

### 2. Category Tabs

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🏛️ Politics (23)  ₿ Crypto (12)  ⚽ Sports (8)  📈 Finance (15) │
│  ═══════════                                                    │
│                                                                 │
│  🌍 World (19)  💻 Tech (7)  🔬 Science (3)  🎭 Culture (5)     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Design Notes:**
- Horizontal scrollable on mobile
- Active tab: Underline with accent color + bold text
- Badge count: Shows unread articles in category
- Icons: Emoji for visual recognition
- Sticky at top when scrolling

**Code:**
```tsx
<div className="category-tabs flex overflow-x-auto gap-6 border-b border-border pb-4 sticky top-0 bg-background z-10">
  {categories.map(cat => (
    <button
      key={cat.id}
      className={`flex items-center gap-2 whitespace-nowrap transition ${
        activeCategory === cat.id
          ? 'text-accent border-b-2 border-accent font-semibold'
          : 'text-text-secondary hover:text-text-primary'
      }`}
      onClick={() => setActiveCategory(cat.id)}
    >
      <span className="text-xl">{cat.icon}</span>
      <span>{cat.name}</span>
      {cat.unreadCount > 0 && (
        <span className="bg-accent text-white text-xs px-2 py-1 rounded-full">
          {cat.unreadCount}
        </span>
      )}
    </button>
  ))}
</div>
```

---

### 3. Filter Bar

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Time ▾]  [Source ▾]  [Sort ▾]    [🔍 Search news...]  [×]    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Dropdowns Design:**

**Time Filter:**
```
┌──────────────────┐
│ ● Last Hour      │  🔴 LIVE
│   Last 6 Hours   │
│   Last 24 Hours  │ ← (default)
│   Last Week      │
│   All Time       │
└──────────────────┘
```

**Source Filter:**
```
┌──────────────────────────┐
│ [×] Select All           │
│                          │
│ ☑ Reuters          ⭐⭐⭐ │
│ ☑ Bloomberg        ⭐⭐⭐ │
│ ☑ Associated Press ⭐⭐⭐ │
│ ☐ CNBC             ⭐⭐  │
│ ☐ Politico         ⭐⭐  │
│ ☐ CoinDesk         ⭐⭐  │
│                          │
│ [Clear] [Apply]          │
└──────────────────────────┘
```

**Code:**
```tsx
<div className="filters flex items-center gap-4 mb-6">
  {/* Time */}
  <Dropdown
    trigger={<button className="btn-filter">Time ▾</button>}
    options={timeOptions}
    value={timeFilter}
    onChange={setTimeFilter}
  />

  {/* Source */}
  <MultiSelectDropdown
    trigger={<button className="btn-filter">Source ▾</button>}
    options={sourceOptions}
    value={sourceFilter}
    onChange={setSourceFilter}
  />

  {/* Sort */}
  <Dropdown
    trigger={<button className="btn-filter">Sort ▾</button>}
    options={sortOptions}
    value={sortBy}
    onChange={setSortBy}
  />

  {/* Search */}
  <div className="flex-1 relative">
    <input
      type="text"
      placeholder="🔍 Search news..."
      className="w-full bg-card-bg border border-border rounded-lg px-4 py-2 text-text-primary"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
    {searchQuery && (
      <button
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
        onClick={() => setSearchQuery('')}
      >
        ×
      </button>
    )}
  </div>
</div>
```

---

### 4. Trending Topics

```
┌────────────────────────────────────────────────────────────────┐
│  🔥 Trending Now:                                              │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │ Trump Trial     │ │ Bitcoin ETF     │ │ Ukraine Peace   │ │
│  │ ↑ 145% (2h)     │ │ ↑ 89% (4h)      │ │ ↑ 67% (1h)      │ │
│  │ 23 articles     │ │ 18 articles     │ │ 12 articles     │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Design Notes:**
- Horizontal scroll
- Cards slightly elevated on hover
- Click to filter news by topic
- Auto-updates every 5 minutes

**Code:**
```tsx
<div className="trending-section mb-6">
  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
    🔥 <span>Trending Now</span>
  </h3>
  <div className="flex gap-4 overflow-x-auto pb-4">
    {trendingTopics.map(topic => (
      <div
        key={topic.id}
        className="trending-card min-w-[200px] bg-card-bg border border-border rounded-lg p-4 cursor-pointer hover:border-accent transition"
        onClick={() => filterByTopic(topic)}
      >
        <h4 className="font-semibold text-text-primary mb-2">
          {topic.name}
        </h4>
        <div className="text-success text-sm mb-1">
          ↑ {topic.velocity}% ({topic.timeframe})
        </div>
        <div className="text-text-secondary text-sm">
          {topic.articleCount} articles
        </div>
      </div>
    ))}
  </div>
</div>
```

---

### 5. Market Chip (in News Card)

```
┌─────────────────────────────┐
│ Trump Convicted 2024        │
│ 68% ↑ 5.2% | $2.4M          │
│ [Bet Now]                   │
└─────────────────────────────┘
```

**Hover State:**
```
┌─────────────────────────────────────┐
│ Trump Convicted 2024                │
│                                     │
│ Current: 68%                        │
│ Change 24h: ↑ 5.2%                  │
│ Volume: $2.4M                       │
│                                     │
│ [→ View Market] [Bet Now]           │
└─────────────────────────────────────┘
```

**Code:**
```tsx
<div className="market-chip bg-background border border-border rounded px-3 py-2 hover:border-accent transition cursor-pointer group relative">
  {/* Basic View */}
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm font-medium text-text-primary">
        {market.name}
      </div>
      <div className="text-xs text-text-secondary">
        {market.probability}%
        <span className={market.change24h > 0 ? 'text-success' : 'text-danger'}>
          {market.change24h > 0 ? '↑' : '↓'} {Math.abs(market.change24h)}%
        </span>
        {' | '}
        ${formatVolume(market.volume24h)}
      </div>
    </div>
  </div>

  {/* Hover Tooltip */}
  <div className="absolute hidden group-hover:block top-full left-0 mt-2 bg-card-bg border border-accent rounded-lg p-4 z-10 shadow-lg min-w-[250px]">
    <h4 className="font-semibold text-text-primary mb-3">
      {market.name}
    </h4>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-text-secondary">Current:</span>
        <span className="text-text-primary">{market.probability}%</span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">Change 24h:</span>
        <span className={market.change24h > 0 ? 'text-success' : 'text-danger'}>
          {market.change24h > 0 ? '↑' : '↓'} {Math.abs(market.change24h)}%
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-secondary">Volume:</span>
        <span className="text-text-primary">
          ${formatVolume(market.volume24h)}
        </span>
      </div>
    </div>
    <div className="flex gap-2 mt-4">
      <Link href={`/market/${market.id}`} className="btn-secondary flex-1">
        → View Market
      </Link>
      <button className="btn-primary flex-1">Bet Now</button>
    </div>
  </div>
</div>
```

---

### 6. High-Impact News Card (Special Treatment)

```
┌═══════════════════════════════════════════════════════════════┐
║  ⚠️ CRITICAL MARKET-MOVING NEWS                              ║
║                                                                ║
║  ┌──────┐                                                     ║
║  │      │  Bloomberg                              5 min ago  ║
║  │ IMG  │  🔥🔥🔥 CRITICAL IMPACT                              ║
║  │      │                                                     ║
║  └──────┘  FED ANNOUNCES EMERGENCY RATE HIKE                 ║
║                                                                ║
║  Federal Reserve announced an unprecedented emergency rate   ║
║  hike of 100 basis points, citing inflation concerns...      ║
║                                                                ║
║  🔔 8 MARKETS AFFECTED | $12.4M TOTAL VOLUME                  ║
║                                                                ║
║  📊 Major Market Moves:                                       ║
║  • Recession 2024: 45% → 72% (↑ 27%)                         ║
║  • Inflation >5%: 28% → 55% (↑ 27%)                          ║
║  • Fed Rate >6%: 12% → 48% (↑ 36%)                           ║
║  [+ Show 5 more markets]                                      ║
║                                                                ║
║  🤖 AI Summary:                                               ║
║  Unexpected emergency rate hike signals Fed's serious        ║
║  concern about inflation. Markets pricing in much higher     ║
║  recession risk.                                              ║
║                                                                ║
║  [💾 Save] [🔗 Share] [→ Read Full Article] [Trade Now →]    ║
╚═══════════════════════════════════════════════════════════════╝
```

**Design Notes:**
- Double border (use `border-2` and `border-warning` or `border-danger`)
- Larger card, more prominence
- Shows multiple affected markets
- AI summary always visible
- "Trade Now" CTA button

---

### 7. Empty States

**No Results:**
```
┌─────────────────────────────────────┐
│                                     │
│           📰                         │
│                                     │
│    No news found                    │
│                                     │
│    Try adjusting your filters or    │
│    search for something else.       │
│                                     │
│    [Clear Filters]                  │
│                                     │
└─────────────────────────────────────┘
```

**Loading:**
```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐   │  ← Skeleton
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │   │
│  │ ▓▓▓▓▓▓▓▓▓▓                  │   │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓        │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │   │
│  │ ▓▓▓▓▓▓▓▓▓▓                  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Error:**
```
┌─────────────────────────────────────┐
│                                     │
│           ⚠️                         │
│                                     │
│    Failed to load news              │
│                                     │
│    We couldn't fetch the latest     │
│    news. Please try again.          │
│                                     │
│    [Retry]                          │
│                                     │
└─────────────────────────────────────┘
```

---

### 8. Mobile Layout (< 640px)

```
┌─────────────────────────────┐
│  ☰  News        [🔍] [⚙️]   │
├─────────────────────────────┤
│                             │
│  Swipe → for categories     │
│  👈 Politics | Crypto 👉    │
│                             │
├─────────────────────────────┤
│  [Time ▾] [Source ▾]        │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐ │
│  │ News Card (stacked)   │ │
│  │ [IMG]                 │ │
│  │ Title...              │ │
│  │ Excerpt...            │ │
│  │ Markets ↓             │ │
│  └───────────────────────┘ │
│                             │
│  ┌───────────────────────┐ │
│  │ News Card 2           │ │
│  └───────────────────────┘ │
│                             │
│  [Load More]                │
│                             │
└─────────────────────────────┘
```

**Mobile Optimizations:**
- Hamburger menu for sidebar
- Category tabs → horizontal swipe
- Search icon → expands to full bar
- Cards stack vertically (full width)
- Related markets collapse by default
- Pull-to-refresh gesture
- Infinite scroll
- Larger tap targets (44px min)

---

## Accessibility Features

### Screen Reader Support
```tsx
<article aria-label={`News article: ${title}`}>
  <h3 id={`article-${id}`}>{title}</h3>
  <p aria-describedby={`article-${id}`}>{excerpt}</p>

  <div role="list" aria-label="Related prediction markets">
    {markets.map(market => (
      <div role="listitem" key={market.id}>
        <Link
          href={`/market/${market.id}`}
          aria-label={`${market.name}, currently at ${market.probability}%, changed ${market.change24h}% in 24 hours`}
        >
          {market.name}
        </Link>
      </div>
    ))}
  </div>
</article>
```

### Keyboard Navigation
- Tab through cards
- Enter to open article
- Arrow keys for categories
- Escape to close dropdowns
- Shortcuts: `/` for search

### Focus Indicators
```css
.news-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

button:focus-visible {
  ring: 2px solid var(--accent);
}
```

---

## Animations

### Card Hover
```css
.news-card {
  transition: all 0.2s ease;
}

.news-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
  border-color: var(--accent);
}
```

### New Article Appear
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.news-card.new {
  animation: slideIn 0.3s ease-out;
}
```

### Loading Skeleton Pulse
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.skeleton {
  animation: pulse 1.5s ease-in-out infinite;
  background: linear-gradient(
    90deg,
    var(--card-bg) 0%,
    var(--border) 50%,
    var(--card-bg) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## Responsive Breakpoints

```css
/* Mobile First */
.news-container {
  padding: 1rem;
}

/* Tablet */
@media (min-width: 640px) {
  .news-container {
    padding: 2rem;
  }

  .news-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .news-container {
    margin-left: 200px; /* Sidebar width */
    padding: 2.5rem;
  }

  .news-grid {
    grid-template-columns: repeat(1, 1fr); /* Single column for readability */
    max-width: 900px;
    margin: 0 auto;
  }
}

/* Large Desktop */
@media (min-width: 1440px) {
  .news-grid {
    max-width: 1100px;
  }
}
```

---

## Performance Optimizations

### Image Loading
```tsx
<Image
  src={imageUrl}
  alt={title}
  width={200}
  height={200}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/..." // Low-quality placeholder
/>
```

### Infinite Scroll
```tsx
import { useInView } from 'react-intersection-observer';

function NewsFeed() {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px', // Load before reaching bottom
  });

  useEffect(() => {
    if (inView && hasMore) {
      loadMoreNews();
    }
  }, [inView]);

  return (
    <div>
      {news.map(item => <NewsCard key={item.id} {...item} />)}
      <div ref={ref} className="h-10" />
      {loading && <LoadingSkeleton />}
    </div>
  );
}
```

### Virtual Scrolling (for large lists)
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualNewsFeed({ news }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: news.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Estimated card height
    overscan: 5, // Render 5 extra items
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <NewsCard {...news[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing Checklist

### Visual Testing
- [ ] Cards render correctly
- [ ] Images load and display properly
- [ ] Text is readable (contrast check)
- [ ] Hover states work
- [ ] Active states clear
- [ ] Loading states smooth
- [ ] Error states informative
- [ ] Empty states helpful

### Interaction Testing
- [ ] Category tabs switch content
- [ ] Filters update results
- [ ] Search works
- [ ] Sorting changes order
- [ ] Infinite scroll loads more
- [ ] Market chips clickable
- [ ] Save/share buttons work
- [ ] External links open correctly

### Responsive Testing
- [ ] Mobile (375px) ✓
- [ ] Tablet (768px) ✓
- [ ] Desktop (1024px) ✓
- [ ] Large (1440px+) ✓
- [ ] Landscape orientation ✓
- [ ] Touch gestures work ✓

### Accessibility Testing
- [ ] Keyboard navigation ✓
- [ ] Screen reader friendly ✓
- [ ] Focus indicators visible ✓
- [ ] ARIA labels correct ✓
- [ ] Color contrast passes ✓
- [ ] Text scalable ✓

---

## Design Tokens (for reference)

```typescript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      spacing: {
        'card-padding': '1.5rem',
        'section-gap': '2rem',
      },
      borderRadius: {
        'card': '0.5rem',
        'chip': '0.375rem',
      },
      fontSize: {
        'news-title': ['1.25rem', { lineHeight: '1.75rem' }],
        'news-excerpt': ['0.875rem', { lineHeight: '1.5rem' }],
        'market-label': ['0.75rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'card-hover': '0 4px 12px rgba(99, 102, 241, 0.15)',
        'card-focus': '0 0 0 2px rgba(99, 102, 241, 0.5)',
      },
    },
  },
};
```

---

## Next Steps

1. **Review designs** with team
2. **Create Figma mockups** (optional, these wireframes may suffice)
3. **Start with NewsCard component** (most important)
4. **Build category tabs**
5. **Implement filters**
6. **Assemble full page**
7. **Test on devices**
8. **Iterate based on feedback**

---

**Design Philosophy:** Clean, scannable, trader-focused. Every element should serve a purpose.

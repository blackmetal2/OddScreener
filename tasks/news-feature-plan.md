# News Page Feature Plan for OddScreener
## Comprehensive Design Document

**Created:** 2025-12-24
**Status:** Planning Phase
**Target:** /news page for prediction markets screener

---

## Executive Summary

The /news page should serve as an **intelligent news aggregation and analysis hub** that helps prediction market traders:
1. **Discover** market-moving events before they fully price in
2. **Understand** the connection between news and market movements
3. **Track** developing stories that affect their positions
4. **Gain edge** through sentiment analysis and impact scoring

This is not just a news feed—it's a **trading intelligence tool**.

---

## Core Design Philosophy

### Key Principles
1. **Signal over Noise**: Only show news that matters to prediction markets
2. **Context First**: Always show news in relation to markets it affects
3. **Actionable Intelligence**: Every news item should help make better trades
4. **Speed Matters**: Breaking news can move markets—show it instantly
5. **Trader-Centric**: Design for active traders, not passive news consumers

---

## Feature Breakdown by Priority

## MUST-HAVE Features (MVP - Phase 1)

### 1. Core News Feed
**Why it matters:** Foundation of the entire news experience

**Features:**
- **Card-based layout** with title, source, timestamp, and excerpt
- **Infinite scroll** with pagination
- **Source badges** with color coding (Reuters=red, Bloomberg=blue, etc.)
- **Timestamp display** showing "2m ago", "1h ago" with exact time on hover
- **Image thumbnails** when available
- **Read/Unread states** to track what user has seen
- **Quick actions**: Save, Share, Open Original

**Technical Implementation:**
```typescript
interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  source: NewsSource;
  publishedAt: Date;
  url: string;
  imageUrl?: string;
  author?: string;
  readByUser: boolean;
  savedByUser: boolean;

  // Market integration
  relatedMarketIds: string[];
  primaryCategory: Category;
  tags: string[];

  // Analytics
  impactScore?: number;
  sentimentScore?: number;
  trendingScore?: number;
}

interface NewsSource {
  id: string;
  name: string;
  logoUrl: string;
  reliability: 'high' | 'medium' | 'low';
  color: string;
}
```

---

### 2. Market Integration - Related Markets
**Why it matters:** Context is everything in prediction markets

**Features:**
- **Inline market chips** showing affected markets below each news item
- **Quick stats** on each chip: current probability, 24h change, volume
- **Click to navigate** to market detail page
- **Visual indicators** showing if market moved after news (↑5% in green)
- **"Bet Now" quick action** on each market chip

**UI Design:**
```
[News Card]
├─ Headline
├─ Excerpt
├─ Source + Time
└─ Related Markets:
   ┌──────────────────────────────┐
   │ 🔥 Trump Wins 2024           │ ↑ 5.2% | 72% | $2.4M
   ├──────────────────────────────┤
   │ 📊 GOP Senate Majority       │ ↑ 2.1% | 85% | $890K
   └──────────────────────────────┘
```

---

### 3. Category Filtering
**Why it matters:** Traders specialize—let them focus on their domains

**Categories:**
- Politics (🏛️)
- Crypto (₿)
- Sports (⚽)
- Finance (📈)
- World Events (🌍)
- Tech (💻)
- Science (🔬)
- Culture (🎭)

**Implementation:**
- **Horizontal tab bar** at top
- **Badge count** showing unread items per category
- **Multi-select mode** for power users
- **URL persistence** (/news?category=politics,crypto)
- **Keyboard shortcuts** (1-8 for categories)

---

### 4. Time Filtering
**Why it matters:** Recency matters in fast-moving markets

**Options:**
- Last Hour (🔴 LIVE)
- Last 6 Hours
- Last 24 Hours
- Last Week
- All Time

**Special Feature:**
- **"Breaking"** tag for news less than 5 minutes old
- **Auto-refresh** for "Last Hour" view (every 30 seconds)
- **Push notifications** option for breaking news

---

### 5. Search Functionality
**Why it matters:** Traders need to research specific topics/markets

**Features:**
- **Real-time search** as you type
- **Search across**: Headlines, content, sources, tags
- **Advanced filters**: Source, date range, impact score
- **Search suggestions** based on trending topics
- **Recent searches** saved locally
- **Market name autocomplete** to find related news

**Search Bar Design:**
```
┌─────────────────────────────────────────────────┐
│ 🔍 Search news... (e.g., "Trump", "Bitcoin")    │
└─────────────────────────────────────────────────┘
  Filters: [Source ▾] [Date ▾] [Impact ▾]
```

---

### 6. Source Filtering
**Why it matters:** Traders trust different sources

**Implementation:**
- **Multi-select dropdown** with source logos
- **Reliability badges**: ⭐⭐⭐ for tier-1 sources
- **Custom source lists**: "My Trusted Sources"
- **Source statistics**: Show track record of market predictions

**Top Sources:**
- Tier 1: Reuters, Bloomberg, Associated Press, Wall Street Journal
- Tier 2: CNBC, Financial Times, The Economist
- Crypto: CoinDesk, The Block, Decrypt
- Politics: Politico, The Hill, FiveThirtyEight
- Sports: ESPN, The Athletic

---

### 7. Basic Sorting
**Why it matters:** Different contexts need different views

**Sort Options:**
- **Latest** (default) - Newest first
- **Impact Score** - Biggest market movers first
- **Trending** - Most engagement from traders
- **Most Markets** - News affecting multiple markets

---

## NICE-TO-HAVE Features (Phase 2)

### 8. Price Impact Visualization
**Why it matters:** Show cause and effect in real-time

**Features:**
- **Timeline overlay** showing market price + news events
- **Before/After comparison**: Price 10min before vs 10min after news
- **Impact magnitude indicator**: 🔥🔥🔥 for major moves
- **Historical correlation**: "Similar news moved markets by X%"

**Visual Example:**
```
📰 News: "Trump announces tariff plan"
├─ Published: 2:15 PM
├─ Market Reaction:
│  └─ Trump 2024 Win: 68% → 72% (+4%) in 15 minutes
└─ Impact Score: 🔥🔥🔥 (High)
```

---

### 9. Sentiment Analysis
**Why it matters:** Gauge market psychology and potential reactions

**Implementation:**
- **AI sentiment scoring**: -100 (very negative) to +100 (very positive)
- **Visual indicator**: Red/yellow/green color coding
- **Sentiment breakdown**: What makes it bullish/bearish
- **Sentiment trends**: How sentiment is changing over time
- **Contrarian indicators**: When sentiment diverges from market price

**Display:**
```
Sentiment: 🟢 +72 (Bullish)
├─ Key Phrases: "strong economy", "record growth"
├─ Market Implications: Likely positive for Biden odds
└─ Trader Consensus: 85% bullish
```

---

### 10. News Impact Scores
**Why it matters:** Prioritize what actually matters

**Scoring Algorithm:**
```typescript
ImpactScore = (
  sourceReliability * 0.3 +
  marketMovementSize * 0.3 +
  affectedMarketVolume * 0.2 +
  traderEngagement * 0.2
)
```

**Score Levels:**
- 🔥🔥🔥 Critical (90-100): Major market-moving news
- 🔥🔥 High (70-89): Significant impact
- 🔥 Medium (50-69): Notable but not major
- ⚪ Low (0-49): Informational only

**Visual Treatment:**
- High-impact news gets **larger cards**
- **Banner treatment** for critical news
- **Color-coded borders** by impact level

---

### 11. Trending Topics
**Why it matters:** Find emerging narratives before markets fully react

**Features:**
- **Topic cloud** showing what's trending
- **Velocity indicators**: Topics trending UP or DOWN
- **Topic detail pages**: All news about a topic
- **Topic alerts**: Get notified when topic gains traction
- **Related markets** for each topic

**Example Display:**
```
🔥 Trending Now:
┌────────────────┬────────────────┬────────────────┐
│ Trump Trial    │ Bitcoin ETF    │ Ukraine Peace  │
│ ↑ 145% (2h)    │ ↑ 89% (4h)     │ ↑ 67% (1h)     │
│ 23 articles    │ 18 articles    │ 12 articles    │
└────────────────┴────────────────┴────────────────┘
```

---

### 12. AI-Generated Summaries
**Why it matters:** Save time, get to the insight faster

**Features:**
- **One-line summary** for quick scanning
- **3-bullet TL;DR** for deeper understanding
- **Market implications summary**: "What this means for traders"
- **Key facts extracted**: Names, dates, numbers
- **Update summaries**: "What's changed since last update"

**Implementation:**
- Use Claude or GPT-4 for summarization
- Cache summaries to reduce API costs
- Show "AI Summary" badge for transparency
- Allow user feedback to improve summaries

---

### 13. Personalized Feed
**Why it matters:** Show users what they care about

**Personalization Based On:**
- **Watchlist markets**: News affecting markets you're watching
- **Trading history**: News in categories you trade
- **Read history**: More of what you engage with
- **Manual preferences**: Topics/sources you select

**Features:**
- **"For You" tab** with personalized feed
- **Explanation labels**: "Based on your watchlist"
- **Easy customization**: ⚙️ button to adjust preferences
- **Privacy-first**: All personalization local, no server tracking

---

### 14. Multi-Market News
**Why it matters:** Some news affects entire market sectors

**Features:**
- **Sector impact indicators**: "Affects 12 crypto markets"
- **Expandable market lists**: Click to see all affected markets
- **Aggregate impact**: Show total volume of affected markets
- **Cascade effects**: "Also affects related markets..."

**Example:**
```
📰 "Fed raises interest rates"
├─ Direct Impact: 8 markets
│  ├─ Recession 2024: 72% → 68%
│  ├─ Inflation >3%: 45% → 41%
│  └─ [+6 more] ▾
└─ Indirect Impact: 23 markets (Finance, Crypto)
```

---

### 15. News Alerts & Notifications
**Why it matters:** Never miss market-moving news

**Alert Types:**
- **Breaking news** in selected categories
- **High-impact news** (score >80)
- **Watchlist alerts**: News affecting your markets
- **Keyword alerts**: Custom triggers
- **Price + News combo**: "Market moved 5% + news published"

**Delivery Options:**
- Browser push notifications
- Email digests (hourly, daily)
- In-app notification center
- Optional: Telegram/Discord webhooks

**Smart Throttling:**
- Group similar alerts to avoid spam
- "Quiet hours" setting
- Alert frequency limits (max 10/hour)

---

### 16. News Timeline View
**Why it matters:** Track developing stories chronologically

**Features:**
- **Vertical timeline** showing news in chronological order
- **Story clustering**: Group related articles
- **Update indicators**: "5 updates in last 2 hours"
- **Key events highlighted**: Major developments marked
- **Time scrubbing**: Slide to see news from any time period

**UI Pattern:**
```
Timeline View
│
├─ 3:45 PM ━━━━━━━━━━━━━
│  📰 Breaking: Trump indicted
│  └─ Impact: +5% on conviction markets
│
├─ 2:30 PM ━━━━━━━━━━━━━
│  📰 Trump arrives at courthouse
│  └─ 2 updates
│
├─ 1:15 PM ━━━━━━━━━━━━━
│  📰 Reports of imminent indictment
│  └─ Rumor (unconfirmed)
```

---

## FUTURE Features (Phase 3+)

### 17. News Chat / Discussion
**Why it matters:** Community insights add value

**Features:**
- **Comment threads** on each news article
- **Trader sentiment polls**: "Bullish or bearish?"
- **Position sharing**: "I bought YES based on this"
- **Expert insights**: Verified traders can add analysis
- **Upvoting system**: Best insights rise to top

---

### 18. News-to-Trade Flow
**Why it matters:** Reduce friction from insight to action

**Features:**
- **Quick trade button** on news cards
- **Pre-filled trade modal** with relevant market
- **"Smart suggest"**: AI suggests position based on news
- **Multi-market trades**: One click to bet across related markets
- **Trade ideas**: "Others bought X after this news"

**Example Flow:**
```
1. User reads: "Biden approval rating hits new low"
2. Clicks "Trade on this" button
3. Modal opens with:
   - Market: "Biden Wins 2024"
   - Suggested position: Buy NO
   - Reasoning: "Approval rating correlates with re-election odds"
   - Similar trades: "73% of traders bought NO after similar news"
```

---

### 19. News Analytics Dashboard
**Why it matters:** Understand your news consumption patterns

**Metrics:**
- Articles read by category
- Average impact score of news you engage with
- Sources you trust most
- Topics you follow
- Reading streaks
- Time saved by AI summaries

---

### 20. Historical News Archive
**Why it matters:** Learn from the past

**Features:**
- **Search entire archive** going back months/years
- **Market resolution overlay**: See how news predicted outcomes
- **Accuracy analysis**: Which sources were right?
- **Pattern recognition**: Similar news scenarios
- **Market memory**: "Last time this happened, markets moved X%"

---

### 21. RSS Feed Integration
**Why it matters:** Let power users bring their own sources

**Features:**
- **Add custom RSS feeds**
- **Auto-categorization** of RSS content
- **Deduplication** across sources
- **Feed management UI**
- **OPML import/export**

---

### 22. News API for Power Users
**Why it matters:** Enable programmatic access for algo traders

**Endpoints:**
- `GET /api/news` - Fetch news with filters
- `GET /api/news/:id/impact` - Get impact analysis
- `GET /api/news/trending` - Get trending topics
- `WebSocket /ws/news` - Real-time news stream

---

### 23. Video News Integration
**Why it matters:** Video is increasingly important

**Features:**
- **YouTube integration** for relevant videos
- **Timestamp extraction**: Jump to relevant parts
- **Transcript search**: Find videos by keyword
- **Auto-play**: Watch while reading
- **Video summaries**: AI extracts key points

---

### 24. Social Media Integration
**Why it matters:** Twitter often breaks news first

**Features:**
- **Verified accounts feed**: Follow key influencers
- **Tweet threads** embedded in news
- **Social sentiment**: What's Twitter saying?
- **Viral detection**: Catch trending topics early
- **Fake news filtering**: Block unreliable sources

---

## Technical Architecture

### Data Sources Strategy

**Primary News Sources:**
1. **News APIs:**
   - NewsAPI.org (aggregator)
   - Bing News API
   - Google News RSS
   - Individual outlet APIs (if available)

2. **RSS Feeds:**
   - Bloomberg, Reuters, WSJ, etc.
   - Category-specific feeds
   - Custom curated lists

3. **Web Scraping (as fallback):**
   - Respectful rate limiting
   - robots.txt compliance
   - Only when no API available

4. **Social Media:**
   - Twitter API for verified accounts
   - Reddit for community sentiment

**News Processing Pipeline:**
```
1. Ingestion → 2. Deduplication → 3. Classification → 4. Market Linking → 5. Scoring → 6. Storage
```

---

### Database Schema

```typescript
// News table
Table news {
  id: string (PK)
  title: string
  excerpt: string
  content: text
  sourceId: string (FK)
  publishedAt: timestamp
  url: string
  imageUrl: string

  // Metadata
  categoryId: string (FK)
  tags: string[]
  language: string

  // Analytics
  impactScore: number
  sentimentScore: number
  trendingScore: number
  viewCount: number

  // Market relationships
  relatedMarkets: jsonb

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
  indexedAt: timestamp
}

// Market-News junction table
Table market_news {
  marketId: string (FK)
  newsId: string (FK)
  relevanceScore: number
  priceImpact: number
  timingDelay: number (seconds from news to price change)

  PK: (marketId, newsId)
}

// User interactions
Table user_news_interactions {
  userId: string (FK)
  newsId: string (FK)
  read: boolean
  saved: boolean
  readAt: timestamp

  PK: (userId, newsId)
}
```

---

### Real-Time Updates

**WebSocket Strategy:**
- Separate WS channel for news (`/ws/news`)
- Push new articles as they're indexed
- Push impact scores when calculated
- Push price changes for related markets

**Event Types:**
```typescript
type NewsEvent =
  | { type: 'NEW_ARTICLE', article: NewsItem }
  | { type: 'IMPACT_CALCULATED', newsId: string, score: number }
  | { type: 'MARKET_REACTION', newsId: string, marketId: string, change: number }
  | { type: 'TRENDING_UPDATE', topics: TrendingTopic[] }
```

---

### Caching Strategy

**Multi-Level Cache:**
1. **Browser Cache:**
   - News list (5 min)
   - Individual articles (15 min)
   - User preferences (local storage)

2. **CDN Cache:**
   - Static content (images, etc.)
   - Public news feeds

3. **Server Cache (Redis):**
   - Trending topics (1 min)
   - Impact scores (5 min)
   - Category feeds (2 min)

---

### Performance Targets

- **Initial Load:** <2s
- **Infinite Scroll:** <500ms per page
- **Search Results:** <300ms
- **Real-time Updates:** <100ms latency
- **News Indexing:** <30s from publication to display

---

## UI/UX Design Patterns

### Mobile-First Responsive Design

**Breakpoints:**
- Mobile: <640px (single column)
- Tablet: 640px-1024px (2 columns)
- Desktop: >1024px (3 columns + sidebar)

**Touch Optimizations:**
- Large tap targets (44px min)
- Swipe gestures for navigation
- Pull-to-refresh
- Bottom navigation for mobile

---

### Accessibility (WCAG 2.1 AA)

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast mode
- Text scaling support
- Skip links

---

### Dark Mode Support

- Automatic detection
- Manual toggle
- Separate color schemes for:
  - Impact scores (red/green)
  - Sentiment (red/yellow/green)
  - Sources
  - Card backgrounds

---

## Implementation Roadmap

### Phase 1: MVP (2-3 weeks)
**Must-Have Features (1-7)**
- Core news feed with cards
- Market integration (related markets)
- Category filtering
- Time filtering
- Basic search
- Source filtering
- Basic sorting

**Deliverables:**
- Functional /news page
- Basic news API integration
- Market linking logic
- Mobile-responsive UI

---

### Phase 2: Enhancement (3-4 weeks)
**Nice-to-Have Features (8-16)**
- Price impact visualization
- Sentiment analysis
- Impact scoring
- Trending topics
- AI summaries
- Personalized feed
- Multi-market news
- Alerts & notifications
- Timeline view

**Deliverables:**
- AI integration (Claude/GPT-4)
- WebSocket real-time updates
- Advanced analytics
- Notification system

---

### Phase 3: Advanced (4-6 weeks)
**Future Features (17-24)**
- News chat/discussion
- News-to-trade flow
- Analytics dashboard
- Historical archive
- RSS integration
- News API
- Video integration
- Social media feeds

**Deliverables:**
- Community features
- Advanced integrations
- Developer API
- Complete platform

---

## Success Metrics (KPIs)

### Engagement Metrics
- Daily active users on /news
- Average time spent on page
- Articles read per session
- Return visit rate
- Share rate

### Trading Metrics
- News-to-trade conversion rate
- Markets discovered via news
- Trades initiated from news page
- User-reported trade profits attributed to news

### Content Metrics
- News articles indexed daily
- Average time to indexing
- Market linkage accuracy
- Impact score accuracy
- Sentiment score accuracy

### Technical Metrics
- Page load time
- API response time
- WebSocket latency
- Error rate
- Uptime

**Target Goals (Month 3):**
- 50%+ of users visit /news weekly
- 5+ articles read per session
- 10%+ news-to-trade conversion
- <2s page load time
- >99.9% uptime

---

## Risk Assessment & Mitigation

### Risk 1: News API Costs
**Mitigation:**
- Start with free/low-cost APIs
- Cache aggressively
- Implement RSS as fallback
- Scale API tier based on growth

### Risk 2: Market Linking Accuracy
**Mitigation:**
- Start with manual curation for major markets
- Use keyword matching + AI for automation
- Implement user feedback loop
- Continuously train models

### Risk 3: Information Overload
**Mitigation:**
- Strong filtering/search
- Personalization
- Impact scoring to surface important news
- Clean, scannable UI

### Risk 4: Source Reliability
**Mitigation:**
- Whitelist trusted sources initially
- Reliability scoring system
- User reporting for fake news
- Editorial review for critical news

### Risk 5: Real-Time Performance
**Mitigation:**
- Efficient WebSocket implementation
- Horizontal scaling
- CDN for static content
- Database indexing optimization

---

## Competitive Analysis

### What Others Do Well
**Polymarket:** Clean news feed, market integration
**PredictIt:** Category filtering, simple UI
**Metaculus:** Question-focused news, community insights
**Twitter/X:** Real-time, community engagement

### What We'll Do Better
1. **Deeper market integration** - Show price impact live
2. **AI-powered insights** - Sentiment, summaries, impact scores
3. **Trader-centric UX** - Built for trading, not just reading
4. **Multi-market awareness** - Show cascading effects
5. **Personalization** - Learn what each user cares about

---

## Conclusion

The /news page should be **the fastest way for traders to stay informed and act on market-moving information**.

By combining:
- **Comprehensive news aggregation**
- **Intelligent market linking**
- **AI-powered analysis**
- **Real-time updates**
- **Trader-focused UX**

We create a tool that's **essential for serious prediction market traders**.

### Next Steps
1. ✅ Review this plan with stakeholders
2. ⬜ Create detailed wireframes
3. ⬜ Set up news API integrations
4. ⬜ Build MVP features (Phase 1)
5. ⬜ User testing & iteration
6. ⬜ Launch beta
7. ⬜ Iterate based on metrics

---

**Questions or feedback?** Let's discuss and refine this plan together.

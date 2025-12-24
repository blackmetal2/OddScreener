# News Data Sources & API Integration Guide

**Purpose:** Detailed guide on how to source news data for the /news page

**Last Updated:** 2025-12-24

---

## Overview: News Sourcing Strategy

### Three-Tier Approach

1. **Tier 1: Premium News APIs** (Paid, high quality)
   - Best for production
   - Reliable, comprehensive
   - Higher cost but worth it

2. **Tier 2: Free/Freemium APIs** (Good for MVP/testing)
   - Limited calls per day
   - Good enough for beta
   - Upgrade as you scale

3. **Tier 3: RSS Feeds** (Free, backup)
   - Always available
   - Manual aggregation
   - Good fallback option

---

## Recommended News APIs

### 🥇 NewsAPI.org (Recommended for MVP)

**Why Choose:**
- Easy to use, well-documented
- 80+ sources, multiple countries
- Good for aggregation
- Free tier for development

**Pricing:**
- **Developer:** Free (100 requests/day, 1 month old news)
- **Business:** $449/month (250,000 requests/month, full archive)
- **Enterprise:** Custom pricing

**Coverage:**
- General news from major outlets
- Business, technology, sports, politics
- Real-time updates
- Search functionality

**Sample API Call:**
```javascript
// Fetch latest news about "Trump"
const response = await fetch(
  'https://newsapi.org/v2/everything?q=Trump&sortBy=publishedAt&apiKey=YOUR_KEY'
);
const data = await response.json();

// Response structure:
{
  status: "ok",
  totalResults: 1247,
  articles: [
    {
      source: { id: "reuters", name: "Reuters" },
      author: "John Doe",
      title: "Trump announces...",
      description: "Former president...",
      url: "https://reuters.com/article/...",
      urlToImage: "https://...",
      publishedAt: "2025-12-24T10:30:00Z",
      content: "Full article text..."
    },
    // ... more articles
  ]
}
```

**Integration Steps:**
1. Sign up at newsapi.org
2. Get API key
3. Install in environment: `NEWSAPI_KEY=...`
4. Create service wrapper:

```typescript
// lib/services/newsapi.ts
export async function fetchNews(params: {
  query?: string;
  category?: string;
  from?: Date;
  sortBy?: 'publishedAt' | 'relevancy' | 'popularity';
}) {
  const url = new URL('https://newsapi.org/v2/everything');
  if (params.query) url.searchParams.set('q', params.query);
  if (params.category) url.searchParams.set('category', params.category);
  // ... more params
  url.searchParams.set('apiKey', process.env.NEWSAPI_KEY!);

  const response = await fetch(url.toString());
  const data = await response.json();
  return data.articles;
}
```

**Rate Limiting:**
- Implement caching (5-10 min)
- Queue requests if hitting limits
- Consider upgrading tier early

---

### 🥈 Bing News Search API (Microsoft)

**Why Choose:**
- Comprehensive global coverage
- Real-time results
- Strong categorization
- Good for specific topics

**Pricing:**
- **Free Tier:** 1,000 transactions/month
- **S1:** $4 per 1,000 transactions (up to 10M/month)
- Very cost-effective at scale

**Coverage:**
- Global news sources
- Real-time updates
- Image results
- Trending topics

**Sample API Call:**
```javascript
const response = await fetch(
  'https://api.bing.microsoft.com/v7.0/news/search?q=Bitcoin&count=20',
  {
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.BING_API_KEY
    }
  }
);
const data = await response.json();

// Response includes:
// - name (title)
// - url
// - description
// - datePublished
// - provider (source)
// - category
```

**Integration Steps:**
1. Azure account → Bing Search resource
2. Get API key
3. Similar wrapper as NewsAPI

---

### 🥉 Google News RSS (Free, No API Key)

**Why Choose:**
- Completely free
- No rate limits
- Google's news aggregation
- Good for testing

**Limitations:**
- No official API
- RSS only (harder to parse)
- Limited metadata
- Can be unreliable

**Usage:**
```javascript
// Fetch via RSS
const rssFeed = 'https://news.google.com/rss/search?q=Trump&hl=en-US&gl=US&ceid=US:en';

// Parse with library like 'rss-parser'
import Parser from 'rss-parser';
const parser = new Parser();
const feed = await parser.parseURL(rssFeed);

feed.items.forEach(item => {
  console.log(item.title, item.link, item.pubDate);
});
```

---

## Category-Specific Sources

### Politics News

**Recommended APIs:**
1. **NewsAPI** - Major outlets (Reuters, AP, Politico)
2. **FiveThirtyEight RSS** - Political analysis
3. **The Hill API** - Congressional news

**RSS Feeds:**
- Politico: `https://www.politico.com/rss/politics`
- The Hill: `https://thehill.com/feed/`
- RealClearPolitics: `https://www.realclearpolitics.com/index.xml`
- FiveThirtyEight: `https://fivethirtyeight.com/feed/`

**Keywords to Track:**
- "election", "poll", "campaign", "debate", "primary"
- Politician names: "Trump", "Biden", "Harris", etc.
- "approval rating", "senate", "congress"

---

### Crypto News

**Recommended APIs:**
1. **CryptoCompare News API** - Crypto-specific
2. **CoinGecko** - Market + news
3. **NewsAPI** - General crypto coverage

**Crypto-Specific RSS:**
- CoinDesk: `https://www.coindesk.com/arc/outboundfeeds/rss/`
- The Block: `https://www.theblockcrypto.com/rss.xml`
- Decrypt: `https://decrypt.co/feed`
- Bitcoin Magazine: `https://bitcoinmagazine.com/feed`

**CryptoCompare API:**
```javascript
// Free tier: 100,000 calls/month
const response = await fetch(
  'https://min-api.cryptocompare.com/data/v2/news/?lang=EN'
);
const data = await response.json();

// Returns crypto-specific news with sentiment
```

---

### Sports News

**Recommended APIs:**
1. **NewsAPI** - ESPN, The Athletic, etc.
2. **SportsData.io** - Comprehensive sports API
3. **RSS Feeds** - Free from major outlets

**RSS Feeds:**
- ESPN: `https://www.espn.com/espn/rss/news`
- The Athletic: (varies by sport)
- Yahoo Sports: `https://sports.yahoo.com/rss/`

**Keywords:**
- League names: "NFL", "NBA", "MLB", "UFC"
- Team names, player names
- "playoffs", "championship", "draft", "trade"

---

### Finance/Markets

**Recommended APIs:**
1. **Bloomberg Terminal API** (expensive, enterprise)
2. **Alpha Vantage** - Free stock news
3. **NewsAPI** - WSJ, FT, Bloomberg articles

**RSS Feeds:**
- Yahoo Finance: `https://finance.yahoo.com/news/rss/`
- MarketWatch: `http://feeds.marketwatch.com/marketwatch/topstories/`
- Seeking Alpha: `https://seekingalpha.com/feed.xml`

**Alpha Vantage API:**
```javascript
// Free: 25 requests/day
const response = await fetch(
  'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=YOUR_KEY'
);
// Returns financial news with sentiment scores
```

---

## AI Integration for News Processing

### Sentiment Analysis

**Option 1: Claude (Anthropic) - Recommended**

**Why:**
- Best-in-class understanding
- Nuanced sentiment
- Can explain reasoning

**Cost:** ~$3 per million tokens (input) / $15 per million (output)

**Usage:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeSentiment(article: string) {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Analyze the sentiment of this news article for prediction markets.

Article: "${article}"

Provide:
1. Sentiment score (-100 to +100)
2. Key phrases that indicate sentiment
3. Market implications (bullish/bearish)
4. Confidence level (low/medium/high)

Format as JSON.`
    }]
  });

  return JSON.parse(message.content[0].text);
}
```

**Option 2: OpenAI GPT-4**

**Cost:** Similar to Claude, slightly more expensive

**Option 3: Local Models (Hugging Face)**

**Why:**
- Free (after setup)
- Privacy (no external API)
- Full control

**Models:**
- `finiteautomata/bertweet-base-sentiment-analysis`
- `cardiffnlp/twitter-roberta-base-sentiment-latest`

**Setup:**
```bash
pip install transformers torch
```

```python
from transformers import pipeline

# Load model
sentiment_pipeline = pipeline("sentiment-analysis",
  model="finiteautomata/bertweet-base-sentiment-analysis")

# Analyze
result = sentiment_pipeline("Trump announces new policy")
# Returns: [{'label': 'POSITIVE', 'score': 0.98}]
```

---

### AI Summarization

**Best: Claude or GPT-4**

**Prompt Template:**
```typescript
async function summarizeArticle(article: NewsItem) {
  const prompt = `Summarize this news article for prediction market traders.

Title: ${article.title}
Content: ${article.content}

Provide:
1. One-sentence summary (max 20 words)
2. Three key bullet points
3. Market implications (which prediction markets might be affected)
4. Important facts (dates, numbers, names)

Format as JSON.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  });

  return JSON.parse(message.content[0].text);
}
```

**Cost Optimization:**
- Cache summaries in database
- Only summarize high-impact articles
- Use cheaper models for simple summaries
- Batch process overnight for older articles

---

## Market Linking Strategy

### Automatic Linking Algorithm

**Step 1: Keyword Extraction**

```typescript
function extractKeywords(article: NewsItem): string[] {
  const text = `${article.title} ${article.content}`;

  // Named entity recognition
  const entities = extractEntities(text); // Use NLP library

  // Common prediction market keywords
  const keywords = [
    // Politics
    'election', 'president', 'senate', 'congress', 'poll',
    // Names
    'Trump', 'Biden', 'Putin', 'Xi', 'Netanyahu',
    // Events
    'war', 'peace', 'treaty', 'sanctions', 'coup',
    // Economics
    'recession', 'inflation', 'interest rate', 'GDP',
    // Sports
    'championship', 'playoffs', 'MVP', 'draft',
    // Crypto
    'Bitcoin', 'Ethereum', 'ETF', 'SEC approval',
  ];

  return keywords.filter(kw =>
    text.toLowerCase().includes(kw.toLowerCase())
  );
}
```

**Step 2: Market Matching**

```typescript
function findRelatedMarkets(
  keywords: string[],
  allMarkets: Market[]
): string[] {
  const scores = allMarkets.map(market => {
    let score = 0;

    // Exact title match
    keywords.forEach(keyword => {
      if (market.name.toLowerCase().includes(keyword.toLowerCase())) {
        score += 10;
      }
    });

    // Category match
    if (market.category === article.category) {
      score += 5;
    }

    // Date relevance (markets ending soon more relevant)
    const daysToEnd = (market.endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysToEnd < 30) score += 3;
    if (daysToEnd < 7) score += 5;

    return { marketId: market.id, score };
  });

  // Return top 5 markets
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .filter(m => m.score > 5) // Minimum threshold
    .map(m => m.marketId);
}
```

**Step 3: Manual Overrides**

```typescript
// Database table: market_news_rules
interface MarketNewsRule {
  pattern: string; // Regex or keyword
  marketId: string;
  priority: number; // Override automatic matching
}

// Example rules:
const rules: MarketNewsRule[] = [
  {
    pattern: /trump.*indictment/i,
    marketId: 'trump-convicted-2024',
    priority: 100
  },
  {
    pattern: /bitcoin.*etf/i,
    marketId: 'bitcoin-etf-approved',
    priority: 100
  }
];
```

---

## Real-Time News Ingestion Pipeline

### Architecture

```
┌─────────────┐
│ News Source │ (APIs, RSS)
└──────┬──────┘
       │
       v
┌─────────────┐
│  Fetcher    │ (Cron job every 1-5 min)
│  Service    │
└──────┬──────┘
       │
       v
┌─────────────┐
│ Processor   │ (Deduplicate, classify, link)
└──────┬──────┘
       │
       v
┌─────────────┐
│  Database   │ (Store news)
└──────┬──────┘
       │
       v
┌─────────────┐
│ WebSocket   │ (Push to clients)
│  Server     │
└─────────────┘
```

### Implementation

**1. Fetcher Service (Cron Job)**

```typescript
// lib/cron/news-fetcher.ts
import { CronJob } from 'cron';

const newsFetcherJob = new CronJob(
  '*/5 * * * *', // Every 5 minutes
  async () => {
    console.log('Fetching latest news...');

    // Fetch from multiple sources
    const [newsApiArticles, bingArticles, rssArticles] = await Promise.all([
      fetchFromNewsAPI(),
      fetchFromBing(),
      fetchFromRSS()
    ]);

    // Combine and deduplicate
    const allArticles = [...newsApiArticles, ...bingArticles, ...rssArticles];
    const uniqueArticles = deduplicateArticles(allArticles);

    // Process each article
    for (const article of uniqueArticles) {
      await processArticle(article);
    }
  },
  null, // onComplete
  true, // start immediately
  'America/New_York'
);

export default newsFetcherJob;
```

**2. Deduplication**

```typescript
function deduplicateArticles(articles: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const unique: NewsItem[] = [];

  for (const article of articles) {
    // Create hash of title (normalized)
    const normalized = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const hash = hashString(normalized);

    if (!seen.has(hash)) {
      seen.add(hash);
      unique.push(article);
    }
  }

  return unique;
}

function hashString(str: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}
```

**3. Article Processor**

```typescript
async function processArticle(article: RawNewsItem) {
  // 1. Classify category
  const category = classifyCategory(article);

  // 2. Extract keywords
  const keywords = extractKeywords(article);

  // 3. Find related markets
  const relatedMarkets = await findRelatedMarkets(keywords);

  // 4. Calculate impact score (basic version)
  const impactScore = calculateImpactScore({
    sourceReliability: getSourceReliability(article.source),
    categoryImportance: getCategoryImportance(category),
    marketCount: relatedMarkets.length
  });

  // 5. Store in database
  const newsItem = await db.news.create({
    data: {
      title: article.title,
      content: article.content,
      sourceId: article.source.id,
      publishedAt: article.publishedAt,
      category,
      tags: keywords,
      impactScore,
      relatedMarkets: {
        connect: relatedMarkets.map(id => ({ id }))
      }
    }
  });

  // 6. Push to WebSocket clients
  broadcastNewArticle(newsItem);

  // 7. Trigger AI processing (async, non-blocking)
  queueAIAnalysis(newsItem.id);
}
```

---

## Caching Strategy

### Multi-Level Cache

**Level 1: In-Memory (Node.js)**
```typescript
import NodeCache from 'node-cache';

const newsCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60 // Check for expired keys every 60s
});

export async function getCachedNews(cacheKey: string) {
  const cached = newsCache.get(cacheKey);
  if (cached) return cached;

  const fresh = await fetchNews();
  newsCache.set(cacheKey, fresh);
  return fresh;
}
```

**Level 2: Redis (Distributed)**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedFeed(filters: NewsFilter) {
  const cacheKey = `news:${JSON.stringify(filters)}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const fresh = await fetchNewsFromDB(filters);
  await redis.setex(cacheKey, 300, JSON.stringify(fresh)); // 5 min TTL
  return fresh;
}
```

**Level 3: CDN (Static Assets)**
- Images cached for 24 hours
- Source logos cached forever (with versioning)

---

## Cost Estimation

### Monthly Costs (Projected)

**News APIs:**
- NewsAPI Business: $449/month (250K requests)
- OR Bing News API: ~$200/month (50K requests)
- CryptoCompare: Free tier (100K/month)

**AI Processing:**
- Claude API: ~$100-300/month (depending on volume)
  - Assume 1,000 articles/day × 30 days = 30,000 articles
  - Average 1,000 tokens per article
  - Input: 30M tokens × $3/1M = $90
  - Output: 10M tokens × $15/1M = $150
  - Total: ~$240/month

**Infrastructure:**
- Redis: $10-30/month (for caching)
- Database storage: $20/month (news archive)
- CDN: $10/month (images)

**Total: ~$690-1,009/month**

**Optimization Tips:**
- Start with free tiers for MVP
- Upgrade NewsAPI only when hitting limits
- Cache AI results aggressively
- Use local models for simple tasks
- Monitor usage and adjust

---

## Data Quality Checklist

### Before Displaying News:

- [ ] Deduplication verified
- [ ] Source is reputable
- [ ] Published date is accurate
- [ ] Content is not truncated
- [ ] Images load properly
- [ ] Links work
- [ ] Category is correct
- [ ] Related markets make sense
- [ ] No adult/spam content
- [ ] Proper attribution

### Monitoring:

- [ ] Track article ingestion rate
- [ ] Monitor duplicate percentage
- [ ] Check API error rates
- [ ] Verify market linking accuracy
- [ ] Review AI sentiment accuracy
- [ ] User feedback on quality

---

## Testing Strategy

### Unit Tests
```typescript
describe('News Processing', () => {
  it('should deduplicate similar articles', () => {
    const articles = [
      { title: 'Trump Wins!' },
      { title: 'Trump wins!' },
      { title: 'Trump WINS!' }
    ];
    const result = deduplicateArticles(articles);
    expect(result).toHaveLength(1);
  });

  it('should extract keywords correctly', () => {
    const article = {
      title: 'Bitcoin ETF Approved',
      content: 'SEC approves Bitcoin ETF...'
    };
    const keywords = extractKeywords(article);
    expect(keywords).toContain('Bitcoin');
    expect(keywords).toContain('ETF');
  });
});
```

### Integration Tests
```typescript
describe('News API Integration', () => {
  it('should fetch news from NewsAPI', async () => {
    const articles = await fetchFromNewsAPI({ query: 'Trump' });
    expect(articles.length).toBeGreaterThan(0);
    expect(articles[0]).toHaveProperty('title');
  });
});
```

---

## Legal Considerations

### Copyright & Fair Use

**Best Practices:**
1. **Don't copy full articles** - Only show headlines + excerpts
2. **Always link to source** - Drive traffic to original
3. **Proper attribution** - Show source name and logo
4. **Respect robots.txt** - If scraping
5. **Terms of Service** - Follow API ToS

**Safe Approach:**
```typescript
interface NewsDisplay {
  title: string;        // OK - facts not copyrightable
  excerpt: string;      // OK - short excerpt is fair use
  source: string;       // Required - attribution
  url: string;          // Required - link to original
  // DON'T include full article text
}
```

---

## Recommended Implementation Plan

### Week 1: Setup
1. Choose primary API (NewsAPI recommended)
2. Set up API keys and environment
3. Create database schema
4. Build fetcher service
5. Test ingestion

### Week 2: Processing
1. Implement deduplication
2. Build keyword extraction
3. Create market linking logic
4. Test accuracy

### Week 3: Polish
1. Add caching layers
2. Optimize performance
3. Error handling
4. Monitoring setup

---

## Resources

### Documentation Links:
- NewsAPI: https://newsapi.org/docs
- Bing News: https://learn.microsoft.com/en-us/bing/search-apis/bing-news-search/
- Claude API: https://docs.anthropic.com/
- RSS Parser: https://www.npmjs.com/package/rss-parser

### Useful Libraries:
```json
{
  "dependencies": {
    "rss-parser": "^3.13.0",
    "node-cache": "^5.1.2",
    "ioredis": "^5.3.2",
    "@anthropic-ai/sdk": "^0.10.0",
    "cron": "^3.1.6"
  }
}
```

---

**Next Step:** Choose your news API, get keys, and start building!

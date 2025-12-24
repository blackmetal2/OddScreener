# Prediction Market Aggregator & Screener - Feature Research

**Research Date:** December 23, 2025
**Objective:** Analyze competitor features to identify gaps and opportunities for OddScreener

---

## Executive Summary

After researching leading prediction market platforms and screeners (DexScreener, Polymarket, Kalshi, Metaculus, Manifold Markets, PredictIt, and specialized aggregators like Verso), we've identified key feature categories that differentiate successful platforms. The prediction market space is rapidly evolving with institutional-grade tools emerging in 2025, particularly around whale tracking, arbitrage detection, and AI-powered analytics.

**Key Insights:**
- Professional traders are using Bloomberg-style terminals (e.g., Verso) with advanced filtering and news intelligence
- Whale tracking and smart money following is a major use case (86% of traders lose money, so copying winners is valuable)
- Real-time alerts via Telegram/email are critical for fast-moving markets
- Cross-platform arbitrage opportunities exist but require sophisticated tooling
- Social features and community forecasting add credibility and engagement
- Portfolio analytics and P&L tracking are essential for serious traders

---

## 1. MUST-HAVE FEATURES (Essential for any prediction screener)

### 1.1 Core Data Display

**Market Aggregation**
- ✅ **We have:** Polymarket and Kalshi aggregation
- 📊 **Best practice:** Professional platforms aggregate 1500+ markets across multiple platforms
- **Gap:** We only cover 2 platforms; missing Manifold, PredictIt, and international markets
- **Priority:** Medium - focus on depth over breadth initially

**Real-Time Price Updates**
- ✅ **We have:** Server-side updates with 60s revalidation
- 📊 **Industry standard:** WebSocket connections with <50ms latency (Polymarket), <100ms (Kalshi)
- **Gap:** We use polling, not real-time WebSockets
- **Priority:** HIGH - critical for competitive traders

**Volume & Liquidity Data**
- ✅ **We have:** 24h volume display
- 📊 **Best practice:** Show liquidity depth, bid/ask spreads, multi-timeframe volume (5m, 1h, 6h, 24h, 7d)
- **Gap:** No liquidity depth or order book data
- **Priority:** Medium - useful for serious traders

**Probability Display**
- ✅ **We have:** Current probability with visual bar
- 📊 **Best practice:** Show probability with confidence intervals, historical probability ranges
- **Gap:** No historical context or volatility indicators
- **Priority:** Low - current implementation adequate

### 1.2 Filtering & Search

**Platform Filtering**
- ✅ **We have:** All/Polymarket/Kalshi filter
- 📊 **Best practice:** Multi-select platform filters with "smart routing" to best prices
- **Gap:** No multi-select, no best price routing
- **Priority:** Medium

**Category Filtering**
- ✅ **We have:** 8 categories (Politics, Sports, Crypto, Finance, World, Tech, Culture, Science)
- 📊 **Best practice:** Hierarchical categories with subcategories (e.g., Politics → US Elections → Presidential)
- **Gap:** Flat category structure
- **Priority:** Low - current structure works for most users

**Advanced Search**
- ❌ **We have:** None
- 📊 **Industry standard:** Full-text search across market titles, descriptions, and tags
- **Gap:** No search functionality at all
- **Priority:** HIGH - users expect to find specific markets quickly

**Timeframe Filtering**
- ✅ **We have:** Trending, 1H, 6H, 24H
- 📊 **Best practice:** Also include "Ending Soon", "Ending This Week", "Long Term" filters
- **Gap:** No end-date-based filters
- **Priority:** Medium - useful for different trading strategies

### 1.3 Sorting & Ranking

**Multi-Column Sorting**
- ✅ **We have:** Sort by probability, change (1h/6h/24h), volume, end date
- 📊 **Best practice:** DexScreener offers 15+ sort options including trend scores, transaction counts, liquidity, market cap
- **Gap:** Missing sort by liquidity, creation date, number of traders, "smart money" activity
- **Priority:** Medium

**Saved Sorts/Views**
- ❌ **We have:** None
- 📊 **Best practice:** Save custom filter combinations and sorts
- **Gap:** Users must recreate filters each session
- **Priority:** Low - nice to have but not critical

### 1.4 Market Details

**Price History Charts**
- ✅ **We have:** Single outcome and multi-outcome price charts with 1d timeframe
- 📊 **Best practice:** Multiple timeframes (1h, 6h, 1d, 7d, 30d, All), TradingView-style candlestick charts
- **Gap:** Only 1d timeframe, no advanced chart types
- **Priority:** HIGH - traders need multiple timeframes

**Recent Trades**
- ✅ **We have:** Trade history display
- 📊 **Best practice:** Real-time trade feed with trade size highlighting, whale trade alerts
- **Gap:** No real-time updates, no trade size highlighting
- **Priority:** Medium

**Market Resolution Info**
- 🟡 **We have:** End date display
- 📊 **Best practice:** Show resolution source, resolution criteria, oracle information
- **Gap:** No resolution criteria or oracle transparency
- **Priority:** Medium - important for trust and risk assessment

### 1.5 Alerts & Notifications

**Price Alerts**
- ✅ **We have:** localStorage-based alerts (above/below threshold)
- 📊 **Industry standard:** Real-time alerts via Telegram, Email, Discord, Push notifications
- **Gap:** No actual notifications - alerts are just stored locally
- **Priority:** HIGH - current implementation doesn't notify users

**Multi-Channel Delivery**
- ❌ **We have:** None
- 📊 **Best practice:** Telegram bots, email, SMS, push notifications, Discord webhooks
- **Gap:** No notification delivery mechanism
- **Priority:** HIGH - essential for serious users

**Alert Types**
- 🟡 **We have:** Simple price threshold alerts
- 📊 **Best practice:** Price alerts, volume spikes, whale trades, market launches, trend reversals, arbitrage opportunities
- **Gap:** Only basic price alerts
- **Priority:** Medium - expand alert types

---

## 2. NICE-TO-HAVE FEATURES (Would make us competitive)

### 2.1 Portfolio & Watchlist

**Watchlist Management**
- ✅ **We have:** localStorage watchlist
- 📊 **Best practice:** Cloud-synced watchlists, multiple watchlists with names/organization, bulk import/export
- **Gap:** Only one watchlist, no cloud sync, no organization
- **Priority:** Medium

**Portfolio Tracking**
- ❌ **We have:** None
- 📊 **Industry standard:** Track multiple wallets, consolidated P&L, performance metrics, positions history
- **Platforms:** Polymarket Analytics, PolyTrack, Verso all offer this
- **Implementation:**
  - Add wallet address manually or connect wallet
  - Show P&L by category, timeframe, platform
  - Track win rate, ROI, total volume
- **Priority:** HIGH - key differentiator for serious traders

**Performance Analytics**
- ❌ **We have:** None
- 📊 **Best practice:** Win rate, ROI, Sharpe ratio, drawdown analysis, category-specific performance
- **Gap:** No analytics at all
- **Priority:** Medium - valuable for power users

### 2.2 Whale Tracking & Smart Money

**Top Holders Display**
- ✅ **We have:** Top holders for Polymarket markets
- 📊 **Industry standard:** Top holders with wallet labels, P&L history, trade alerts
- **Gap:** Just basic holder display, no additional context
- **Priority:** Medium

**Whale Tracker**
- ❌ **We have:** None
- 📊 **Best practice:** Track profitable wallets, cluster detection for related wallets, real-time alerts when whales trade
- **Tools:** PolyTrack ($19/mo), PolyAlertHub, Hashdive all offer this
- **Market insight:** Théo made $85M on 2024 election using 11 wallets - cluster detection identified them
- **Implementation:**
  - Free tier: Track 3 wallets
  - Pro tier: Unlimited tracking with alerts
  - Show wallet P&L, win rate, recent trades, positions
- **Priority:** HIGH - major competitive advantage

**Smart Money Alerts**
- ❌ **We have:** None
- 📊 **Best practice:** Get notified when high-performing traders make moves
- **Stat:** Only 0.51% of traders profit more than $1,000 - following winners is valuable
- **Priority:** Medium - pairs well with whale tracking

**Copy Trading Integration**
- ❌ **We have:** None
- 📊 **Emerging trend:** Tools to automatically copy top traders' positions
- **Priority:** Low - complex, regulatory concerns, but could be future feature

### 2.3 Analytics & Insights

**Market Sentiment Indicators**
- ❌ **We have:** None
- 📊 **Best practice:** Buy/sell ratio, order book imbalance, momentum indicators
- **Gap:** No sentiment analysis
- **Priority:** Low - nice to have

**Correlation Analysis**
- ❌ **We have:** None
- 📊 **Use case:** Find markets that move together, arbitrage opportunities
- **Example:** If "Trump wins" goes up, "Republican Senate" should correlate
- **Priority:** Low - advanced feature

**Historical Accuracy Tracking**
- ❌ **We have:** None
- 📊 **Best practice:** Track how well markets predicted outcomes, platform accuracy scores
- **Reference:** Metaculus shows prediction accuracy, Brier scores
- **Priority:** Low - builds trust but complex to implement

**News Integration**
- ❌ **We have:** None
- 📊 **Best practice:** Link markets to relevant news, show news that might impact prices
- **Verso example:** AI-powered news engine maps 30,000+ articles to Kalshi contracts with GPT-5 impact scores
- **Priority:** HIGH - major competitive advantage for informed trading

### 2.4 Advanced Filtering

**Liquidity Filters**
- ❌ **We have:** None
- 📊 **Best practice:** Filter by minimum liquidity, spread width, order book depth
- **DexScreener:** Can filter by liquidity ranges
- **Priority:** Medium - important for larger traders

**Market Age Filters**
- ❌ **We have:** None
- 📊 **Best practice:** New markets (< 1 day), recent (< 1 week), established (> 1 month)
- **Use case:** Find new opportunities vs. established markets
- **Priority:** Low

**Creator/Source Filters**
- ❌ **We have:** None
- 📊 **Best practice:** Filter by market creator, verified creators only
- **Manifold Markets:** Heavy creator focus, can follow specific creators
- **Priority:** Low - more relevant for Manifold-like platforms

**Custom Range Filters**
- ❌ **We have:** None
- 📊 **Best practice:** Custom ranges for volume, probability, end date
- **Example:** "Volume > $100k AND Probability 40-60% AND Ends in 7 days"
- **Priority:** Medium - valuable for power users

### 2.5 Multi-Chart View

**Side-by-Side Comparison**
- ❌ **We have:** None
- 📊 **DexScreener:** View up to 16 charts simultaneously
- **Use case:** Compare related markets, monitor portfolio positions
- **Priority:** Low - niche use case

**Custom Dashboards**
- ❌ **We have:** None
- 📊 **Best practice:** Create custom layouts with specific markets, metrics, charts
- **Priority:** Low - power user feature

### 2.6 Social & Community Features

**Comments & Discussion**
- ❌ **We have:** None
- 📊 **Best practice:** Market-specific comments, forecaster discussions
- **Platforms:** Metaculus, Manifold Markets have robust discussion features
- **Priority:** Low - creates community but adds moderation burden

**Forecaster Profiles**
- ❌ **We have:** None
- 📊 **Best practice:** Public profiles showing track record, accuracy, specialties
- **Metaculus:** Strong reputation system with points and badges
- **Priority:** Low - requires user accounts

**Leaderboards**
- ❌ **We have:** None
- 📊 **Best practice:** Top traders by P&L, ROI, volume, accuracy
- **Priority:** Low - fun but not essential for aggregator

**Shared Watchlists**
- ❌ **We have:** None
- 📊 **Best practice:** Share curated market lists, follow other users' watchlists
- **Priority:** Low

---

## 3. INNOVATIVE FEATURES (Would differentiate us)

### 3.1 Cross-Platform Arbitrage

**Arbitrage Scanner**
- ❌ **We have:** None
- 📊 **Market opportunity:** $40M extracted via arbitrage April 2024 - April 2025 (academic research)
- **Implementation:**
  - Scan for same/similar markets across platforms
  - Calculate profitability after fees
  - Alert when profitable spreads appear
  - Show execution instructions
- **Challenges:**
  - Speed critical - opportunities disappear in seconds
  - Need fuzzy matching for similar markets
  - Different resolution criteria = risk
- **Tools:** GetArbitrageBets.com, Betr.Market, ArbiDex already do this
- **Priority:** HIGH - major value-add, monetizable feature

**Cross-Platform Best Execution**
- ❌ **We have:** None
- 📊 **Best practice:** Show best price across platforms, one-click routing
- **Example:** "Best YES price: 58¢ on Polymarket, 62¢ on Kalshi"
- **Priority:** Medium - requires deep integration

**Arbitrage Alerts**
- ❌ **We have:** None
- 📊 **Implementation:** Alert when profitable arbitrage appears (e.g., "5% profit buying on Kalshi, selling on Polymarket")
- **Priority:** HIGH - pairs with arbitrage scanner

### 3.2 AI & Automation

**AI Market Summaries**
- ❌ **We have:** None
- 📊 **Best practice:** LLM-generated market summaries, key factors, news context
- **Priority:** Medium - improves UX, helps users understand complex markets

**AI Price Predictions**
- ❌ **We have:** None
- 📊 **Approach:** Show ML model predictions vs. market prices
- **Caution:** Regulatory concerns, need clear disclaimers
- **Metaculus:** Has AI forecasting bot framework
- **Priority:** Low - experimental, requires significant ML work

**Auto-Tagging & Categorization**
- ❌ **We have:** Manual categorization
- 📊 **Best practice:** AI-powered tag suggestions, automatic category detection
- **Priority:** Low - improves data quality

**News Impact Scoring**
- ❌ **We have:** None
- 📊 **Verso approach:** Use GPT-5 to score how much each news article impacts specific markets
- **Priority:** HIGH - pairs with news integration, major differentiator

### 3.3 Advanced Analytics

**Probability Calibration Plots**
- ❌ **We have:** None
- 📊 **Best practice:** Show how well-calibrated market probabilities are vs. outcomes
- **Metaculus:** Strong focus on calibration and Brier scores
- **Priority:** Low - niche analytical feature

**Volatility Indicators**
- ❌ **We have:** None
- 📊 **Implementation:** Show price volatility, detect "pump and dump" patterns
- **Use case:** Identify manipulation, risky markets
- **Priority:** Medium

**Trend Detection**
- ❌ **We have:** "HOT" badge for high volume
- 📊 **DexScreener:** Trend scores based on multiple factors (volume, price movement, transaction count)
- **Gap:** Our "HOT" badge is basic
- **Priority:** Medium - improve existing feature

**Market Maker Detection**
- ❌ **We have:** None
- 📊 **Best practice:** Identify bot activity, market making, manipulation
- **DexScreener:** Sniper bot detection for Solana
- **Priority:** Low - very advanced

### 3.4 Educational & Research

**Backtesting Tools**
- ❌ **We have:** None
- 📊 **Best practice:** Test strategies against historical data
- **Priority:** Low - niche feature

**Strategy Templates**
- ❌ **We have:** None
- 📊 **Implementation:** Pre-built filters for common strategies (e.g., "Value plays", "Ending soon", "Whale following")
- **Priority:** Medium - helps new users

**Educational Content**
- ❌ **We have:** None
- 📊 **Best practice:** Guides on prediction markets, trading strategies, platform differences
- **Priority:** Low - marketing/content focus

**Research Data Export**
- ❌ **We have:** None
- 📊 **Best practice:** CSV/JSON export of market data, API access for researchers
- **Kalshi:** Launched research division giving researchers access to data
- **Priority:** Low - could build community goodwill

### 3.5 Mobile & Accessibility

**Progressive Web App**
- ❌ **We have:** Responsive web only
- 📊 **Best practice:** PWA with offline support, push notifications, home screen install
- **Manifold Markets:** Has dedicated mobile apps for iOS/Android
- **Priority:** Medium - growing mobile usage

**Telegram Mini App**
- ❌ **We have:** None
- 📊 **Best practice:** In-Telegram market browser, alerts, quick trades
- **Priority:** Medium - Telegram is popular in crypto/prediction market communities

**Voice Search/Commands**
- ❌ **We have:** None
- 📊 **Innovation:** "Show me politics markets ending this week with >50% probability"
- **Priority:** Low - experimental

### 3.6 Gamification & Engagement

**Paper Trading**
- ❌ **We have:** None
- 📊 **Best practice:** Virtual portfolio to practice without risk
- **Manifold Markets:** Entire platform is play money
- **Priority:** Low - interesting for beginners

**Achievement Badges**
- ❌ **We have:** None
- 📊 **Best practice:** Reward consistent usage, accurate predictions, portfolio milestones
- **Priority:** Low - fun but not essential

**Challenges & Tournaments**
- ❌ **We have:** None
- �📊 **Metaculus:** Runs forecasting tournaments
- **Priority:** Low - requires active management

---

## 4. MISSING FROM ODDSCREENER (Gap Analysis)

### 4.1 Critical Gaps (Blocking Growth)

1. **Real-time updates via WebSocket**
   - Current: 60s polling
   - Need: Sub-second updates for price changes, trades
   - Impact: Serious traders won't use us if data is stale

2. **Functional alert notifications**
   - Current: Alerts stored locally, no notifications
   - Need: Telegram, email, push notifications
   - Impact: Alerts are useless if they don't notify

3. **Full-text search**
   - Current: None
   - Need: Search market titles and descriptions
   - Impact: Users can't find specific markets quickly

4. **Multiple chart timeframes**
   - Current: Only 1d
   - Need: 1h, 6h, 1d, 7d, 30d, All
   - Impact: Traders need different timeframes for different strategies

5. **Portfolio tracking**
   - Current: None
   - Need: Wallet-based position tracking, P&L
   - Impact: Serious traders want to track performance

### 4.2 Important Gaps (Competitive Disadvantage)

6. **Whale tracking**
   - Current: Basic top holders
   - Need: Wallet tracking, cluster detection, trade alerts
   - Impact: Missing major use case for following smart money

7. **News integration**
   - Current: None
   - Need: Relevant news linked to markets
   - Impact: Traders make uninformed decisions

8. **Arbitrage detection**
   - Current: None
   - Need: Cross-platform price comparisons, arbitrage alerts
   - Impact: Missing profitable trading opportunity

9. **Advanced filtering**
   - Current: Basic filters
   - Need: Liquidity, market age, custom ranges
   - Impact: Power users can't find exactly what they want

10. **Cloud sync**
    - Current: Everything in localStorage
    - Need: User accounts, cloud-synced watchlists/alerts
    - Impact: Users lose data when switching devices

### 4.3 Nice-to-Have Gaps (Future Enhancements)

11. **Social features**
    - Current: None
    - Need: Comments, leaderboards, shared watchlists
    - Impact: Less engagement, no community

12. **Multi-chart view**
    - Current: One market at a time
    - Need: Side-by-side comparison
    - Impact: Inefficient workflow for monitoring multiple markets

13. **Mobile apps**
    - Current: Responsive web
    - Need: Native apps or PWA
    - Impact: Suboptimal mobile experience

14. **API access**
    - Current: None
    - Need: Public API for developers
    - Impact: Can't build integrations, bots

15. **Backtesting tools**
    - Current: None
    - Need: Historical data analysis
    - Impact: Can't validate strategies

---

## 5. COMPETITIVE FEATURE MATRIX

| Feature | OddScreener | DexScreener | Polymarket | Kalshi | Metaculus | Manifold | Verso | Priority |
|---------|------------|-------------|------------|--------|-----------|----------|-------|----------|
| **Core Features** |
| Multi-platform aggregation | ✅ (2) | ✅ (80+) | ❌ | ❌ | ❌ | ❌ | ✅ (2) | Medium |
| Real-time WebSocket | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | HIGH |
| Full-text search | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | HIGH |
| Advanced filters | 🟡 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Medium |
| Price charts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multiple timeframes | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | HIGH |
| **Alerts & Notifications** |
| Price alerts | 🟡 | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | HIGH |
| Telegram notifications | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | HIGH |
| Email notifications | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | Medium |
| Whale trade alerts | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Medium |
| **Portfolio & Trading** |
| Watchlist | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Portfolio tracking | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | HIGH |
| P&L analytics | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | Medium |
| Multi-wallet support | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | Low |
| **Whale Tracking** |
| Top holders display | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Whale wallet tracking | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | HIGH |
| Cluster detection | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🟡 | Medium |
| Smart money alerts | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | Medium |
| **Analytics** |
| News integration | ❌ | ❌ | 🟡 | 🟡 | ✅ | ❌ | ✅ | HIGH |
| Arbitrage scanner | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | HIGH |
| Volume analysis | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Liquidity data | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | Medium |
| **Social & Community** |
| Comments/Discussion | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | Low |
| User profiles | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | Low |
| Leaderboards | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 🟡 | Low |
| **Platform** |
| Mobile app | ❌ | ✅ | 🟡 | 🟡 | 🟡 | ✅ | ❌ | Medium |
| API access | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Low |
| Cloud sync | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Medium |

**Legend:**
✅ = Has feature
🟡 = Partial/limited feature
❌ = Missing feature

---

## 6. PRIORITIZED RECOMMENDATIONS

### 6.1 Phase 1: Critical Fixes (Next 2-4 weeks)

**Goal:** Make OddScreener competitive for daily use

1. **Real-time updates (WebSocket integration)**
   - Replace 60s polling with WebSocket connections
   - Show live price updates, trade feed
   - Estimated effort: 3-5 days
   - Impact: Essential for serious traders

2. **Full-text search**
   - Add search bar to find markets by title/description
   - Implement fuzzy matching for typos
   - Estimated effort: 2-3 days
   - Impact: Major UX improvement

3. **Multiple chart timeframes**
   - Add 1h, 6h, 1d, 7d, 30d, All options
   - Fetch historical data for each timeframe
   - Estimated effort: 2-3 days
   - Impact: Essential for traders

4. **Functional alert notifications**
   - Set up backend service to check alerts
   - Implement Telegram bot for notifications
   - Add email notifications (optional)
   - Estimated effort: 4-6 days
   - Impact: Makes existing alerts feature actually useful

**Total Phase 1 effort:** 11-17 days

### 6.2 Phase 2: Competitive Features (Month 2)

**Goal:** Match feature parity with competitors

5. **Portfolio tracking**
   - Add wallet address input
   - Fetch positions from Polymarket/Kalshi APIs
   - Show P&L, win rate, active positions
   - Estimated effort: 5-7 days
   - Impact: Major feature for serious traders

6. **Advanced filtering**
   - Add liquidity filters
   - Add market age filters
   - Add custom range inputs (volume, probability)
   - Save filter presets
   - Estimated effort: 3-4 days
   - Impact: Helps power users find opportunities

7. **News integration**
   - Integrate news API (NewsAPI, Perplexity, or similar)
   - Match news articles to markets
   - Show relevant news on market detail pages
   - Estimated effort: 4-6 days
   - Impact: Informed trading decisions

8. **Cloud sync (user accounts)**
   - Add authentication (Auth0, Clerk, or similar)
   - Migrate localStorage to database
   - Sync watchlists and alerts across devices
   - Estimated effort: 5-7 days
   - Impact: Better UX, retention

**Total Phase 2 effort:** 17-24 days

### 6.3 Phase 3: Differentiation (Month 3)

**Goal:** Build features competitors don't have

9. **Whale tracking**
   - Allow users to track profitable wallets
   - Show wallet P&L, recent trades, positions
   - Alert when tracked wallets make moves
   - Cluster detection for related wallets (advanced)
   - Estimated effort: 7-10 days
   - Impact: Major competitive advantage

10. **Cross-platform arbitrage scanner**
    - Match similar markets across platforms
    - Calculate profitability after fees
    - Alert on profitable opportunities
    - Estimated effort: 6-9 days
    - Impact: Unique value proposition, monetizable

11. **AI market summaries**
    - Use LLM to generate market context
    - Summarize key factors, news, sentiment
    - Estimated effort: 3-5 days
    - Impact: Improves UX, helps beginners

12. **News impact scoring**
    - Use AI to score how news affects each market
    - Highlight high-impact news
    - Estimated effort: 4-6 days
    - Impact: Pairs with news integration

**Total Phase 3 effort:** 20-30 days

### 6.4 Phase 4: Optimization & Polish (Month 4+)

13. **PWA/Mobile optimization**
    - Convert to Progressive Web App
    - Add offline support
    - Optimize for mobile performance
    - Estimated effort: 5-7 days

14. **Multi-chart view**
    - Split screen to compare markets
    - Saved dashboard layouts
    - Estimated effort: 4-6 days

15. **API access**
    - Build public API for developers
    - API documentation
    - Rate limiting and authentication
    - Estimated effort: 7-10 days

16. **Social features (optional)**
    - Add comments on markets
    - User profiles and leaderboards
    - Estimated effort: 10-15 days

---

## 7. MONETIZATION OPPORTUNITIES

Based on competitor analysis, potential revenue streams:

### 7.1 Freemium Model

**Free Tier:**
- Basic market browsing
- Simple filters and sorting
- 3 watchlist items
- 3 price alerts
- 3 whale wallets to track

**Pro Tier ($19-29/month):**
- Unlimited watchlists and alerts
- Unlimited whale tracking
- Real-time Telegram/email notifications
- Advanced filters and custom ranges
- Arbitrage alerts
- Portfolio analytics
- No ads (if we add ads to free tier)

**Benchmark:** PolyTrack charges $19/mo for Pro

### 7.2 Enterprise/API Access

- API access for developers/researchers
- Higher rate limits
- Historical data export
- Custom integrations
- $99-299/month depending on usage

### 7.3 Affiliate Commissions

- Link to Polymarket/Kalshi with referral codes
- Earn commission on trading volume
- Note: Must comply with regulations

### 7.4 Premium Features (One-time or Add-ons)

- Backtesting tools
- Custom indicators
- Advanced analytics
- $49-99 one-time or $9/mo add-on

---

## 8. TECHNICAL IMPLEMENTATION NOTES

### 8.1 Real-time Updates (WebSocket)

**Polymarket WebSocket:**
- URL: `wss://ws-subscriptions-clob.polymarket.com/ws/market`
- 50ms latency
- Subscribe to specific market updates

**Kalshi WebSocket:**
- URL: Check Kalshi API docs
- ~100ms latency
- Real-time order book and price updates

**Implementation:**
```typescript
// Example WebSocket client
const ws = new WebSocket('wss://ws-subscriptions-clob.polymarket.com/ws/market');

ws.on('message', (data) => {
  const update = JSON.parse(data);
  // Update market prices in real-time
});
```

### 8.2 Alert Notifications

**Telegram Bot:**
- Create bot via BotFather
- Store user chat IDs
- Send messages via Telegram API
- Cost: Free for up to 30 messages/second

**Email:**
- Use SendGrid, AWS SES, or Resend
- Cost: ~$0.001 per email

**Backend Service:**
- Run cron job every 30-60 seconds
- Check all alerts against current prices
- Send notifications via Telegram/email

### 8.3 Portfolio Tracking

**Polymarket:**
- API: `https://clob.polymarket.com/positions/{address}`
- Returns all positions for a wallet
- Calculate P&L from position data

**Kalshi:**
- API: `https://api.kalshi.com/v1/portfolio/`
- Requires authentication with Kalshi account
- Alternative: Track via blockchain for transparency

### 8.4 Whale Tracking

**Data Sources:**
- Polymarket: CLOB API for top holders
- Blockchain explorers for wallet history
- Store wallet metadata (labels, tags, performance)

**Cluster Detection:**
- Analyze transaction patterns
- Look for shared funding sources
- Machine learning for sophisticated detection

### 8.5 News Integration

**News APIs:**
- NewsAPI: $449/mo for commercial use
- Perplexity API: Pay per query
- Google News RSS: Free but limited

**Matching:**
- Extract entities from market titles (e.g., "Trump", "Bitcoin")
- Search news for those entities
- Rank by relevance and recency
- Use LLM to score impact on market

### 8.6 Arbitrage Scanner

**Approach:**
1. Normalize market titles across platforms
2. Fuzzy match similar markets (e.g., "Trump wins 2024" vs "Will Trump be elected in 2024?")
3. Compare prices accounting for fees
4. Alert when spread > threshold (e.g., 3%)

**Challenges:**
- Different resolution criteria = risk
- Speed critical (opportunities disappear fast)
- Need to account for platform fees, gas fees

---

## 9. KEY INSIGHTS FROM RESEARCH

### 9.1 Market Trends (2025)

1. **Institutional adoption**: Kalshi raised $1B at $11B valuation, partnered with CNN, CNBC, Robinhood, Coinbase
2. **Regulatory clarity**: PredictIt won CFTC lawsuit, position limits increased from $850 to $3,500
3. **Mainstream integration**: Google Finance and Yahoo Finance now show prediction market data
4. **Professional tools**: Bloomberg-style terminals (Verso) emerging for serious traders
5. **Arbitrage opportunities**: $40M extracted in 2024-2025 via cross-platform arbitrage

### 9.2 User Behavior Insights

1. **86% of traders lose money** - Following winners (whale tracking) is valuable
2. **Speed matters** - Arbitrage opportunities disappear in seconds, need real-time data
3. **Mobile-first** - Prediction markets trending younger, mobile-native users
4. **Social proof** - Traders want to see what smart money is doing
5. **Multi-platform** - Users trade on multiple platforms, want unified view

### 9.3 Competitive Landscape

**Aggregators:**
- Verso: Professional, $$ pricing, Bloomberg-style
- Polymarket Analytics: Free, focused on Polymarket only
- PolyTrack: Freemium, whale tracking focus

**Primary Platforms:**
- Polymarket: Largest ($18B volume 2024-2025), crypto-native
- Kalshi: Regulated, institutional, fastest-growing
- Manifold: Social, play money, community focus
- Metaculus: Research/forecasting, high-quality predictions

**Our Position:**
- Multi-platform aggregator (Polymarket + Kalshi)
- Free/freemium model
- Focus on traders (not forecasters or researchers)
- Differentiate with whale tracking, arbitrage, news integration

---

## 10. CONCLUSION & NEXT STEPS

### Summary

OddScreener has a solid foundation with basic aggregation, filtering, and watchlist features. However, we're missing critical features that serious traders expect: real-time updates, functional alerts, portfolio tracking, and whale tracking.

**Our current position:**
- ✅ **Strengths:** Clean UX, multi-platform, basic filters working
- ⚠️ **Weaknesses:** No real-time updates, alerts don't notify, no search, missing advanced features
- 🎯 **Opportunities:** Whale tracking, arbitrage, news integration are major gaps across all platforms
- ⚡ **Threats:** Verso and other pro tools could dominate the serious trader market

### Recommended Focus

**Short-term (4 weeks):** Fix critical gaps
1. WebSocket real-time updates
2. Full-text search
3. Multiple chart timeframes
4. Functional alert notifications

**Medium-term (2-3 months):** Match competitors
5. Portfolio tracking
6. Advanced filtering
7. News integration
8. Cloud sync

**Long-term (3+ months):** Differentiate
9. Whale tracking with alerts
10. Cross-platform arbitrage scanner
11. AI market summaries
12. News impact scoring

### Success Metrics

- **User retention:** % of users returning weekly
- **Engagement:** Time spent, markets viewed, alerts created
- **Conversion:** Free to Pro upgrade rate (if freemium)
- **NPS:** Would users recommend OddScreener?

### Open Questions

1. Should we focus on traders or forecasters? (Traders = higher monetization potential)
2. Freemium or fully free? (Freemium likely better for sustainability)
3. Narrow focus (Polymarket + Kalshi) or expand to more platforms? (Narrow focus initially)
4. Build mobile app or optimize web? (PWA is middle ground)

---

## Sources & References

- [DexScreener User Guide 2025](https://www.webopedia.com/crypto/learn/dex-screener-user-guide-2024/)
- [DexScreener: The Complete Guide](https://www.bittime.com/en/blog/Dexscreener-panduan-lengkap)
- [Polymarket Analytics Platform](https://polymarketanalytics.com)
- [PolyAlertHub - Alerts & Analytics](https://polyalerthub.com)
- [Top Polymarket Alert Bots (December 2025)](https://coincodecap.com/top-10-polymarket-alert-bots)
- [PolyTrack - Best Whale Tracker](https://www.polytrackhq.app/blog/polytrack-best-whale-tracker)
- [Best Polymarket Traders to Follow 2025](https://www.polytrackhq.app/blog/best-polymarket-traders-to-follow-2025)
- [Kalshi: Leading Web3 Prediction Market Platform 2025](https://www.gate.com/crypto-wiki/article/kalshi-the-leading-web3-prediction-market-platform-in-2025-20251204)
- [Kalshi Launches Research Division](https://crypto.news/kalshi-prediction-market-in-house-research-wing-2025/)
- [Metaculus - Forecasting Platform](https://www.metaculus.com/)
- [Manifold Markets - Social Prediction Game](https://manifold.markets/)
- [PredictIt Review 2025](https://ats.io/prediction-markets/predictit/)
- [Best Prediction Market Sites 2025](https://www.gamingtoday.com/prediction-markets/)
- [Verso: Bloomberg Terminal for Prediction Markets](https://polymark.et/product/verso)
- [Prediction Market Tools: APIs, Arbitrage & Tech 2025](https://predictorsbest.com/prediction-market-tools/)
- [Building a Prediction Market Arbitrage Bot](https://navnoorbawa.substack.com/p/building-a-prediction-market-arbitrage)
- [GetArbitrageBets.com](https://getarbitragebets.com/)

---

**Document Version:** 1.0
**Last Updated:** December 23, 2025
**Next Review:** After Phase 1 implementation

# PolymarketAnalytics.com API Investigation

## Date: December 24, 2025

## Summary
Investigated the PolymarketAnalytics.com website to understand their API endpoints for retrieving market-specific trades data.

## Key Findings

### 1. Main API Endpoints Discovered

#### Activity/Trades Endpoint
- **URL**: `POST https://polymarketanalytics.com/api/activity-trades`
- **Method**: POST
- **Content-Type**: application/json

**Request Parameters**:
```json
{
  "min_value": 0,
  "max_value": 1000000,
  "sortBy": "trade_dttm",
  "sortDesc": true
}
```

**Purpose**: Fetches all trades across the platform with filtering capabilities

#### Other API Endpoints Observed
1. `POST https://polymarketanalytics.com/api/combined-markets` - Fetches market data
2. `POST https://polymarketanalytics.com/api/market-metrics` - Fetches market metrics
3. `GET https://polymarketanalytics.com/api/trader-tags` - Fetches trader tags

### 2. Market Page URL Structure

Market pages follow this pattern:
- `/markets/{market_id}` - where market_id is a numeric identifier

Examples:
- https://polymarketanalytics.com/markets/16548 (US government shutdown in 2025?)
- https://polymarketanalytics.com/markets/16093 (Fed emergency rate cut in 2025?)
- https://polymarketanalytics.com/markets/20377 (Fed rate cut in 2025?)

### 3. Request Headers Used

Standard headers observed:
```
sec-ch-ua-platform: "Linux"
referer: https://polymarketanalytics.com/activity
user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
sec-ch-ua: "Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"
content-type: application/json
sec-ch-ua-mobile: ?0
```

### 4. For Market-Specific Trades

**Hypothesis**: To get trades for a specific market, the `/api/activity-trades` endpoint likely accepts additional parameters such as:
- `market_id` or `conditionId` - to filter trades by market
- Pagination parameters (limit, offset, cursor)
- Date range filters (start_date, end_date or similar)

**Note**: Could not fully verify market-specific trade parameters due to browser connection issues and API authentication requirements when called directly via curl.

### 5. Response Structure

The API appears to return JSON responses. Error responses observed:
```json
{"error":"An error occurred while fetching data"}
```

This suggests the API may require:
- Authentication tokens
- Specific session cookies
- Rate limiting headers
- Proper referer headers

## Next Steps for Implementation

To implement market-specific trade fetching:

1. **Browser Automation Approach** (Recommended):
   - Use Playwright/Selenium to navigate to specific market pages
   - Monitor network traffic to capture exact API calls with all parameters
   - Extract authentication tokens/cookies from browser session
   - Replay requests with proper authentication

2. **Parameters to Test**:
   - Add `market_id` parameter to `/api/activity-trades`
   - Try `conditionId` parameter (common in Polymarket's official API)
   - Test pagination with `limit` and `offset` or `cursor` parameters

3. **Alternative Approach**:
   - Consider using Polymarket's official CLOB API instead
   - PolymarketAnalytics.com might be just a frontend to Polymarket's data
   - Direct API: https://docs.polymarket.com/

## Authentication Notes

The site uses Privy for authentication:
- Auth endpoint: `https://auth.privy.io/api/v1/apps/cm6v83xay00nr6nl2wb688909`
- May need to implement proper authentication flow to access certain endpoints

## Data Update Frequency

According to the website footer:
- Data is updated every 5 minutes (powered by Goldsky's data infrastructure)
- Market table has a limit of 100,000 records

## References

Sources used in this investigation:
- [Fed decisions in 2025 | Polymarket Analytics](https://polymarketanalytics.com/markets/41647)
- [US government shutdown in 2025? | Polymarket Analytics](https://polymarketanalytics.com/markets/16548)
- [Fed emergency rate cut in 2025? | Polymarket Analytics](https://polymarketanalytics.com/markets/16093)

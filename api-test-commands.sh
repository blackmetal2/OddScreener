#!/bin/bash

# Adjacent News API - Test Commands
# Base URL: https://api.data.adj.news
# No authentication required for these endpoints

BASE_URL="https://api.data.adj.news"

echo "=== Adjacent News API Test Commands ==="
echo ""

# 1. List first 10 markets
echo "1. List first 10 markets:"
echo "curl -s \"$BASE_URL/api/markets?limit=10\" | python3 -m json.tool"
echo ""

# 2. Get market count and metadata
echo "2. Get total market count:"
echo "curl -s \"$BASE_URL/api/markets?limit=1\" | python3 -c \"import sys, json; data = json.load(sys.stdin); print('Total markets:', data['meta']['count'])\""
echo ""

# 3. List active markets
echo "3. List active markets:"
echo "curl -s \"$BASE_URL/api/markets?status=active&limit=10\" | python3 -m json.tool"
echo ""

# 4. Pagination example
echo "4. Get markets with offset (pagination):"
echo "curl -s \"$BASE_URL/api/markets?limit=10&offset=10\" | python3 -m json.tool"
echo ""

# 5. Get specific market by ID
echo "5. Get specific market details:"
echo "curl -s \"$BASE_URL/api/markets/KXPRESNOMD-28-CBOO\" | python3 -m json.tool"
echo ""

# 6. Get related markets
echo "6. Get related markets:"
echo "curl -s \"$BASE_URL/api/markets/KXPRESNOMD-28-CBOO/related\" | python3 -m json.tool"
echo ""

# 7. Extract just market questions
echo "7. Extract just market questions (first 5):"
echo "curl -s \"$BASE_URL/api/markets?limit=5\" | python3 -c \"import sys, json; data = json.load(sys.stdin); [print(f'{i+1}. {m[\\\"question\\\"]}') for i, m in enumerate(data['data'])]\""
echo ""

# 8. Get high-volume markets (sort test)
echo "8. Sort by volume:"
echo "curl -s \"$BASE_URL/api/markets?limit=10&sort=volume\" | python3 -m json.tool"
echo ""

# 9. Check market probabilities
echo "9. Show probabilities for active markets:"
echo "curl -s \"$BASE_URL/api/markets?status=active&limit=10\" | python3 -c \"import sys, json; data = json.load(sys.stdin); [print(f'{m[\\\"question\\\"][:60]}... {m[\\\"probability\\\"]}%') for m in data['data']]\""
echo ""

# 10. Maximum free tier request (100 markets)
echo "10. Maximum free tier request (100 markets):"
echo "curl -s \"$BASE_URL/api/markets?limit=100\" | python3 -c \"import sys, json; data = json.load(sys.stdin); print(f'Retrieved: {len(data[\\\"data\\\"])} markets'); print(f'Total available: {data[\\\"meta\\\"][\\\"count\\\"]}'); print(f'Has more: {data[\\\"meta\\\"][\\\"hasMore\\\"]}')\""
echo ""

# 11. Test rate limit trigger (will fail)
echo "11. Test query that triggers auth requirement:"
echo "curl -s \"$BASE_URL/api/search/query?q=bitcoin&limit=3\" | python3 -m json.tool"
echo ""

# 12. Extract market metrics
echo "12. Extract market metrics (volume, liquidity, open interest):"
echo "curl -s \"$BASE_URL/api/markets?status=active&limit=5\" | python3 -c \"import sys, json; data = json.load(sys.stdin); [print(f'Market: {m[\\\"ticker\\\"]}\\n  Volume: {m[\\\"volume\\\"]}\\n  Open Interest: {m[\\\"open_interest\\\"]}\\n  Liquidity: {m[\\\"liquidity\\\"]}\\n  Probability: {m[\\\"probability\\\"]}%\\n') for m in data['data']]\""
echo ""

# 13. Get markets by platform
echo "13. Filter by platform (needs testing - may require auth):"
echo "curl -s \"$BASE_URL/api/markets?platform=kalshi&limit=10\" | python3 -m json.tool"
echo ""

# 14. Check market status details
echo "14. Extract market status details:"
echo "curl -s \"$BASE_URL/api/markets?limit=5\" | python3 -c \"import sys, json; data = json.load(sys.stdin); [print(f'{m[\\\"question\\\"][:50]}\\n  Active: {m[\\\"status_details\\\"][\\\"is_active\\\"]}\\n  Tradeable: {m[\\\"status_details\\\"][\\\"tradeable\\\"]}\\n  Resolved: {m[\\\"status_details\\\"][\\\"is_resolved\\\"]}\\n') for m in data['data']]\""
echo ""

# 15. Get markets approaching resolution
echo "15. Show resolution dates:"
echo "curl -s \"$BASE_URL/api/markets?limit=10\" | python3 -c \"import sys, json; data = json.load(sys.stdin); [print(f'{m[\\\"question\\\"][:50]}... Resolves: {m[\\\"resolution_date\\\"][:10]}') for m in data['data']]\""
echo ""

echo "=== Notes ==="
echo "- All commands work WITHOUT authentication"
echo "- Maximum 100 results per request"
echo "- Maximum 300 requests per minute"
echo "- Data limited to last 24 hours"
echo "- Total markets in database: 4+ million"
echo ""
echo "=== Triggers Auth Requirement ==="
echo "- /api/search/* endpoints"
echo "- /api/news/* endpoints"
echo "- /api/trade/* endpoints"
echo "- /api/indices/* endpoints"
echo "- Any query with >100 results"
echo "- Any historical data >24 hours old"

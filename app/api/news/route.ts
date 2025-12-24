import { NextResponse } from 'next/server';
import { fetchGoogleNewsRSS } from '@/lib/api/googleNews';
import { AdjacentNewsItem } from '@/lib/api/adjacent-news';

export const dynamic = 'force-dynamic';

// Category-specific search queries for prediction market news
const CATEGORY_QUERIES: Record<string, string> = {
  all: 'prediction markets OR betting odds OR Polymarket OR Kalshi',
  politics: 'election polls OR political betting OR election odds',
  crypto: 'cryptocurrency prediction OR Bitcoin price forecast OR crypto markets',
  sports: 'sports betting odds OR NFL predictions OR NBA odds',
  entertainment: 'Oscar predictions OR Emmy odds OR entertainment betting',
  finance: 'stock market predictions OR economic forecast OR Fed rate odds',
  tech: 'tech predictions OR AI forecast OR technology trends',
};

/**
 * API route for fetching news (used by client-side polling)
 * Uses Google News RSS as the source
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || 'all';

    // Get the search query for this category
    const query = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.all;

    console.log(`[News API] Fetching news for category: ${category}`);

    // Fetch from Google News RSS
    const articles = await fetchGoogleNewsRSS(query);

    // Transform to our news format
    const news: AdjacentNewsItem[] = articles.map((article, index) => ({
      id: `gn-${Date.now()}-${index}`,
      title: article.title,
      url: article.link,
      source: article.source,
      publishedAt: article.pubDate.toISOString(),
      createdAt: article.pubDate.toISOString(),
      category: category !== 'all' ? category : undefined,
    }));

    return NextResponse.json({
      success: true,
      news,
      count: news.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[News API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch news',
        news: [],
      },
      { status: 500 }
    );
  }
}

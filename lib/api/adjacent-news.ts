/**
 * Adjacent News API Client
 * https://docs.adj.news/
 *
 * Free tier: 300 req/min, 100 results max, last 24h data
 */

const BASE_URL = 'https://api.data.adj.news';

// Types based on Adjacent API response
export interface AdjacentNewsItem {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  url: string;
  source: string;
  publishedAt: string;
  createdAt: string;
  category?: string;
  imageUrl?: string;
  // Related markets from Adjacent's matching
  markets?: AdjacentMarketMatch[];
  // Relevance score
  score?: number;
  keywords?: string[];
}

export interface AdjacentMarketMatch {
  id: string;
  question: string;
  platform: string;
  probability?: number;
  volume24h?: number;
  url?: string;
}

export interface AdjacentNewsResponse {
  data: AdjacentNewsItem[];
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
  };
}

/**
 * Fetch news from Adjacent News API
 */
export async function fetchAdjacentNews(options: {
  limit?: number;
  offset?: number;
  category?: string;
  query?: string;
} = {}): Promise<AdjacentNewsItem[]> {
  const { limit = 50, offset = 0, category, query } = options;

  try {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (offset > 0) params.set('offset', String(offset));
    if (category) params.set('category', category);
    if (query) params.set('query', query);

    const url = `${BASE_URL}/api/news?${params.toString()}`;
    console.log('[Adjacent] Fetching news:', url);

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) {
      console.error('[Adjacent] API error:', res.status, res.statusText);
      return [];
    }

    const data: AdjacentNewsResponse = await res.json();
    console.log(`[Adjacent] Fetched ${data.data?.length || 0} news items`);

    return data.data || [];
  } catch (error) {
    console.error('[Adjacent] Fetch error:', error);
    return [];
  }
}

/**
 * Search news with semantic query
 */
export async function searchAdjacentNews(query: string, limit = 20): Promise<AdjacentNewsItem[]> {
  try {
    const params = new URLSearchParams();
    params.set('query', query);
    params.set('limit', String(limit));

    const url = `${BASE_URL}/api/search/query?${params.toString()}`;

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('[Adjacent] Search error:', res.status);
      return [];
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('[Adjacent] Search error:', error);
    return [];
  }
}

/**
 * Get available news categories
 */
export const NEWS_CATEGORIES = [
  { value: 'all', label: 'All News' },
  { value: 'politics', label: 'Politics' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'sports', label: 'Sports' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'finance', label: 'Finance' },
  { value: 'tech', label: 'Technology' },
] as const;

export type NewsCategory = typeof NEWS_CATEGORIES[number]['value'];

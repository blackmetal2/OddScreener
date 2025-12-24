import { NewsArticle } from '@/types/market';

// Stop words to remove from search queries
const STOP_WORDS = new Set([
  'will', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'by', 'be',
  'is', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does',
  'did', 'can', 'could', 'would', 'should', 'may', 'might', 'must',
  'this', 'that', 'these', 'those', 'it', 'its', 'and', 'or', 'but',
  'if', 'then', 'else', 'when', 'where', 'what', 'which', 'who', 'whom',
  'how', 'why', 'before', 'after', 'during', 'between', 'through',
  'with', 'without', 'about', 'against', 'into', 'over', 'under',
  'again', 'further', 'once', 'here', 'there', 'all', 'any', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'than',
]);

/**
 * Extract meaningful keywords from a market title
 */
export function extractKeywords(marketTitle: string): string[] {
  // Remove special characters except alphanumeric and spaces
  const cleaned = marketTitle
    .replace(/[?!.,;:'"()\[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into words
  const words = cleaned.split(' ');

  // Filter out stop words and short words, keep proper nouns and meaningful terms
  const keywords = words.filter((word) => {
    const lower = word.toLowerCase();
    // Keep if: not a stop word, has at least 2 chars, and is either:
    // - A proper noun (starts with uppercase)
    // - A number or date-like term
    // - A meaningful word longer than 3 chars
    if (STOP_WORDS.has(lower)) return false;
    if (word.length < 2) return false;

    // Keep numbers, years, percentages
    if (/^\d+%?$/.test(word) || /^20\d{2}$/.test(word)) return true;

    // Keep proper nouns (capitalized words)
    if (/^[A-Z]/.test(word)) return true;

    // Keep longer words
    if (word.length > 3) return true;

    return false;
  });

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const word of keywords) {
    const lower = word.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      unique.push(word);
    }
  }

  return unique.slice(0, 5); // Max 5 keywords
}

/**
 * Build a search query from market title
 */
export function buildSearchQuery(marketTitle: string): string {
  const keywords = extractKeywords(marketTitle);

  // Use top 3 keywords for more focused results
  return keywords.slice(0, 3).join(' ');
}

/**
 * Parse Google News RSS XML response
 */
function parseRSSXML(xml: string): NewsArticle[] {
  const articles: NewsArticle[] = [];

  // Simple regex-based parsing (works server-side without DOM)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/;
  const linkRegex = /<link>([\s\S]*?)<\/link>/;
  const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;
  const sourceRegex = /<source[^>]*>([\s\S]*?)<\/source>/;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const titleMatch = item.match(titleRegex);
    const linkMatch = item.match(linkRegex);
    const pubDateMatch = item.match(pubDateRegex);
    const sourceMatch = item.match(sourceRegex);

    // Extract title (handle CDATA or plain text)
    let title = titleMatch?.[1] || titleMatch?.[2] || '';
    // Clean up HTML entities
    title = title
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    // Skip if no title
    if (!title) continue;

    const link = linkMatch?.[1]?.trim() || '';
    const pubDate = pubDateMatch?.[1]?.trim();
    const source = sourceMatch?.[1]?.trim() || 'Google News';

    articles.push({
      title,
      link,
      source,
      pubDate: pubDate ? new Date(pubDate) : new Date(),
    });
  }

  return articles;
}

/**
 * Fetch news from Google News RSS
 */
export async function fetchGoogleNewsRSS(query: string): Promise<NewsArticle[]> {
  try {
    // Build Google News RSS URL
    const encodedQuery = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Google News RSS fetch failed:', response.status);
      return [];
    }

    const xml = await response.text();
    const articles = parseRSSXML(xml);

    // Sort by date (newest first)
    articles.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

    return articles.slice(0, 10); // Return top 10
  } catch (error) {
    console.error('Error fetching Google News RSS:', error);
    return [];
  }
}

/**
 * Get contextual news for a market
 */
export async function getContextualNews(marketTitle: string): Promise<NewsArticle[]> {
  const query = buildSearchQuery(marketTitle);

  if (!query || query.length < 3) {
    console.warn('No valid search query could be built from market title');
    return [];
  }

  return fetchGoogleNewsRSS(query);
}

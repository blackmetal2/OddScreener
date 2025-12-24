import { Suspense } from 'react';
import NewsClient from './NewsClient';
import { fetchGoogleNewsRSS } from '@/lib/api/googleNews';
import { AdjacentNewsItem } from '@/lib/api/adjacent-news';

export const metadata = {
  title: 'News | OddScreener',
  description: 'Real-time news affecting prediction markets',
};

export const dynamic = 'force-dynamic';

async function getInitialNews(): Promise<AdjacentNewsItem[]> {
  try {
    const query = 'prediction markets OR betting odds OR Polymarket OR Kalshi';
    const articles = await fetchGoogleNewsRSS(query);

    // Transform to our news format
    return articles.map((article, index) => ({
      id: `gn-${Date.now()}-${index}`,
      title: article.title,
      url: article.link,
      source: article.source,
      publishedAt: article.pubDate.toISOString(),
      createdAt: article.pubDate.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching initial news:', error);
    return [];
  }
}

function NewsLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary">Loading news...</p>
      </div>
    </div>
  );
}

async function NewsContent() {
  const initialNews = await getInitialNews();
  return <NewsClient initialNews={initialNews} />;
}

export default function NewsPage() {
  return (
    <Suspense fallback={<NewsLoading />}>
      <NewsContent />
    </Suspense>
  );
}

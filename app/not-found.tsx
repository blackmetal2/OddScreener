import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
        <h2 className="text-xl text-text-primary mb-2">Page Not Found</h2>
        <p className="text-text-secondary mb-6">The page you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent-hover transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

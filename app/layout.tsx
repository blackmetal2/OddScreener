import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OddScreener | Prediction Market Aggregator',
  description: 'Real-time prediction market data from Polymarket',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary font-sans antialiased">
        {children}
      </body>
    </html>
  )
}

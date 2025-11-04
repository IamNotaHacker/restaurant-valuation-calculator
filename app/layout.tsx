import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { DatabaseInitializer } from '@/components/DatabaseInitializer'
import './globals.css'

export const metadata: Metadata = {
  title: 'Restaurant Valuation Calculator | Blue Orbit',
  description: 'Professional restaurant valuation calculator by Blue Orbit Restaurant Consulting. Get accurate business valuations with industry-standard methods.',
  keywords: 'restaurant valuation, business valuation calculator, restaurant consulting, Blue Orbit',
  authors: [{ name: 'Blue Orbit Restaurant Consulting' }],
  openGraph: {
    title: 'Restaurant Valuation Calculator | Blue Orbit',
    description: 'Professional restaurant valuation calculator with SDE, EBITDA, and revenue multiples.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <DatabaseInitializer />
        {children}
        <Analytics />
      </body>
    </html>
  )
}

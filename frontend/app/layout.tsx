import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
// import { ThemeProvider } from 'next-themes'

import './globals.css'
import { QueryProvider } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CoinGecko Dashboard',
  description: 'A modern cryptocurrency dashboard with real-time data from CoinGecko API',
  keywords: 'cryptocurrency, bitcoin, ethereum, crypto dashboard, market data, charts',
  authors: [{ name: 'CoinGecko Dashboard' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}

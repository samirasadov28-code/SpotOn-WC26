import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import Navbar from '@/components/nav/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SpotOn WC26',
  description: 'Predict. Compete. Win.',
  openGraph: {
    title: 'SpotOn WC26',
    description: 'The ultimate World Cup 2026 prediction game for friends.',
    images: [{ url: '/Logo 1254x1254.png' }],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/Logo 192x192.png',
    apple: '/Logo 192x192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen`}>
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900 min-h-screen`}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Navbar from '@/components/nav/Navbar'
import ScoreTicker from '@/components/ScoreTicker'
import { ToastProvider } from '@/components/ToastProvider'

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
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-M1XVY1FCED" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-M1XVY1FCED');
        `}</Script>
      </head>
      <body className={`${inter.className} bg-white text-gray-900 min-h-screen`}>
        <ToastProvider>
          <Navbar />
          <ScoreTicker />
          <main className="pb-16 md:pb-0">{children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}

import './globals.css'
import type { Metadata } from 'next'
import { Inter, Sora } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Uni-Storage',
  description: 'Your Belongings, Safely Stored. Affordable storage for UMP and TUT Nelspruit students.',
  icons: {
    icon: '/images/logo.jpg',
    shortcut: '/images/logo.jpg',
    apple: '/images/logo.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
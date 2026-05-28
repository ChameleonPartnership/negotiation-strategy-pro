import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Negotiation Strategy Pro — Chameleon Partnership',
  description:
    'Build your complete negotiation strategy with Chameleon Partnership structured decision-tree methodology.',
  openGraph: {
    title: 'Negotiation Strategy Pro',
    description: 'Strategic negotiation planning by Chameleon Partnership',
    siteName: 'Negotiation Strategy Pro',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}>
        {children}
        <Toaster position="top-right" theme="dark" richColors />
      </body>
    </html>
  )
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Renofloww — Verbouw zonder stress',
    template: '%s | Renofloww',
  },
  description:
    'Houd de controle over je verbouwing. Budget, aannemers, offertes en planning — alles op één plek.',
  keywords: ['verbouwing', 'renovatie', 'budget', 'aannemers', 'offertes', 'planning'],
  authors: [{ name: 'Renofloww' }],
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    url: 'https://renofloww.nl',
    siteName: 'Renofloww',
    title: 'Renofloww — Verbouw zonder stress',
    description:
      'Houd de controle over je verbouwing. Budget, aannemers, offertes en planning — alles op één plek.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Renofloww — Verbouw zonder stress',
    description: 'Houd de controle over je verbouwing.',
  },
  manifest: '/manifest.json',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${inter.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#288760" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}

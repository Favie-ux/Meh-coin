import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  metadataBase: new URL('https://mehcoin.xyz'),
  title: "$MEH — The Solana Memecoin for People Who Don't Care",
  description:
    "Crypto is always screaming. We got tired of the hype. $MEH is the Solana memecoin for everyone who just doesn't care. Whatever happens, happens.",
  icons: {
    icon: '/assets/favicon.svg',
  },
  openGraph: {
    type: 'website',
    title: '$MEH — Whatever happens, happens.',
    description: 'Indifference; to be used when one simply does not care. Official fair launch on Solana.',
    images: ['/assets/meh-token-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mehc0in',
    images: ['/assets/meh-token-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

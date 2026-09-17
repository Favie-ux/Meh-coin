import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  metadataBase: new URL('https://mehcoin.xyz'),
  title: "$MEH — Official Solana Memecoin | The Token of Pure Chill",
  description:
    "The official $MEH Solana memecoin. 100% fair launch, zero buy/sell taxes, burned LP, and live tap-to-earn community airdrop. Unbothered crypto culture on Solana.",
  icons: {
    icon: '/assets/favicon.svg',
  },
  openGraph: {
    type: 'website',
    title: '$MEH — Official Solana Memecoin',
    description: '100% Fair Launch on Solana. 0% Tax, LP Burned, Live Tap-to-Earn Rewards.',
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

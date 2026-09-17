'use client';

import React, { useState, useEffect } from 'react';
import Preloader from '@/components/Preloader';
import Header from '@/components/Header';
import DictionaryHero from '@/components/DictionaryHero';
import WhitelistInput from '@/components/WhitelistInput';
import MehTapper from '@/components/MehTapper';
import Tokenomics from '@/components/Tokenomics';
import SidewaysChart from '@/components/SidewaysChart';
import FaqSection from '@/components/FaqSection';
import Marquee from '@/components/Marquee';
import Footer from '@/components/Footer';
import WalletModal from '@/components/WalletModal';

const STORAGE_KEY_WALLET = 'meh_connected_wallet';

export default function HomePage() {
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check for URL sync parameters from external app/wallet redirect
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlWallet = params.get('connected_wallet') || params.get('wallet');
      const urlUser = params.get('user') || params.get('username');
      const urlScore = params.get('score');

      if (urlWallet && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(urlWallet)) {
        setConnectedWallet(urlWallet);
        localStorage.setItem(STORAGE_KEY_WALLET, urlWallet);

        if (urlUser) {
          localStorage.setItem('meh_tap_username', urlUser.slice(0, 20));
        }
        if (urlScore) {
          const s = parseInt(urlScore, 10);
          if (!isNaN(s) && s > 0) {
            localStorage.setItem('meh_tap_score', String(s));
          }
        }
        // Clean query parameters from address bar without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
    }

    // 2. Read local storage
    const saved = localStorage.getItem(STORAGE_KEY_WALLET);
    if (saved) {
      setConnectedWallet(saved);
    } else if (typeof window !== 'undefined') {
      // 3. Auto-connect if inside Phantom in-app browser with existing trust
      const autoCheck = async () => {
        const sol = (
          window as unknown as {
            solana?: {
              isPhantom?: boolean;
              connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{
                publicKey: { toString: () => string };
              }>;
            };
          }
        ).solana;

        if (sol?.isPhantom) {
          try {
            const resp = await sol.connect({ onlyIfTrusted: true });
            if (resp?.publicKey) {
              handleConnectWallet(resp.publicKey.toString());
            }
          } catch {
            // Not yet trusted
          }
        }
      };
      autoCheck();
      const t = setTimeout(autoCheck, 400);
      return () => clearTimeout(t);
    }
  }, []);


  const handleConnectWallet = (address: string) => {
    setConnectedWallet(address);
    localStorage.setItem(STORAGE_KEY_WALLET, address);
  };

  const handleDisconnectWallet = () => {
    setConnectedWallet(null);
    localStorage.removeItem(STORAGE_KEY_WALLET);
  };

  return (
    <>
      <Preloader />
      
      <Header
        onOpenWallet={() => setWalletModalOpen(true)}
        connectedWallet={connectedWallet}
      />

      <main>
        <DictionaryHero />
        <WhitelistInput connectedWallet={connectedWallet} />
        <MehTapper
          onOpenWallet={() => setWalletModalOpen(true)}
          connectedWallet={connectedWallet}
        />
        <Tokenomics />
        <SidewaysChart />
        <FaqSection />
        <Marquee />
      </main>

      <Footer />

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        connectedWallet={connectedWallet}
        onConnect={handleConnectWallet}
        onDisconnect={handleDisconnectWallet}
      />
    </>
  );
}

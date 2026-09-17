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
    const saved = localStorage.getItem(STORAGE_KEY_WALLET);
    if (saved) {
      setConnectedWallet(saved);
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

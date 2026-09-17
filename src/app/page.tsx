'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { useToast } from '@/components/Toast';
import { playTapSound } from '@/lib/sound';

const STORAGE_KEY_WALLET = 'meh_connected_wallet';
const STORAGE_KEY_PENDING_SESSION = 'meh_pending_session';
const STORAGE_KEY_ACTIVE_SESSION = 'meh_active_session';

export default function HomePage() {
  const { showToast } = useToast();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  // Sync wallet to active session in database (if opened via pairing session)
  const syncWalletToActiveSession = useCallback(async (walletAddress: string) => {
    if (typeof window === 'undefined') return;
    const activeSession = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
    if (!activeSession) return;

    try {
      const u = localStorage.getItem('meh_tap_username') || undefined;
      const s = parseInt(localStorage.getItem('meh_tap_score') || '0', 10);
      await fetch('/api/wallet-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession,
          wallet: walletAddress,
          username: u,
          score: s,
        }),
      });
    } catch {
      // Best-effort session sync
    }
  }, []);

  const handleConnectWallet = useCallback((address: string) => {
    setConnectedWallet(address);
    localStorage.setItem(STORAGE_KEY_WALLET, address);
    syncWalletToActiveSession(address);
  }, [syncWalletToActiveSession]);

  const handleDisconnectWallet = useCallback(() => {
    setConnectedWallet(null);
    localStorage.removeItem(STORAGE_KEY_WALLET);
    localStorage.removeItem(STORAGE_KEY_PENDING_SESSION);
  }, []);

  // 1. URL parameter check & trusted provider auto-connect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);

    // If opened via pairing session in Phantom app
    const sessionParam = params.get('session');
    if (sessionParam) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, sessionParam);
    }

    // If URL has direct sync params
    const urlWallet = params.get('connected_wallet') || params.get('wallet');
    const urlUser = params.get('user') || params.get('username');
    const urlScore = params.get('score');

    if (urlWallet && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(urlWallet)) {
      handleConnectWallet(urlWallet);
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

    // Read stored wallet
    const saved = localStorage.getItem(STORAGE_KEY_WALLET);
    if (saved) {
      setConnectedWallet(saved);
      syncWalletToActiveSession(saved);
    } else {
      // Auto-connect if inside Phantom in-app browser with existing trust
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
              const addr = resp.publicKey.toString();
              handleConnectWallet(addr);
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
  }, [handleConnectWallet, syncWalletToActiveSession]);

  // 2. Real-time background database listener for Mobile Chrome <-> Phantom pairing
  useEffect(() => {
    if (typeof window === 'undefined' || connectedWallet) return;

    const checkPendingSession = async () => {
      const pendingId = localStorage.getItem(STORAGE_KEY_PENDING_SESSION);
      if (!pendingId) return;

      try {
        const res = await fetch(`/api/wallet-session?id=${encodeURIComponent(pendingId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.session?.status === 'connected' && data.session.wallet) {
            const w = data.session.wallet;
            handleConnectWallet(w);
            localStorage.removeItem(STORAGE_KEY_PENDING_SESSION);

            if (data.session.username) {
              localStorage.setItem('meh_tap_username', data.session.username);
            }
            if (typeof data.session.score === 'number' && data.session.score > 0) {
              localStorage.setItem('meh_tap_score', String(data.session.score));
            }

            setWalletModalOpen(false);
            showToast(`🎉 Connected to Phantom! Address: ${w.slice(0, 4)}...${w.slice(-4)}`);
            playTapSound();
          }
        }
      } catch {
        // Retry silently
      }
    };

    // Check immediately on mount
    checkPendingSession();

    // Check every 1.5s while pending
    const interval = setInterval(checkPendingSession, 1500);

    // When user switches back from Phantom to Google Chrome!
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPendingSession();
      }
    };

    const handleFocus = () => {
      checkPendingSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [connectedWallet, handleConnectWallet, showToast]);

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

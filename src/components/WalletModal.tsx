'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';
import { playTapSound } from '@/lib/sound';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedWallet: string | null;
  onConnect: (wallet: string) => void;
  onDisconnect: () => void;
}

export default function WalletModal({
  isOpen,
  onClose,
  connectedWallet,
  onConnect,
  onDisconnect,
}: WalletModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'providers' | 'manual'>('providers');
  const [manualAddress, setManualAddress] = useState('');
  const [manualError, setManualError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [hasPhantom, setHasPhantom] = useState(false);
  const [hasSolflare, setHasSolflare] = useState(false);
  const [solBalance, setSolBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Check providers and mobile environment
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mobileCheck = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    setIsMobile(mobileCheck);

    const checkWallets = () => {
      const sol = (window as unknown as { solana?: { isPhantom?: boolean } }).solana;
      if (sol?.isPhantom) setHasPhantom(true);

      const sf = (window as unknown as { solflare?: { isSolflare?: boolean } }).solflare;
      if (sf?.isSolflare) setHasSolflare(true);
    };

    checkWallets();
    const timer = setTimeout(checkWallets, 300);
    return () => clearTimeout(timer);
  }, []);

  // Fetch real on-chain SOL balance from mainnet when connected
  useEffect(() => {
    if (!connectedWallet) {
      setSolBalance(null);
      return;
    }
    let cancelled = false;
    setLoadingBalance(true);

    fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [connectedWallet],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.result?.value !== undefined) {
          const sol = Number(data.result.value) / 1e9;
          setSolBalance(`${sol.toFixed(3)} SOL`);
        } else {
          setSolBalance('0.000 SOL');
        }
      })
      .catch(() => {
        if (!cancelled) setSolBalance(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingBalance(false);
      });

    return () => {
      cancelled = true;
    };
  }, [connectedWallet]);

  if (!isOpen) return null;

  const handleConnectPhantom = async () => {
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

    // 1. Injected Phantom Provider is present (Desktop extension OR inside Phantom App In-App Browser)
    if (sol?.isPhantom) {
      try {
        const resp = await sol.connect();
        const address = resp.publicKey.toString();
        onConnect(address);
        showToast(`Connected: ${address.slice(0, 4)}...${address.slice(-4)}`);
        playTapSound();
        onClose();
        return;
      } catch (err: unknown) {
        const errorObj = err as { code?: number };
        if (errorObj?.code === 4001) {
          showToast('Connection rejected in Phantom.');
        } else {
          showToast('Could not connect to Phantom.');
        }
        return;
      }
    }

    // 2. Mobile outside Phantom (Safari / Chrome Mobile) -> Deep Link directly into Phantom In-App Browser
    if (isMobile) {
      showToast('Opening in Phantom mobile app...');
      const cleanUrl = window.location.href.split('#')[0];
      const ref = window.location.origin;
      const phantomDeepLink = `https://phantom.app/ul/browse/${encodeURIComponent(
        cleanUrl
      )}?ref=${encodeURIComponent(ref)}`;
      window.location.href = phantomDeepLink;
      return;
    }

    // 3. Desktop without extension
    showToast('Phantom extension not detected. Opening download page...');
    window.open('https://phantom.app/download', '_blank', 'noopener,noreferrer');
  };

  const handleConnectSolflare = async () => {
    const sf = (
      window as unknown as {
        solflare?: {
          isSolflare?: boolean;
          connect: () => Promise<void>;
          publicKey?: { toString: () => string };
        };
      }
    ).solflare;

    // 1. Injected Solflare Provider is present
    if (sf?.isSolflare) {
      try {
        await sf.connect();
        const address = sf.publicKey?.toString();
        if (address) {
          onConnect(address);
          showToast(`Connected: ${address.slice(0, 4)}...${address.slice(-4)}`);
          playTapSound();
          onClose();
          return;
        }
      } catch {
        showToast('Connection cancelled in Solflare.');
        return;
      }
    }

    // 2. Mobile outside Solflare -> Deep Link directly into Solflare In-App Browser
    if (isMobile) {
      showToast('Opening in Solflare mobile app...');
      const cleanUrl = window.location.href.split('#')[0];
      const ref = window.location.origin;
      const solflareDeepLink = `https://solflare.com/ul/v1/browse/${encodeURIComponent(
        cleanUrl
      )}?ref=${encodeURIComponent(ref)}`;
      window.location.href = solflareDeepLink;
      return;
    }

    // 3. Desktop without extension
    showToast('Solflare extension not detected. Opening download page...');
    window.open('https://solflare.com/download', '_blank', 'noopener,noreferrer');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualAddress.trim();
    if (!trimmed) {
      setManualError('Please paste your Solana wallet address.');
      return;
    }
    // Base58 Solana public key check (32-44 characters)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
      setManualError('Invalid Solana address. Must be 32-44 base58 characters.');
      return;
    }

    setManualError('');
    onConnect(trimmed);
    showToast(`Linked: ${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`);
    playTapSound();
    onClose();
  };

  const handleDisconnect = () => {
    onDisconnect();
    showToast('Wallet disconnected.');
    onClose();
  };

  const tapScore = typeof window !== 'undefined' ? localStorage.getItem('meh_tap_score') || '0' : '0';

  return (
    <div
      className="modal-backdrop active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="wallet-modal-card">
        <div className="modal-header">
          <h3 className="modal-title">
            {connectedWallet ? 'Wallet Connected' : 'Connect Solana Wallet'}
          </h3>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {!connectedWallet ? (
          <>
            <p className="modal-desc">
              Connect your Solana wallet to link your Meh Tap score and verify airdrop eligibility.
            </p>

            {isMobile && (
              <div className="mobile-wallet-guidance">
                <span className="mobile-guidance-icon">💡</span>
                <div className="mobile-guidance-text">
                  <strong>Mobile Chrome Tip:</strong> Mobile browsers cannot directly run extensions. You can either <strong>paste your Solana address</strong> in the &ldquo;Paste Address&rdquo; tab for instant connection in Chrome, or tap <strong>Phantom</strong> to open in Phantom&apos;s Web3 app.
                </div>
              </div>
            )}

            {/* Mode Switcher */}
            <div className="wallet-tab-group">
              <button
                type="button"
                className={`wallet-tab-btn ${activeTab === 'providers' ? 'active' : ''}`}
                onClick={() => setActiveTab('providers')}
              >
                Instant Connect
              </button>
              <button
                type="button"
                className={`wallet-tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
                onClick={() => setActiveTab('manual')}
              >
                Paste Address
              </button>
            </div>

            {activeTab === 'providers' ? (
              <div className="wallet-list">
                {/* Phantom Wallet */}
                <button
                  type="button"
                  id="optPhantom"
                  className="wallet-option-btn"
                  onClick={handleConnectPhantom}
                >
                  <div className="wallet-opt-left">
                    <div className="wallet-opt-icon" style={{ background: '#ab9ff2', color: '#000' }}>
                      👻
                    </div>
                    <div className="wallet-opt-text">
                      <span className="wallet-opt-name">Phantom</span>
                      <span className="wallet-opt-sub">
                        {hasPhantom
                          ? 'Injected & ready'
                          : isMobile
                          ? 'Direct mobile app redirect'
                          : 'Popular Solana wallet'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={
                      hasPhantom
                        ? 'wallet-badge-detected'
                        : isMobile
                        ? 'wallet-badge-mobile'
                        : 'wallet-badge-missing'
                    }
                  >
                    {hasPhantom
                      ? 'Detected'
                      : isMobile
                      ? 'Open Phantom ↗'
                      : 'Install ↗'}
                  </span>
                </button>

                {/* Solflare Wallet */}
                <button
                  type="button"
                  id="optSolflare"
                  className="wallet-option-btn"
                  onClick={handleConnectSolflare}
                >
                  <div className="wallet-opt-left">
                    <div className="wallet-opt-icon" style={{ background: '#fc7434', color: '#000' }}>
                      🔥
                    </div>
                    <div className="wallet-opt-text">
                      <span className="wallet-opt-name">Solflare</span>
                      <span className="wallet-opt-sub">
                        {hasSolflare
                          ? 'Injected & ready'
                          : isMobile
                          ? 'Direct mobile app redirect'
                          : 'Solana native wallet'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={
                      hasSolflare
                        ? 'wallet-badge-detected'
                        : isMobile
                        ? 'wallet-badge-mobile'
                        : 'wallet-badge-missing'
                    }
                  >
                    {hasSolflare
                      ? 'Detected'
                      : isMobile
                      ? 'Open Solflare ↗'
                      : 'Install ↗'}
                  </span>
                </button>
              </div>
            ) : (
              /* Manual Address Form */
              <form className="manual-wallet-form" onSubmit={handleManualSubmit}>
                <label className="manual-wallet-label" htmlFor="manualSolAddress">
                  Solana Wallet Public Key:
                </label>
                <div className="manual-wallet-input-wrap">
                  <input
                    type="text"
                    id="manualSolAddress"
                    className="manual-wallet-input"
                    placeholder="Paste 32-44 char Solana address"
                    value={manualAddress}
                    onChange={(e) => {
                      setManualAddress(e.target.value);
                      if (manualError) setManualError('');
                    }}
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>
                {manualError && <div className="manual-wallet-error">{manualError}</div>}
                <button type="submit" className="btn-manual-connect">
                  Link Solana Address
                </button>
                <p className="manual-wallet-hint">
                  Supports any Solana wallet (Phantom, Backpack, Coinbase Wallet, or Exchange).
                </p>
              </form>
            )}

            <div className="modal-footer-note">
              {isMobile ? (
                <span>📱 Mobile tip: Tapping Phantom directly opens this page in your Phantom mobile app.</span>
              ) : (
                <span>🔒 Secure non-custodial connection. No keys or private credentials are ever requested.</span>
              )}
            </div>
          </>
        ) : (
          /* Connected State Card */
          <div className="connected-card">
            <div className="connected-info-box">
              <div className="conn-row">
                <span>Address</span>
                <strong title={connectedWallet}>
                  {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-6)}
                </strong>
              </div>
              <div className="conn-row">
                <span>Network</span>
                <strong>Solana Mainnet</strong>
              </div>
              <div className="conn-row">
                <span>On-Chain SOL</span>
                <strong>{loadingBalance ? 'Checking...' : solBalance || '0.000 SOL'}</strong>
              </div>
              <div className="conn-row">
                <span>Tap Score Linked</span>
                <strong style={{ color: 'var(--accent-solana)' }}>
                  {parseInt(tapScore, 10).toLocaleString()} points
                </strong>
              </div>
            </div>

            {/* Cross-Browser Sync Button (ideal when connected inside Phantom or on mobile) */}
            <div className="wallet-sync-box">
              <div className="wallet-sync-info">
                <span className="sync-title">Using Chrome or Safari?</span>
                <span className="sync-desc">
                  Tap below to open this session in your phone&apos;s default browser with your wallet and score synced.
                </span>
              </div>
              <button
                type="button"
                className="btn-sync-browser"
                onClick={() => {
                  const url = new URL(window.location.origin);
                  url.searchParams.set('connected_wallet', connectedWallet);
                  const u = localStorage.getItem('meh_tap_username');
                  if (u) url.searchParams.set('user', u);
                  const s = localStorage.getItem('meh_tap_score');
                  if (s) url.searchParams.set('score', s);
                  window.open(url.toString(), '_blank');
                  showToast('Opening synced session in browser...');
                }}
              >
                Sync &amp; Open in Chrome / Safari ↗
              </button>
            </div>

            <button
              type="button"
              className="btn-disconnect-wallet"
              onClick={handleDisconnect}
            >
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

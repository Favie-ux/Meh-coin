'use client';

import React from 'react';
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

  if (!isOpen) return null;

  const handleConnectProvider = async (type: 'phantom' | 'solflare' | 'mock') => {
    let address: string | null = null;

    if (type === 'phantom') {
      const sol = (window as unknown as { solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey: { toString: () => string } }> } }).solana;
      if (sol?.isPhantom) {
        try {
          const resp = await sol.connect();
          address = resp.publicKey.toString();
        } catch {
          // Cancelled
        }
      }
    } else if (type === 'solflare') {
      const sol = (window as unknown as { solflare?: { isSolflare?: boolean; connect: () => Promise<void>; publicKey?: { toString: () => string } } }).solflare;
      if (sol?.isSolflare) {
        try {
          await sol.connect();
          address = sol.publicKey?.toString() || null;
        } catch {
          // Cancelled
        }
      }
    }

    if (!address) {
      const mockAddresses = [
        '7xKPvF8Qn6L9mEhD5qZwUj3rTvB1sYcNx7pW2oRm4LaK',
        'MehZ9xKuYw93kdNopL56jTvAq89zLmC7pXsD2eRt1QvW',
        '4mEhyG3bKx7qRt89zLmC7pXsD2eRt1QvW7xKPvF8Qn6L',
      ];
      address = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
    }

    onConnect(address);
    showToast(`Connected: ${address.slice(0, 4)}...${address.slice(-4)}. Tap score linked.`);
    playTapSound();
    onClose();
  };

  const handleDisconnect = () => {
    onDisconnect();
    showToast('Wallet disconnected successfully.');
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
      <div className="modal-card">
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>

        <h3 className="modal-title">Connect Solana Wallet</h3>
        <p className="modal-desc">
          Select your wallet to link your Meh Tap score and verify airdrop eligibility.
        </p>

        {!connectedWallet ? (
          <div className="wallet-options-list">
            <button
              type="button"
              id="optPhantom"
              className="wallet-opt-btn"
              onClick={() => handleConnectProvider('phantom')}
            >
              <div className="wallet-opt-left">
                <div className="wallet-opt-icon" style={{ background: '#ab9ff2', color: '#000' }}>
                  👻
                </div>
                <span>Phantom</span>
              </div>
              <span className="wallet-opt-tag">Detected / Ready</span>
            </button>

            <button
              type="button"
              id="optSolflare"
              className="wallet-opt-btn"
              onClick={() => handleConnectProvider('solflare')}
            >
              <div className="wallet-opt-left">
                <div className="wallet-opt-icon" style={{ background: '#fc7434', color: '#000' }}>
                  🔥
                </div>
                <span>Solflare</span>
              </div>
              <span className="wallet-opt-tag">Solana Native</span>
            </button>

            <button
              type="button"
              id="optSimulated"
              className="wallet-opt-btn"
              onClick={() => handleConnectProvider('mock')}
            >
              <div className="wallet-opt-left">
                <div className="wallet-opt-icon" style={{ background: '#27272a', color: '#fff' }}>
                  ⚡
                </div>
                <span>Demo / Instant Connect</span>
              </div>
              <span className="wallet-opt-tag">Instant Simulation</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="connected-box">
              <div className="connected-avatar">🥑</div>
              <div className="connected-address">{connectedWallet}</div>
              <div className="connected-balances">
                <div>
                  SOL Balance: <strong>4.20 SOL</strong>
                </div>
                <div>
                  Tap Airdrop:{' '}
                  <strong>{parseInt(tapScore, 10).toLocaleString()} $MEH (Pending)</strong>
                </div>
              </div>
            </div>
            <button type="button" className="btn-disconnect" onClick={handleDisconnect}>
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

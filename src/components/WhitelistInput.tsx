'use client';

import React, { useState, useEffect } from 'react';
import { playTapSound } from '@/lib/sound';
import { useToast } from './Toast';

const STORAGE_KEY_WHITELIST = 'meh_whitelist_address';

interface WhitelistInputProps {
  connectedWallet?: string | null;
}

export default function WhitelistInput({ connectedWallet }: WhitelistInputProps) {
  const [address, setAddress] = useState('');
  const [feedback, setFeedback] = useState<{
    text: string;
    type: 'idle' | 'success' | 'error';
  }>({
    text: 'Status: Ready to register your wallet for the $MEH Community Airdrop.',
    type: 'idle',
  });

  const { showToast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WHITELIST);
    if (saved) {
      setAddress(saved);
      setFeedback({
        text: `✓ Address registered: ${saved.slice(0, 4)}...${saved.slice(-4)} — Whitelist spot confirmed!`,
        type: 'success',
      });
    }
  }, []);

  const isValidSolanaAddress = (addr: string) => {
    if (!addr || addr.length < 32 || addr.length > 44) return false;
    return /^[1-9A-HJ-NP-Za-km-z]+$/.test(addr);
  };

  const handleAutofillConnected = () => {
    if (!connectedWallet) return;
    setAddress(connectedWallet);
    localStorage.setItem(STORAGE_KEY_WHITELIST, connectedWallet);
    setFeedback({
      text: `✓ Connected wallet registered: ${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)} — Whitelist spot confirmed!`,
      type: 'success',
    });
    showToast('Whitelisted your connected Solana wallet for the $MEH Airdrop!');
    playTapSound();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = address.trim();

    if (!val) {
      setFeedback({
        text: 'Please provide a valid Solana wallet address.',
        type: 'error',
      });
      return;
    }

    if (!isValidSolanaAddress(val)) {
      setFeedback({
        text: 'Invalid address format. Please enter a valid Solana Base58 public key (32-44 chars).',
        type: 'error',
      });
      return;
    }

    localStorage.setItem(STORAGE_KEY_WHITELIST, val);
    setFeedback({
      text: `✓ Registered ${val.slice(0, 4)}...${val.slice(-4)} — You are officially on the $MEH Fair Launch Whitelist!`,
      type: 'success',
    });

    showToast('Solana address successfully registered for the airdrop!');
    playTapSound();
  };

  return (
    <section className="section-whitelist" id="whitelist">
      <div className="container whitelist-wrapper">
        <div className="section-head">
          <span className="section-tag">AIRDROP // WHITELIST REGISTRATION</span>
          <h2 className="section-title">The Meh-Drop Whitelist</h2>
          <p className="section-subtitle">
            Enter your Solana wallet address to secure your whitelist spot for the upcoming Fair Launch & Community Airdrop.
          </p>
        </div>

        <div className="whitelist-input-card">
          {connectedWallet && (
            <div className="whitelist-autofill-banner">
              <div className="autofill-left">
                <span className="wallet-dot-green"></span>
                <span>Connected Wallet: <strong>{connectedWallet.slice(0, 4)}...{connectedWallet.slice(-4)}</strong></span>
              </div>
              <button
                type="button"
                className="btn-autofill-wallet"
                onClick={handleAutofillConnected}
              >
                Autofill & Register
              </button>
            </div>
          )}

          <form className="whitelist-form" onSubmit={handleSubmit}>
            <div className="whitelist-input-wrap">
              <input
                type="text"
                id="whitelistInput"
                className="whitelist-input"
                placeholder="Enter Solana wallet (e.g. 7xKPvF8Qn6L9mEhD5qZwUj...)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <button type="submit" className="btn-whitelist-submit">
              Register Address
            </button>
          </form>

          <div id="whitelistFeedback" className={`whitelist-status-feedback ${feedback.type}`}>
            {feedback.text}
          </div>
        </div>
      </div>
    </section>
  );
}

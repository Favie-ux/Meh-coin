'use client';

import React, { useState, useEffect } from 'react';
import { isSfxEnabled, setSfxEnabled } from '@/lib/sound';
import { useToast } from './Toast';

interface HeaderProps {
  onOpenWallet: () => void;
  connectedWallet: string | null;
}

export default function Header({ onOpenWallet, connectedWallet }: HeaderProps) {
  const [sfxOn, setSfxOn] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setSfxOn(isSfxEnabled());
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const toggleSfx = () => {
    const next = !sfxOn;
    setSfxOn(next);
    setSfxEnabled(next);
    showToast(next ? "Sound effects enabled." : "Sound effects muted.");
  };

  const formatShort = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <>
      <header className="site-header">
        <div className="container nav-container">
          <a href="#" className="brand-logo" aria-label="$MEH Home">
            <span className="brand-symbol">$</span>MEH
            <span className="brand-dot"></span>
          </a>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <ul className="nav-menu">
              <li>
                <a href="#about" className="nav-link">
                  About
                </a>
              </li>
              <li>
                <a href="#manifesto" className="nav-link">
                  Manifesto
                </a>
              </li>
              <li>
                <a href="#whitelist" className="nav-link">
                  Airdrop
                </a>
              </li>
              <li>
                <a href="#tapper" className="nav-link">
                  Tap-to-Earn
                </a>
              </li>
              <li>
                <a href="#tokenomics" className="nav-link">
                  Tokenomics
                </a>
              </li>
              <li>
                <a href="#faq" className="nav-link">
                  FAQ
                </a>
              </li>
            </ul>
          </nav>

          {/* Desktop & Header Actions */}
          <div className="nav-actions">
            {/* Sound Toggle (Desktop only) */}
            <button
              type="button"
              className={`btn-sfx desktop-only ${sfxOn ? 'active' : ''}`}
              onClick={toggleSfx}
              title="Toggle Sound FX"
            >
              <span className="sfx-indicator"></span>
              <span className="sfx-text">SFX: {sfxOn ? 'ON' : 'OFF'}</span>
            </button>

            {/* Social Icons (Desktop only) */}
            <a
              href="https://x.com/mehc0in?s=11"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-btn desktop-only"
              title="Follow on X"
              aria-label="Official Twitter / X"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            <a
              href="https://t.me/+YTpPLtaTNAhjNzIx"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-btn desktop-only"
              title="Telegram Community"
              aria-label="Official Telegram"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
              </svg>
            </a>

            {/* Connect Wallet Button */}
            <button
              type="button"
              id="btnConnectWallet"
              className={`btn-wallet ${connectedWallet ? 'connected' : ''}`}
              onClick={onOpenWallet}
            >
              {connectedWallet ? (
                <>
                  <span className="wallet-dot"></span>
                  <span className="wallet-label">{formatShort(connectedWallet)}</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <span className="wallet-label">Connect</span>
                </>
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className={`mobile-toggle ${mobileOpen ? 'open' : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle Mobile Menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Overlay */}
      <div className={`mobile-nav-overlay ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-nav-backdrop" onClick={() => setMobileOpen(false)}></div>
        
        <div className="mobile-nav-drawer">
          <div className="mobile-drawer-header">
            <div className="brand-logo">
              <span className="brand-symbol">$</span>MEH
              <span className="brand-dot"></span>
            </div>
            <button
              type="button"
              className="btn-close-mobile"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className="mobile-drawer-nav">
            <a
              href="#about"
              className="mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              <span>About $MEH</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </a>
            <a
              href="#manifesto"
              className="mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              <span>Anti-Hype Manifesto</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </a>
            <a
              href="#whitelist"
              className="mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              <span>Airdrop Whitelist</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </a>
            <a
              href="#tapper"
              className="mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              <span>The Meh Tapper</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </a>
            <a
              href="#tokenomics"
              className="mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              <span>Tokenomics</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </a>
            <a
              href="#faq"
              className="mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              <span>Why $MEH? (FAQ)</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </a>
          </nav>

          <div className="mobile-drawer-footer">
            <button
              type="button"
              className="btn-wallet mobile-wallet-btn"
              onClick={() => {
                setMobileOpen(false);
                onOpenWallet();
              }}
            >
              {connectedWallet ? (
                <>
                  <span className="wallet-dot"></span>
                  <span>Connected: {formatShort(connectedWallet)}</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <span>Connect Solana Wallet</span>
                </>
              )}
            </button>

            <div className="mobile-drawer-bottom-actions">
              <button
                type="button"
                className={`btn-sfx mobile-sfx ${sfxOn ? 'active' : ''}`}
                onClick={toggleSfx}
              >
                <span className="sfx-indicator"></span>
                <span>SFX: {sfxOn ? 'ON' : 'OFF'}</span>
              </button>

              <div className="mobile-social-row">
                <a
                  href="https://x.com/mehc0in?s=11"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon-btn"
                  title="Follow on X"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://t.me/+YTpPLtaTNAhjNzIx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon-btn"
                  title="Telegram"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

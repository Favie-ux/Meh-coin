'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="site-footer" id="socials">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">$MEH.</div>
            <div className="footer-disclaimer-card">
              <strong>DISCLAIMER:</strong> $MEH is a community-driven Solana memecoin created for culture and entertainment.
              Always do your own research (DYOR). Cryptocurrency trading involves market risk.
            </div>
          </div>

          <div className="footer-links-col">
            <ul className="footer-nav-list">
              <li>
                <a href="#about">About</a>
              </li>
              <li>
                <a href="#whitelist">Whitelist</a>
              </li>
              <li>
                <a href="#tapper">The Tapper</a>
              </li>
              <li>
                <a href="#tokenomics">Tokenomics</a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
            </ul>

            <div className="footer-socials">
              <a
                href="https://x.com/mehc0in?s=11"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                title="X (Twitter)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; 2026 $MEH. All rights reserved. The official Solana coin of pure chill.</span>
          <span>Built on Solana • 100% Community Driven</span>
        </div>
      </div>
    </footer>
  );
}

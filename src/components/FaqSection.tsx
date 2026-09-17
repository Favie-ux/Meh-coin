'use client';

import React, { useState } from 'react';
import { playTapSound } from '@/lib/sound';

interface FaqItem {
  id: string;
  q: string;
  a: string;
  highlight?: string;
}

const faqs: FaqItem[] = [
  {
    id: 'faq-1',
    q: 'What is $MEH?',
    a: 'In a crypto landscape drenched in fake roadmaps, over-leveraged influencers, and 24/7 screeching hype, $MEH is the antidote. It is a Solana memecoin inspired by the universal expression of indifference. We don’t care if Bitcoin is at $100k or $10k. Whatever happens, happens.',
    highlight: 'Standard definition: Indifference; to be used when one simply does not care.',
  },
  {
    id: 'faq-2',
    q: 'How do I join the Whitelist and Airdrop?',
    a: 'Scroll up to the Fair Launch Whitelist section, enter your Solana wallet address (or connect Phantom / Solflare to autofill in one click), and submit. Registered wallets are recorded for upcoming community airdrop distributions and priority launch updates.',
    highlight: 'Free registration • Instant one-click wallet autofill',
  },
  {
    id: 'faq-3',
    q: 'How does the Tap-to-Earn leaderboard work?',
    a: 'Tap the $MEH coin to earn points and recharge energy. Enter your custom handle in the Player Identity bar to track your position on the live leaderboard. Connect your Solana wallet to link your high score for upcoming community airdrop allocations.',
    highlight: 'Tip: Higher leaderboard rank earns community bragging rights and airdrop eligibility.',
  },
  {
    id: 'faq-4',
    q: 'When is the Fair Launch & where can I buy?',
    a: 'The official fair launch happens this Friday at 10:00 AM EST on Solana (via Raydium / Pump.fun). There is no whitelist presale price advantage, no insider VC rounds, and no secret allocations. Everyone buys at the same time.',
    highlight: 'Official Contract Address will be verified and published here at launch.',
  },
  {
    id: 'faq-5',
    q: 'What are the taxes and tokenomics?',
    a: 'Total supply is 1,000,000,000 $MEH. Mint authority is revoked forever. Liquidity pool (LP) tokens are 100% burned. Tax is 0% on buys and 0% on sells. Calculating tax formulas takes too much effort, so we banned them.',
    highlight: '0% Buy Tax • 0% Sell Tax • 100% Burned LP',
  },
  {
    id: 'faq-6',
    q: 'Will $MEH make me a millionaire?',
    a: 'We make absolutely zero financial promises, zero guarantees of utility, and zero claims of solving the global economy. This is a memecoin built for laughs and community apathy. Never risk funds you cannot afford to lose. Whatever happens, happens.',
    highlight: 'Rule #1: Stay unbothered.',
  },
];

export default function FaqSection() {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggle = (id: string) => {
    playTapSound();
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="section-faq" id="faq">
      <div className="container">
        <div className="section-head">
          <span className="section-tag">COMMUNITY // FREQUENTLY AVOIDED QUESTIONS</span>
          <h2 className="section-title">Why $MEH?</h2>
          <p className="section-subtitle">
            Answers to questions you probably shouldn’t care about, but asked anyway.
          </p>
        </div>

        <div className="faq-grid">
          {faqs.map((item, index) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className={`faq-card ${isOpen ? 'open' : ''}`}
                onClick={() => toggle(item.id)}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                >
                  <div className="faq-q-left">
                    <span className="faq-num">0{index + 1}</span>
                    <span className="faq-q-text">{item.q}</span>
                  </div>
                  <div className="faq-toggle-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline
                        points={isOpen ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}
                      />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${item.id}`}
                    className="faq-answer-pane"
                  >
                    <p className="faq-answer-text">{item.a}</p>
                    {item.highlight && (
                      <div className="faq-highlight-pill">
                        <span className="pill-dot"></span>
                        <span>{item.highlight}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

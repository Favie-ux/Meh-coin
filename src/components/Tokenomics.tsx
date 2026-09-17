'use client';

import React from 'react';

const tokensData = [
  {
    icon: '🪙',
    badge: 'FIXED',
    val: '1,000,000,000',
    label: 'Total Supply',
    desc: 'One billion $MEH. Mint authority revoked forever. No inflation, no surprise diluted prints.',
  },
  {
    icon: '💸',
    badge: '0% TAX',
    val: '0% / 0%',
    label: 'Buy & Sell Tax',
    desc: 'Zero tax on buys, zero tax on sells. Who even has the time or energy to calculate token taxes?',
  },
  {
    icon: '🔥',
    badge: 'SECURITY',
    val: '100%',
    label: 'LP Burned & Locked',
    desc: 'Liquidity pool tokens sent straight to the incinerator. Rugging requires effort, and we don’t have it.',
  },
  {
    icon: '💤',
    badge: 'REALITY',
    val: '0.00%',
    label: 'Promised Utility',
    desc: 'Absolutely zero promises. No artificial metaverse, no AI toaster buzzwords. Just pure, unadulterated vibe.',
  },
];

export default function Tokenomics() {
  return (
    <section className="section-tokenomics" id="tokenomics">
      <div className="container">
        <div className="section-head">
          <span className="section-tag">TOKEN SPECS // NO COMPLICATED MATH</span>
          <h2 className="section-title">Meh-nomics</h2>
          <p className="section-subtitle">
            Clean, fair, and free of bogus institutional VC unlock schedules.
          </p>
        </div>

        <div className="tokenomics-grid">
          {tokensData.map((item, index) => (
            <div key={index} className="tokenomics-card">
              <div className="tok-card-header">
                <div className="tok-icon">{item.icon}</div>
                <span className="tok-badge">{item.badge}</span>
              </div>
              <div className="tok-val">{item.val}</div>
              <div className="tok-label">{item.label}</div>
              <p className="tok-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { playPronunciationSound, playTapSound } from '@/lib/sound';
import { useToast } from './Toast';

export default function DictionaryHero() {
  const { showToast } = useToast();
  const [isPronouncing, setIsPronouncing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [themeMode, setThemeMode] = useState<'original' | 'dark'>('original');

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  });

  useEffect(() => {
    function getNextFriday10amEST() {
      const now = new Date();
      const target = new Date();
      const dayOfWeek = now.getUTCDay();
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7;

      target.setUTCDate(now.getUTCDate() + daysUntilFriday);
      target.setUTCHours(14, 0, 0, 0); // 10:00 AM EDT / 14:00 UTC

      if (target.getTime() <= now.getTime()) {
        target.setUTCDate(target.getUTCDate() + 7);
      }
      return target.getTime();
    }

    const launchTarget = getNextFriday10amEST();

    function updateTimer() {
      const now = Date.now();
      const distance = launchTarget - now;

      if (distance <= 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const pad = (n: number) => String(n).padStart(2, '0');
      setTimeLeft({
        days: pad(days),
        hours: pad(hours),
        minutes: pad(minutes),
        seconds: pad(seconds),
      });
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAudioPronounce = () => {
    setIsPronouncing(true);
    playPronunciationSound();
    showToast("Pronunciation: /mɛ/. You're welcome.");
    setTimeout(() => setIsPronouncing(false), 1200);
  };

  const handleCopyCa = () => {
    const textToCopy = "Launching Friday @ 10:00 AM EST";
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setIsCopied(true);
        showToast("Copied CA status to clipboard. Or whatever.");
        playTapSound();
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(() => {
        showToast("Clipboard copy failed. Classic.");
      });
    } else {
      setIsCopied(true);
      showToast("Copied CA status to clipboard. Or whatever.");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <section className="hero-section" id="about">
      {/* Background ambient lighting */}
      <div className="hero-ambient-glow"></div>

      <div className="container">
        {/* Top Status Banner */}
        <div className="hero-pill-badge-wrap">
          <div className="hero-pill-badge">
            <span className="live-pulse-dot"></span>
            <span className="badge-highlight">FAIR LAUNCH:</span>
            <span>FRIDAY 10:00 AM EST</span>
            <span className="badge-divider">•</span>
            <span className="badge-sub">$MEH ON SOLANA</span>
          </div>
        </div>

        <div className="hero-grid">
          {/* Column 1: The Official $MEH Coin Showcase & Genesis Card */}
          <div className="dictionary-card">
            <div className="dict-card-glow"></div>

            <div className="dict-header-row">
              <span className="dict-badge">
                <span className="dict-badge-indicator"></span>
                OFFICIAL COIN // SOLANA GENESIS
              </span>
              <span className="dict-edition">OXFORD-SOLANA ED.</span>
            </div>

            {/* Prominent Authentic Coin Image Centerpiece */}
            <div className="hero-coin-showcase">
              <div className={`hero-coin-frame ${themeMode === 'dark' ? 'dark-frame' : 'light-frame'}`}>
                <Image
                  src={themeMode === 'dark' ? '/assets/meh-token-dark.png' : '/assets/meh-token-image.png'}
                  alt="$MEH Official Coin Artwork"
                  width={340}
                  height={340}
                  className="hero-coin-img"
                  priority
                />

                <div className="coin-mint-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <span>VERIFIED SOLANA MINT</span>
                </div>
              </div>

              {/* Artwork Mode Switcher */}
              <div className="coin-artwork-toolbar">
                <span className="artwork-toolbar-label">Artwork Mode:</span>
                <div className="artwork-mode-toggles">
                  <button
                    type="button"
                    className={`mode-btn ${themeMode === 'original' ? 'active' : ''}`}
                    onClick={() => setThemeMode('original')}
                  >
                    Original Paper
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${themeMode === 'dark' ? 'active' : ''}`}
                    onClick={() => setThemeMode('dark')}
                  >
                    Dark Glass
                  </button>
                </div>
              </div>
            </div>

            {/* Audio Pronunciation & Phonetic Action */}
            <div className="dict-audio-row">
              <div className="phonetic-group">
                <span className="phonetic-label">Phonetic:</span>
                <span className="phonetic-text">/mɛ/</span>
                <span className="phonetic-desc">(Interjection / Token)</span>
              </div>

              <button
                type="button"
                className={`dict-audio-btn ${isPronouncing ? 'playing' : ''}`}
                onClick={handleAudioPronounce}
                title="Listen to official pronunciation"
                aria-label="Listen to official pronunciation"
              >
                <div className="sound-wave-icon">
                  <span className="bar bar-1"></span>
                  <span className="bar bar-2"></span>
                  <span className="bar bar-3"></span>
                </div>
                <span>{isPronouncing ? 'Pronouncing...' : 'Audio /mɛ/'}</span>
              </button>
            </div>

            <div className="dict-divider"></div>

            {/* Usage Example */}
            <div className="dict-examples-block">
              <span className="dict-example-label">PRACTICAL USAGE:</span>
              <p className="dict-example-text">
                &mdash; &ldquo;Did you see the chart just pumped 400%?&rdquo; <br />
                &mdash; &ldquo;<strong>Meh.</strong>&rdquo;
              </p>
            </div>

            {/* Token Meta Grid */}
            <div className="dict-meta-list">
              <div className="dict-meta-item">
                <span className="meta-label">Part of Speech</span>
                <span className="meta-value">Interjection / Token</span>
              </div>
              <div className="dict-meta-item">
                <span className="meta-label">Native Chain</span>
                <span className="meta-value text-solana">Solana Mainnet</span>
              </div>
              <div className="dict-meta-item">
                <span className="meta-label">Hype Index</span>
                <span className="meta-value">0.00% (Absolute Zero)</span>
              </div>
              <div className="dict-meta-item">
                <span className="meta-label">Max Promises</span>
                <span className="meta-value">None Expected</span>
              </div>
            </div>
          </div>

          {/* Column 2: Anti-Hype Manifesto & Launch Command Center */}
          <div className="hero-content" id="manifesto">
            {/* Anti-Hype Manifesto */}
            <div className="manifesto-box">
              <div className="manifesto-header">
                <span className="manifesto-tag">MANIFESTO // THE ANTI-HYPE STANDARD</span>
                <span className="manifesto-status-tag">REALITY CHECK</span>
              </div>

              <div className="manifesto-noise-panel">
                <span className="noise-label">CRYPTO NOISE:</span>
                <div className="noise-tags">
                  <span className="noise-pill">&quot;BUY NOW&quot;</span>
                  <span className="noise-pill">&quot;100X SOON&quot;</span>
                  <span className="noise-pill">&quot;TO THE MOON&quot;</span>
                  <span className="noise-pill">&quot;WAGMI&quot;</span>
                </div>
              </div>

              <p className="manifesto-core-text">
                <span className="manifesto-punchline">Meh.</span>
                We got tired of the screaming. So we created a coin for everyone who just… doesn’t care.
                Market pumping? <em>Meh.</em> Market dumping? <em>Meh.</em> Influencers screaming we’re going to zero? <em>Meh.</em>
              </p>
              
              <p className="manifesto-sub-text">
                No fake roadmaps. No pretending to cure world hunger on the blockchain. Just a silly coin, a community that refuses to sweat, and one simple rule:
              </p>

              <div className="manifesto-highlight">
                <span className="highlight-symbol">$MEH</span> — Whatever happens, happens.
              </div>
            </div>

            {/* Fair Launch Countdown Card */}
            <div className="launch-countdown-card">
              <div className="launch-card-header">
                <div className="launch-header-left">
                  <span className="live-pulse-dot"></span>
                  <span className="launch-tag">OFFICIAL FAIR LAUNCH COUNTDOWN</span>
                </div>
                <span className="launch-date-text">Friday @ 10:00 AM EST</span>
              </div>

              {/* Countdown Numbers */}
              <div className="countdown-grid">
                <div className="countdown-item">
                  <span className="countdown-number">{timeLeft.days}</span>
                  <span className="countdown-label">DAYS</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-number">{timeLeft.hours}</span>
                  <span className="countdown-label">HOURS</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-number">{timeLeft.minutes}</span>
                  <span className="countdown-label">MINUTES</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-number">{timeLeft.seconds}</span>
                  <span className="countdown-label">SECONDS</span>
                </div>
              </div>

              {/* Contract Address Section */}
              <div className="ca-container">
                <div className="ca-info">
                  <span className="ca-label">OFFICIAL SOLANA CONTRACT ADDRESS</span>
                  <span className="ca-value">Launching Friday @ 10:00 AM EST</span>
                </div>
                <button
                  type="button"
                  className={`btn-copy-ca ${isCopied ? 'copied' : ''}`}
                  onClick={handleCopyCa}
                  title="Copy CA status"
                >
                  {isCopied ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>Copy CA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Launch CTAs */}
              <div className="launch-actions">
                <a
                  href="https://t.me/mehc0insol"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-launch-action telegram"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
                  </svg>
                  <span>Join Telegram</span>
                </a>

                <a
                  href="https://x.com/mehc0in?s=11"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-launch-action twitter"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>Follow on X</span>
                </a>

                <div className="btn-launch-action pump-disabled" title="Coming Friday at 10:00 AM EST">
                  <span>Pump.fun</span>
                  <span className="badge-coming-soon">COMING SOON</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

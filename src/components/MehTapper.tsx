'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { playTapSound, playExhaustedSound } from '@/lib/sound';
import { useToast } from './Toast';

interface FloatingItem {
  id: number;
  text: string;
  x: number;
  y: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  tag?: string;
  isUser?: boolean;
}

const STORAGE_KEY_SCORE = 'meh_tap_score';
const STORAGE_KEY_ENERGY = 'meh_tap_energy';
const STORAGE_KEY_ENERGY_TIME = 'meh_tap_energy_time';
const STORAGE_KEY_USERNAME = 'meh_tap_username';

const MAX_ENERGY = 500;
const REGEN_INTERVAL_MS = 2500;

const phrases = [
  '+1 $MEH',
  'Meh.',
  'Whatever.',
  'Tap tap',
  '🥱',
  'Keep tapping',
  'Apathy King',
  'Sloth power',
  'Down bad',
  'Touch grass',
  'Good effort',
  'Stay unbothered',
  'Airdrop loading...',
  'Apathy lvl 100',
  'Legendary Loafer',
];

const INITIAL_RIVALS: LeaderboardEntry[] = [
  { id: 'r1', name: '0xSloth...9b4', score: 142890, tag: '👑 WHALE' },
  { id: 'r2', name: 'Wojak_Fatigued', score: 89420, tag: 'TIRED' },
  { id: 'r3', name: 'Procrastinator_Sol', score: 64210, tag: 'ZEN' },
  { id: 'r4', name: 'NapEnthusiast', score: 41005, tag: 'CHILL' },
  { id: 'r5', name: 'CouchPotato_99', score: 12500, tag: 'IDLE' },
  { id: 'r6', name: 'BoredApe_Exile', score: 2500, tag: 'APATHIST' },
  { id: 'r7', name: 'SleepySol', score: 150, tag: 'NOOB' },
  { id: 'r8', name: 'DoNothing_Degen', score: 25, tag: 'ZERO EFFORT' },
];

interface MehTapperProps {
  onOpenWallet: () => void;
  connectedWallet?: string | null;
}

export default function MehTapper({ onOpenWallet, connectedWallet }: MehTapperProps) {
  const { showToast } = useToast();
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [username, setUsername] = useState('Lazy_TapMaster');
  const [hasCustomName, setHasCustomName] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [squish, setSquish] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingItem[]>([]);
  const coinRef = useRef<HTMLDivElement>(null);

  // Initialize state from localStorage
  useEffect(() => {
    const savedScore = parseInt(localStorage.getItem(STORAGE_KEY_SCORE) || '0', 10);
    let savedEnergy = parseInt(localStorage.getItem(STORAGE_KEY_ENERGY) || String(MAX_ENERGY), 10);
    const lastTime = parseInt(localStorage.getItem(STORAGE_KEY_ENERGY_TIME) || String(Date.now()), 10);
    const savedName = localStorage.getItem(STORAGE_KEY_USERNAME);

    const now = Date.now();
    const elapsed = now - lastTime;
    const regen = Math.floor(elapsed / REGEN_INTERVAL_MS);
    if (regen > 0) {
      savedEnergy = Math.min(MAX_ENERGY, savedEnergy + regen);
      localStorage.setItem(STORAGE_KEY_ENERGY, String(savedEnergy));
      localStorage.setItem(STORAGE_KEY_ENERGY_TIME, String(now - (elapsed % REGEN_INTERVAL_MS)));
    }

    setScore(savedScore);
    setEnergy(savedEnergy);
    if (savedName) {
      setUsername(savedName);
      setHasCustomName(true);
    }
  }, []);

  // Energy regeneration interval
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((prev) => {
        if (prev < MAX_ENERGY) {
          const next = prev + 1;
          localStorage.setItem(STORAGE_KEY_ENERGY, String(next));
          localStorage.setItem(STORAGE_KEY_ENERGY_TIME, String(Date.now()));
          return next;
        }
        return prev;
      });
    }, REGEN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const getTierName = (s: number) => {
    if (s < 50) return 'Rank: Casual Sloth';
    if (s < 200) return 'Rank: Apathetic Acolyte';
    if (s < 1000) return 'Rank: Certified Loafer';
    if (s < 5000) return 'Rank: Grand Procrastinator';
    return 'Rank: Transcendentally Unbothered';
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tempName.trim();
    if (!trimmed) {
      setEditingName(false);
      return;
    }
    const clean = trimmed.slice(0, 20);
    setUsername(clean);
    setHasCustomName(true);
    localStorage.setItem(STORAGE_KEY_USERNAME, clean);
    setEditingName(false);
    showToast(`Leaderboard handle set to "${clean}". Whatever.`);
  };

  const handleUseWalletAsName = () => {
    if (!connectedWallet) return;
    const walletHandle = `${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`;
    setUsername(walletHandle);
    setHasCustomName(true);
    localStorage.setItem(STORAGE_KEY_USERNAME, walletHandle);
    showToast(`Handle updated to wallet ${walletHandle}`);
  };

  const spawnFloating = (clientX?: number, clientY?: number, overrideText?: string) => {
    if (!coinRef.current) return;
    const rect = coinRef.current.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const x = clientX ? clientX - rect.left : rect.width / 2 + (Math.random() * 80 - 40);
    const y = clientY ? clientY - rect.top : rect.height / 2 + (Math.random() * 40 - 20);

    const id = Date.now() + Math.random();
    const text = overrideText || phrases[Math.floor(Math.random() * phrases.length)];

    setFloatingTexts((prev) => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1100);
  };

  const handleTap = (clientX?: number, clientY?: number) => {
    if (energy <= 0) {
      spawnFloating(clientX, clientY, 'Out of energy. Go take a nap.');
      playExhaustedSound();
      showToast("Out of energy. Cooldown running. Relax.");
      return;
    }

    const nextEnergy = Math.max(0, energy - 1);
    const nextScore = score + 1;

    setEnergy(nextEnergy);
    setScore(nextScore);

    localStorage.setItem(STORAGE_KEY_SCORE, String(nextScore));
    localStorage.setItem(STORAGE_KEY_ENERGY, String(nextEnergy));
    localStorage.setItem(STORAGE_KEY_ENERGY_TIME, String(Date.now()));

    // Mobile haptic vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch {
        // Ignore
      }
    }

    playTapSound();

    // Tactile squish effect
    setSquish(true);
    setTimeout(() => setSquish(false), 70);

    spawnFloating(clientX, clientY);
  };

  // Dynamic live leaderboard with user ranking
  const fullLeaderboard: (LeaderboardEntry & { rank: number })[] = [
    ...INITIAL_RIVALS,
    {
      id: 'user',
      name: username,
      score: score,
      tag: 'YOU',
      isUser: true,
    },
  ]
    .sort((a, b) => b.score - a.score)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  const userRankObj = fullLeaderboard.find((x) => x.isUser);
  const userRank = userRankObj ? userRankObj.rank : fullLeaderboard.length;

  // Display top 6 entries plus user if user is further down
  let displayedList = fullLeaderboard.slice(0, 6);
  if (userRank > 6 && userRankObj) {
    displayedList = [...fullLeaderboard.slice(0, 5), userRankObj];
  }

  const tweetText = `I reached Rank #${userRank} on the $MEH Tap-to-Earn leaderboard with ${score.toLocaleString()} taps as @${username}! @mehc0in #MEH #Solana`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  return (
    <section className="section-tapper" id="tapper">
      <div className="container">
        <div className="section-head">
          <span className="section-tag">MINI-GAME // TAP-TO-EARN AIRDROP</span>
          <h2 className="section-title">The Meh Tapper</h2>
          <p className="section-subtitle">
            Tap the official $MEH coin to earn points, climb the live leaderboard, and boost your community airdrop eligibility.
          </p>
        </div>

        {/* PROMINENT PLAYER IDENTITY & NICKNAME BAR */}
        <div className="player-identity-bar">
          <div className="player-identity-left">
            <div className="player-avatar-badge">
              <span className="player-avatar-icon">😴</span>
              <span className="player-status-dot"></span>
            </div>

            <div className="player-meta-group">
              <span className="player-sub-label">LEADERBOARD PROFILE</span>
              {editingName || !hasCustomName ? (
                <form className="nickname-quick-form" onSubmit={handleSaveName}>
                  <input
                    type="text"
                    className="nickname-quick-input"
                    placeholder="Enter your handle (e.g. @SolanaSloth)..."
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    maxLength={20}
                    autoFocus={editingName}
                  />
                  <button type="submit" className="btn-quick-save">
                    {hasCustomName ? 'Update' : 'Claim Handle'}
                  </button>
                  {hasCustomName && (
                    <button
                      type="button"
                      className="btn-quick-cancel"
                      onClick={() => setEditingName(false)}
                    >
                      ✕
                    </button>
                  )}
                </form>
              ) : (
                <div className="player-name-display-row">
                  <span className="player-active-name">{username}</span>
                  <button
                    type="button"
                    className="btn-inline-edit"
                    onClick={() => {
                      setTempName(username);
                      setEditingName(true);
                    }}
                    title="Change handle"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Change</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="player-identity-right">
            {connectedWallet ? (
              <div className="wallet-link-status">
                <span className="wallet-dot-green"></span>
                <span className="wallet-short-txt">
                  Linked: {connectedWallet.slice(0, 4)}...{connectedWallet.slice(-4)}
                </span>
                {!hasCustomName && (
                  <button
                    type="button"
                    className="btn-use-wallet-handle"
                    onClick={handleUseWalletAsName}
                  >
                    Use as Handle
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="btn-link-wallet-banner"
                onClick={onOpenWallet}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                <span>Link Solana Wallet</span>
              </button>
            )}

            <div className="player-live-rank-pill">
              <span className="rank-pill-label">LIVE RANK</span>
              <strong className="rank-pill-num">#{userRank}</strong>
            </div>
          </div>
        </div>

        <div className="tapper-grid">
          {/* Main Coin Stage */}
          <div className="tapper-stage-card">
            <div className="tapper-header-bar">
              <div className="tapper-points-display">
                <span className="tapper-points-label">Total Meh Points</span>
                <span id="tapperPoints" className="tapper-points-val">
                  {score.toLocaleString()}
                </span>
              </div>
              <div className="tapper-tier-badge">{getTierName(score)}</div>
            </div>

            {/* Coin Interactive Stage */}
            <div className="coin-interactive-area">
              <div className="floating-text-container">
                {floatingTexts.map((item) => (
                  <div
                    key={item.id}
                    className="floating-text"
                    style={{ left: `${item.x}px`, top: `${item.y}px` }}
                  >
                    {item.text}
                  </div>
                ))}
              </div>

              {/* High-res 3D Circular Medallion with Authentic Coin Artwork */}
              <div
                ref={coinRef}
                id="mehCoinBtn"
                className={`meh-coin-btn ${squish ? 'squish' : ''}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleTap(e.clientX, e.clientY);
                }}
                role="button"
                tabIndex={0}
                aria-label="Tap to earn Meh points"
              >
                <div className="coin-glow-effect"></div>
                <Image
                  src="/assets/meh-medallion.png"
                  alt="$MEH Authentic Coin Medallion"
                  width={340}
                  height={340}
                  className="meh-medallion-img"
                  priority
                />
              </div>

              <div className="tap-hint-label">
                <span>👆 Click or Tap to Earn</span>
              </div>
            </div>

            {/* Apathy Energy Bar */}
            <div className="energy-bar-wrap">
              <div className="energy-meta">
                <span className="energy-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Apathy Energy (Auto-recharges +1 / 2.5s)
                </span>
                <span id="energyVal" className="energy-val">
                  {energy}/{MAX_ENERGY}
                </span>
              </div>
              <div className="energy-track">
                <div
                  className="energy-fill"
                  style={{ width: `${(energy / MAX_ENERGY) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Tapper CTAs */}
            <div className="tapper-actions-row">
              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-tapper-share"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Share Rank on X</span>
              </a>

              <button
                type="button"
                className="btn-tapper-save"
                onClick={onOpenWallet}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>{connectedWallet ? 'Score Saved with Wallet' : 'Save Score with Wallet'}</span>
              </button>
            </div>
          </div>

          {/* Dynamic Live Leaderboard Sidebar */}
          <div className="tapper-sidebar">
            <div className="leaderboard-card">
              <div className="leaderboard-header">
                <div>
                  <div className="lb-title-wrap">
                    <span className="live-pulse-dot"></span>
                    <h3 className="leaderboard-title">Laziest Tap Masters</h3>
                  </div>
                  <p className="leaderboard-subtitle">Real-time Hall of Apathy</p>
                </div>
                <div className="user-live-rank-badge">
                  <span>YOUR RANK</span>
                  <strong>#{userRank}</strong>
                </div>
              </div>

              {/* Dynamic Live Leaderboard List */}
              <ul className="leaderboard-list">
                {displayedList.map((entry) => {
                  let rankClass = '';
                  if (entry.rank === 1) rankClass = 'gold';
                  else if (entry.rank === 2) rankClass = 'silver';
                  else if (entry.rank === 3) rankClass = 'bronze';

                  return (
                    <li
                      key={entry.id}
                      className={`leaderboard-item ${entry.isUser ? 'user-item active-user' : ''}`}
                    >
                      <div className="lb-left">
                        <span className={`lb-rank ${rankClass}`}>#{entry.rank}</span>
                        <div className="lb-name-group">
                          <span className="lb-name">{entry.name}</span>
                          {entry.tag && (
                            <span className={`lb-tag ${entry.isUser ? 'user-tag' : ''}`}>
                              {entry.tag}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="lb-score">{entry.score.toLocaleString()} MEH</span>
                    </li>
                  );
                })}
              </ul>

              {/* Quick How It Works Guide */}
              <div className="tapper-rules-box">
                <div className="rules-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>HOW THE GAME WORKS</span>
                </div>
                <ul className="rules-list">
                  <li><strong>1. Tap:</strong> Each tap burns 1 Apathy Energy and earns 1 MEH point.</li>
                  <li><strong>2. Rank:</strong> Set your handle in the player bar to climb the live leaderboard.</li>
                  <li><strong>3. Reward:</strong> Connect your Solana wallet to link score for fair launch airdrop.</li>
                </ul>
              </div>
            </div>

            {/* Meme Quote Box */}
            <div className="lazy-quote-box">
              &quot;I could have learned a new programming language or studied high finance. Instead I clicked a coin 4,000 times that says &apos;Meh&apos;.&quot;
              <br />
              <br />
              <strong
                style={{
                  color: 'var(--accent-solana)',
                  fontStyle: 'normal',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                }}
              >
                — Anonymous Solana Degenerate
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

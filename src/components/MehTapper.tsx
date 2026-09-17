'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { playTapSound, playExhaustedSound } from '@/lib/sound';
import { useToast } from './Toast';

interface FloatingItem {
  id: number;
  text: string;
  x: number;
  y: number;
}

export interface PlayerEntry {
  id: string;
  name: string;
  score: number;
  wallet?: string;
  updatedAt?: number;
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
  'Unbothered',
  'Chill vibes',
  'Diamond Hands',
  'Zen Master',
  'Good effort',
  'Stay unbothered',
  'Airdrop loading...',
  'Chill lvl 100',
  'Legendary Tapper',
];

interface MehTapperProps {
  onOpenWallet: () => void;
  connectedWallet?: string | null;
}

export default function MehTapper({ onOpenWallet, connectedWallet }: MehTapperProps) {
  const { showToast } = useToast();
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [username, setUsername] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [squish, setSquish] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingItem[]>([]);
  const [realPlayers, setRealPlayers] = useState<PlayerEntry[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  const coinRef = useRef<HTMLDivElement>(null);
  const lastRankRef = useRef<number>(999);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real players from the backend API
  const fetchLivePlayers = useCallback(async () => {
    try {
      const res = await fetch('/api/tapper');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.players)) {
          setRealPlayers(data.players);
        }
      }
    } catch {
      // Offline / network fallback
    } finally {
      setIsLoadingPlayers(false);
    }
  }, []);

  // Sync current user score to the real backend API
  const syncScoreToServer = useCallback(
    async (currentName: string, currentScore: number, walletAddress?: string | null) => {
      try {
        const res = await fetch('/api/tapper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentName,
            score: currentScore,
            wallet: walletAddress || undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.players)) {
            setRealPlayers(data.players);
          }
        }
      } catch {
        // Fallback gracefully
      }
    },
    []
  );

  // Initialize state from localStorage & clean up any stale mock names
  useEffect(() => {
    // Clear out stale mock names from earlier testing sessions
    const rawSavedName = localStorage.getItem(STORAGE_KEY_USERNAME);
    const isMockName =
      rawSavedName === 'Lazy_TapMaster' ||
      rawSavedName === 'Anon_Sloth' ||
      rawSavedName === 'Solana_Loafer';

    if (isMockName) {
      localStorage.removeItem(STORAGE_KEY_USERNAME);
    }

    const savedName = !isMockName && rawSavedName ? rawSavedName : null;
    const savedScore = parseInt(localStorage.getItem(STORAGE_KEY_SCORE) || '0', 10);
    let savedEnergy = parseInt(localStorage.getItem(STORAGE_KEY_ENERGY) || String(MAX_ENERGY), 10);
    const lastTime = parseInt(localStorage.getItem(STORAGE_KEY_ENERGY_TIME) || String(Date.now()), 10);

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
    }

    // Initial fetch of real players
    fetchLivePlayers();

    // Poll every 10s for new real players joining
    const pollInterval = setInterval(fetchLivePlayers, 10000);
    return () => clearInterval(pollInterval);
  }, [fetchLivePlayers]);

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
    if (s < 20) return 'Rank: Casual Sloth';
    if (s < 50) return 'Rank: Apathetic Acolyte';
    if (s < 100) return 'Rank: Certified Loafer';
    if (s < 200) return 'Rank: Grand Procrastinator';
    return 'Rank: 👑 Supreme Whale of Indifference';
  };

  // Register or update username
  const handleRegisterName = async (chosenName: string) => {
    const trimmed = chosenName.trim();
    if (!trimmed) return;
    const clean = trimmed.slice(0, 20);

    setUsername(clean);
    localStorage.setItem(STORAGE_KEY_USERNAME, clean);
    setShowNameModal(false);

    showToast(`Handle registered: "${clean}". You are now on the live leaderboard!`);
    playTapSound();

    // Immediately sync to server
    await syncScoreToServer(clean, score, connectedWallet);
  };

  const handleUseWalletAsName = () => {
    if (!connectedWallet) return;
    const walletHandle = `${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`;
    handleRegisterName(walletHandle);
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
    // 1. If user has NOT entered their username, collect it before they can tap!
    if (!username) {
      setShowNameModal(true);
      return;
    }

    // 2. Check energy
    if (energy <= 0) {
      spawnFloating(clientX, clientY, 'Energy depleted. Recharging...');
      playExhaustedSound();
      showToast('Energy depleted. Auto-recharging in progress!');
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

    // Debounced sync to server (sends every 1.5s while user taps rapidly)
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      syncScoreToServer(username, nextScore, connectedWallet);
    }, 1500);
  };

  // Build the live leaderboard from real players only!
  const combinedLeaderboard = (() => {
    const list = [...realPlayers];

    // If active user is registered, ensure their live local score is reflected
    if (username) {
      const idx = list.findIndex(
        (p) => p.name.toLowerCase() === username.toLowerCase()
      );
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          score: Math.max(list[idx].score, score),
          wallet: connectedWallet || list[idx].wallet,
        };
      } else {
        list.push({
          id: 'current_user',
          name: username,
          score: score,
          wallet: connectedWallet || undefined,
        });
      }
    }

    return list
      .sort((a, b) => b.score - a.score)
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
        isUser: username ? item.name.toLowerCase() === username.toLowerCase() : false,
      }));
  })();

  const userRankObj = combinedLeaderboard.find((x) => x.isUser);
  const userRank = userRankObj ? userRankObj.rank : null;

  // Track rank improvements and trigger celebratory toast
  useEffect(() => {
    if (!userRank) return;
    if (lastRankRef.current === 999) {
      lastRankRef.current = userRank;
      return;
    }
    if (userRank < lastRankRef.current && score > 0) {
      if (userRank === 1) {
        showToast('👑 YOU ARE NOW RANK #1 ON THE $MEH LEADERBOARD!');
      } else if (userRank <= 3) {
        showToast(`🥉 Top 3 Podium reached! You are now Rank #${userRank}!`);
      } else {
        showToast(`🎉 Rank Up! You climbed to Rank #${userRank}!`);
      }
      lastRankRef.current = userRank;
    }
  }, [userRank, score, showToast]);

  const displayedList = combinedLeaderboard.slice(0, 10);

  const tweetText = username
    ? `I reached Rank #${userRank || 1} on the $MEH Tap-to-Earn leaderboard with ${score.toLocaleString()} taps as @${username}! @mehc0in #MEH #Solana`
    : `I am tapping on the official $MEH memecoin leaderboard! @mehc0in #MEH #Solana`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  return (
    <section className="section-tapper" id="tapper">
      <div className="container">
        <div className="section-head">
          <span className="section-tag">MINI-GAME // REAL TAP-TO-EARN AIRDROP</span>
          <h2 className="section-title">The Meh Tapper</h2>
          <p className="section-subtitle">
            Enter your handle, tap the official $MEH coin, and climb the live community leaderboard for Fair Launch airdrops.
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
              {username ? (
                <div className="player-name-display-row">
                  <span className="player-active-name">{username}</span>
                  <button
                    type="button"
                    className="btn-inline-edit"
                    onClick={() => {
                      setTempName(username);
                      setShowNameModal(true);
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
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    No handle registered yet
                  </span>
                  <button
                    type="button"
                    className="btn-quick-save"
                    onClick={() => {
                      setTempName('');
                      setShowNameModal(true);
                    }}
                  >
                    Enter Username to Play
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
                {!username && (
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
              <strong className="rank-pill-num">{userRank ? `#${userRank}` : '—'}</strong>
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
                {!username ? (
                  <span style={{ color: 'var(--accent-solana)', fontWeight: '700' }}>
                    👆 Click to Enter Username & Start Tapping
                  </span>
                ) : (
                  <span>👆 Click or Tap to Earn</span>
                )}
              </div>
            </div>

            {/* Tap Energy Bar */}
            <div className="energy-bar-wrap">
              <div className="energy-meta">
                <span className="energy-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Tap Energy (Auto-recharges +1 / 2.5s)
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
                onClick={() => {
                  if (!username) {
                    setShowNameModal(true);
                  } else {
                    syncScoreToServer(username, score, connectedWallet);
                    showToast('Score saved to live leaderboard!');
                  }
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>Save Score to Leaderboard</span>
              </button>
            </div>
          </div>

          {/* Dynamic Real Leaderboard Sidebar */}
          <div className="tapper-sidebar">
            <div className="leaderboard-card">
              <div className="leaderboard-header">
                <div>
                  <div className="lb-title-wrap">
                    <span className="live-pulse-dot"></span>
                    <h3 className="leaderboard-title">Active Tap Masters</h3>
                  </div>
                  <p className="leaderboard-subtitle">Real-time Verified Community Ranks</p>
                </div>
                <div className="user-live-rank-badge">
                  <span className="user-rank-badge-title">YOUR RANK</span>
                  <strong className="user-rank-badge-num">{userRank ? `#${userRank}` : '—'}</strong>
                </div>
              </div>

              {/* Dynamic Real Leaderboard List */}
              {isLoadingPlayers ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  Loading real leaderboard...
                </div>
              ) : combinedLeaderboard.length === 0 ? (
                <div className="leaderboard-empty-box">
                  <span className="empty-icon">💤</span>
                  <h4 className="empty-title">No Active Tappers Yet</h4>
                  <p className="empty-desc">
                    Be the first player to start tapping and claim the #1 spot on the live leaderboard!
                  </p>
                </div>
              ) : (
                <ul className="leaderboard-list">
                  {displayedList.map((entry) => {
                    let rankClass = '';
                    if (entry.rank === 1) rankClass = 'gold';
                    else if (entry.rank === 2) rankClass = 'silver';
                    else if (entry.rank === 3) rankClass = 'bronze';

                    return (
                      <li
                        key={entry.id || entry.name}
                        className={`leaderboard-item ${entry.isUser ? 'user-item active-user' : ''}`}
                      >
                        <div className="lb-left">
                          <span className={`lb-rank ${rankClass}`}>#{entry.rank}</span>
                          <div className="lb-name-group">
                            <span className="lb-name">{entry.name}</span>
                            {entry.isUser && (
                              <span className="lb-tag user-tag">
                                YOU
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="lb-score">{entry.score.toLocaleString()} MEH</span>
                      </li>
                    );
                  })}
                </ul>
              )}

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
                  <li><strong>1. Enter Username:</strong> Claim your handle before tapping.</li>
                  <li><strong>2. Real Ranks:</strong> Every tap increases your score and ranks you live.</li>
                  <li><strong>3. Airdrop Rewards:</strong> Link your Solana wallet to qualify for Fair Launch rewards.</li>
                </ul>
              </div>
            </div>

            {/* Community Quote Box */}
            <div className="lazy-quote-box">
              &quot;While everyone else is stressed staring at 1-minute candle charts, we are tapping $MEH in total peace.&quot;
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
                — Unbothered Solana Community Member
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Username Modal */}
      {showNameModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowNameModal(false)}
          style={{ zIndex: 1000 }}
        >
          <div
            className="wallet-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '26px' }}>🎮</span>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '18px', marginBottom: '2px' }}>
                    Enter Your Tap Username
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Start tapping & join the real $MEH Leaderboard
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowNameModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (tempName.trim()) {
                  handleRegisterName(tempName);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Choose Handle / Twitter Username
                </label>
                <input
                  type="text"
                  className="nickname-quick-input"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass-hover)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    outline: 'none',
                  }}
                  placeholder="e.g. @SolanaChad or SlothKing"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  maxLength={20}
                  autoFocus
                />
              </div>

              {connectedWallet && (
                <button
                  type="button"
                  className="btn-autofill-wallet"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '10px',
                    fontSize: '12px',
                  }}
                  onClick={() => {
                    const h = `${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`;
                    setTempName(h);
                  }}
                >
                  Use Connected Wallet ({connectedWallet.slice(0, 4)}...{connectedWallet.slice(-4)})
                </button>
              )}

              <button
                type="submit"
                className="btn-whitelist-submit"
                disabled={!tempName.trim()}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  marginTop: '4px',
                  opacity: tempName.trim() ? 1 : 0.6,
                  cursor: tempName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Start Tapping & Claim Spot
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

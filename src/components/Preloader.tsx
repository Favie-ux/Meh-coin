'use client';

import React, { useState, useEffect } from 'react';

const bootLogs = [
  { text: '> Initializing Solana RPC node... [OK]', pct: 20 },
  { text: '> Querying market enthusiasm... 0% found.', pct: 45 },
  { text: '> De-escalating crypto hype... Whatever.', pct: 70 },
  { text: '> Loading dictionary entry: /mɛ/...', pct: 88 },
  { text: '> Status: Indifference achieved. Ready.', pct: 100 },
];

export default function Preloader() {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing apathy...');
  const [dismissed, setDismissed] = useState(false);
  const [removed, setRemoved] = useState(false);

  const handleDismiss = () => {
    setProgress(100);
    setStatus('100% — Ready (or not)');
    setTimeout(() => {
      setDismissed(true);
      setTimeout(() => setRemoved(true), 600);
    }, 250);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    bootLogs.forEach((item, index) => {
      timer = setTimeout(() => {
        setLogs((prev) => [...prev, item.text]);
        setProgress(item.pct);
        setStatus(`${item.pct}% — Loading...`);

        if (index === bootLogs.length - 1) {
          setTimeout(handleDismiss, 400);
        }
      }, (index + 1) * 260);
    });

    // Safety timeout
    const fallback = setTimeout(handleDismiss, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallback);
    };
  }, []);

  if (removed) return null;

  return (
    <div id="preloader" className={`preloader-overlay ${dismissed ? 'loaded' : ''}`}>
      <div className="preloader-card">
        <div className="preloader-header">
          <span className="preloader-title">SYSTEM_BOOT</span>
          <div className="preloader-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div className="preloader-logo">$MEH.</div>
        <div className="preloader-log">
          {logs.map((line, i) => (
            <span
              key={i}
              className={`log-line ${i === bootLogs.length - 1 ? 'log-highlight' : ''}`}
            >
              {line}
            </span>
          ))}
        </div>
        <div className="preloader-progress-track">
          <div
            className="preloader-progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="preloader-footer">
          <span className="preloader-status">{status}</span>
          <button
            type="button"
            className="preloader-skip-btn"
            onClick={handleDismiss}
          >
            Skip (Too lazy to wait)
          </button>
        </div>
      </div>
    </div>
  );
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface TapperPlayer {
  id: string;
  name: string;
  score: number;
  wallet?: string;
  updatedAt: number;
}

// In-memory cache
let inMemoryPlayers: TapperPlayer[] = [];

function getLocalDataPath(): string {
  return path.join(process.cwd(), 'data', 'tappers.json');
}

function getTmpDataPath(): string {
  return path.join('/tmp', 'meh_tappers.json');
}

function loadPlayers(): TapperPlayer[] {
  // 1. Try local data file first (persistent on disk)
  try {
    const localPath = getLocalDataPath();
    if (fs.existsSync(localPath)) {
      const data = fs.readFileSync(localPath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        inMemoryPlayers = parsed;
        return inMemoryPlayers;
      }
    }
  } catch {
    // Ignore and try fallback
  }

  // 2. Try /tmp backup mirror
  try {
    const tmpPath = getTmpDataPath();
    if (fs.existsSync(tmpPath)) {
      const data = fs.readFileSync(tmpPath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        inMemoryPlayers = parsed;
        return inMemoryPlayers;
      }
    }
  } catch {
    // Memory fallback
  }

  return inMemoryPlayers;
}

function savePlayers(players: TapperPlayer[]) {
  inMemoryPlayers = players;
  const jsonString = JSON.stringify(players, null, 2);

  // Write to local data directory
  try {
    const localPath = getLocalDataPath();
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localPath, jsonString, 'utf-8');
  } catch {
    // Read-only filesystem fallback
  }

  // Mirror to /tmp for serverless container survival
  try {
    const tmpPath = getTmpDataPath();
    fs.writeFileSync(tmpPath, jsonString, 'utf-8');
  } catch {
    // Ignore
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const queryWallet = url.searchParams.get('wallet');
  const queryUsername = url.searchParams.get('username');

  const players = loadPlayers().sort((a, b) => b.score - a.score);

  // If client wants to find their specific profile
  let foundPlayer: TapperPlayer | undefined;
  if (queryWallet) {
    foundPlayer = players.find((p) => p.wallet === queryWallet);
  }
  if (!foundPlayer && queryUsername) {
    foundPlayer = players.find(
      (p) => p.name.toLowerCase() === queryUsername.trim().toLowerCase()
    );
  }

  return NextResponse.json({
    players,
    profile: foundPlayer || null,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, score, wallet } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanName = username.trim().replace(/[^a-zA-Z0-9_@.-]/g, '').slice(0, 20);
    if (!cleanName) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    // Sanitize wallet format if provided
    const safeWallet =
      typeof wallet === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet.trim())
        ? wallet.trim()
        : undefined;

    const players = loadPlayers();

    // Match by wallet address FIRST, or by username
    const existingIndex = players.findIndex((p) => {
      if (safeWallet && p.wallet && p.wallet === safeWallet) return true;
      return p.name.toLowerCase() === cleanName.toLowerCase();
    });

    const safeScore = Math.min(10000000, Math.max(0, parseInt(String(score || 0), 10) || 0));

    if (existingIndex !== -1) {
      // Retain the higher score
      players[existingIndex].score = Math.max(players[existingIndex].score, safeScore);
      // Update name if cleanName provided
      if (cleanName) {
        players[existingIndex].name = cleanName;
      }
      // Link wallet if provided
      if (safeWallet) {
        players[existingIndex].wallet = safeWallet;
      }
      players[existingIndex].updatedAt = Date.now();
    } else {
      // Add new real player
      players.push({
        id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        score: safeScore,
        wallet: safeWallet,
        updatedAt: Date.now(),
      });
    }

    // Sort descending by score
    players.sort((a, b) => b.score - a.score);

    // Save and limit to top 50
    const topPlayers = players.slice(0, 50);
    savePlayers(topPlayers);

    return NextResponse.json({ success: true, players: topPlayers });
  } catch {
    return NextResponse.json({ error: 'Failed to record score' }, { status: 500 });
  }
}

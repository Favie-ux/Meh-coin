import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface TapperPlayer {
  id: string;
  name: string;
  score: number;
  wallet?: string;
  updatedAt: number;
}

// In-memory cache
let inMemoryPlayers: TapperPlayer[] = [];

function getStoragePath(): string {
  // Use /tmp in serverless/Vercel or local data dir in development
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return path.join('/tmp', 'meh_tappers.json');
  }
  return path.join(process.cwd(), 'data', 'tappers.json');
}

function loadPlayers(): TapperPlayer[] {
  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        inMemoryPlayers = parsed;
        return inMemoryPlayers;
      }
    }
  } catch {
    // If file read fails, fall back to in-memory store
  }
  return inMemoryPlayers;
}

function savePlayers(players: TapperPlayer[]) {
  inMemoryPlayers = players;
  try {
    const filePath = getStoragePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(players, null, 2), 'utf-8');
  } catch {
    // File write fallback
  }
}

export async function GET() {
  const players = loadPlayers().sort((a, b) => b.score - a.score);
  return NextResponse.json({ players });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, score, wallet } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanName = username.trim().slice(0, 20);
    if (!cleanName) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    const players = loadPlayers();
    const existingIndex = players.findIndex(
      (p) => p.name.toLowerCase() === cleanName.toLowerCase()
    );

    const safeScore = Math.max(0, parseInt(String(score || 0), 10));

    if (existingIndex !== -1) {
      // Update existing player with highest score and optional wallet
      players[existingIndex].score = Math.max(players[existingIndex].score, safeScore);
      if (wallet) {
        players[existingIndex].wallet = wallet;
      }
      players[existingIndex].updatedAt = Date.now();
    } else {
      // Add new real player
      players.push({
        id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        score: safeScore,
        wallet: wallet || undefined,
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

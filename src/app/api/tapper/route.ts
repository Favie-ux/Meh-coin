import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const queryWallet = url.searchParams.get('wallet') || undefined;
  const queryUsername = url.searchParams.get('username') || undefined;

  const players = db.players.getAll();

  // If client wants to find their specific profile
  let foundProfile = null;
  if (queryWallet || queryUsername) {
    foundProfile = db.players.find({
      wallet: queryWallet,
      username: queryUsername,
    });
  }

  return NextResponse.json({
    players,
    profile: foundProfile,
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

    const safeScore = Math.min(10000000, Math.max(0, parseInt(String(score || 0), 10) || 0));

    // Save in database
    const { all } = db.players.save(cleanName, safeScore, safeWallet);

    // If wallet provided, also record in whitelist
    if (safeWallet) {
      db.whitelist.add(safeWallet);
    }

    return NextResponse.json({ success: true, players: all });
  } catch {
    return NextResponse.json({ error: 'Failed to record score' }, { status: 500 });
  }
}

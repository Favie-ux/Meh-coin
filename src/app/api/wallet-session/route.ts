import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  const session = db.sessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ session });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, wallet, username, score } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Sanitize wallet format if provided
    const safeWallet =
      typeof wallet === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet.trim())
        ? wallet.trim()
        : undefined;

    const safeUsername =
      typeof username === 'string' && username.trim()
        ? username.trim().slice(0, 20)
        : undefined;

    const safeScore =
      typeof score === 'number'
        ? Math.min(10000000, Math.max(0, score))
        : undefined;

    // Update or create session
    const session = db.sessions.update(sessionId, {
      status: safeWallet ? 'connected' : 'pending',
      wallet: safeWallet,
      username: safeUsername,
      score: safeScore,
    });

    // If wallet provided, also persist player in database
    if (safeWallet) {
      db.whitelist.add(safeWallet);

      if (safeUsername) {
        db.players.save(safeUsername, safeScore || 0, safeWallet);
      }
    }

    return NextResponse.json({ success: true, session });
  } catch {
    return NextResponse.json({ error: 'Failed to process session update' }, { status: 500 });
  }
}

import fs from 'fs';
import path from 'path';

export interface WalletSession {
  id: string;
  status: 'pending' | 'connected';
  wallet?: string;
  username?: string;
  score?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  wallet?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WhitelistEntry {
  address: string;
  createdAt: number;
}

export interface DatabaseSchema {
  sessions: Record<string, WalletSession>;
  players: Player[];
  whitelist: WhitelistEntry[];
}

const DEFAULT_DB: DatabaseSchema = {
  sessions: {},
  players: [],
  whitelist: [],
};

// In-memory working cache
let dbCache: DatabaseSchema | null = null;

function getDbPath(): string {
  return path.join(process.cwd(), 'data', 'database.json');
}

function getTmpDbPath(): string {
  return path.join('/tmp', 'meh_database.json');
}

// Load database with fallback and legacy migration
export function getDb(): DatabaseSchema {
  if (dbCache) return dbCache;

  const dbPath = getDbPath();
  const tmpPath = getTmpDbPath();

  // 1. Try primary database file
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        dbCache = {
          sessions: parsed.sessions || {},
          players: Array.isArray(parsed.players) ? parsed.players : [],
          whitelist: Array.isArray(parsed.whitelist) ? parsed.whitelist : [],
        };
        return dbCache;
      }
    }
  } catch {
    // Try tmp fallback
  }

  // 2. Try tmp backup file
  try {
    if (fs.existsSync(tmpPath)) {
      const raw = fs.readFileSync(tmpPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        dbCache = {
          sessions: parsed.sessions || {},
          players: Array.isArray(parsed.players) ? parsed.players : [],
          whitelist: Array.isArray(parsed.whitelist) ? parsed.whitelist : [],
        };
        return dbCache;
      }
    }
  } catch {
    // Try legacy tappers.json
  }

  // 3. Migrate legacy tappers.json if it exists
  try {
    const legacyPath = path.join(process.cwd(), 'data', 'tappers.json');
    if (fs.existsSync(legacyPath)) {
      const legacyRaw = fs.readFileSync(legacyPath, 'utf-8');
      const legacyParsed = JSON.parse(legacyRaw);
      if (Array.isArray(legacyParsed)) {
        dbCache = {
          sessions: {},
          players: legacyParsed,
          whitelist: [],
        };
        saveDb(dbCache);
        return dbCache;
      }
    }
  } catch {
    // Ignore
  }

  // 4. Default fresh database
  dbCache = { ...DEFAULT_DB };
  saveDb(dbCache);
  return dbCache;
}

// Save database atomically
export function saveDb(data: DatabaseSchema) {
  dbCache = data;

  // Clean old sessions (> 2 hours old)
  const now = Date.now();
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;
  for (const [sessId, sess] of Object.entries(data.sessions)) {
    if (sess.updatedAt < twoHoursAgo) {
      delete data.sessions[sessId];
    }
  }

  const jsonString = JSON.stringify(data, null, 2);
  const dbPath = getDbPath();
  const tmpDbPath = getTmpDbPath();

  // Write primary with atomic rename
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFile = `${dbPath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, jsonString, 'utf-8');
    fs.renameSync(tempFile, dbPath);
  } catch {
    // Read-only filesystem fallback (e.g. serverless edge)
  }

  // Mirror to /tmp
  try {
    const tempTmpFile = `${tmpDbPath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempTmpFile, jsonString, 'utf-8');
    fs.renameSync(tempTmpFile, tmpDbPath);
  } catch {
    // Ignore
  }
}

// Database helper operations
export const db = {
  // Session operations (for cross-app Phantom <-> Chrome connection)
  sessions: {
    get(id: string): WalletSession | null {
      const database = getDb();
      return database.sessions[id] || null;
    },
    create(id: string, initialData?: Partial<WalletSession>): WalletSession {
      const database = getDb();
      const now = Date.now();
      const session: WalletSession = {
        id,
        status: initialData?.status || 'pending',
        wallet: initialData?.wallet,
        username: initialData?.username,
        score: initialData?.score,
        createdAt: now,
        updatedAt: now,
      };
      database.sessions[id] = session;
      saveDb(database);
      return session;
    },
    update(id: string, updateData: Partial<WalletSession>): WalletSession {
      const database = getDb();
      const existing = database.sessions[id] || {
        id,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated: WalletSession = {
        ...existing,
        ...updateData,
        updatedAt: Date.now(),
      };
      database.sessions[id] = updated;
      saveDb(database);
      return updated;
    },
  },

  // Player operations (leaderboard, tap points, handles)
  players: {
    getAll(): Player[] {
      const database = getDb();
      return [...database.players].sort((a, b) => b.score - a.score);
    },
    find(query: { wallet?: string; username?: string }): Player | null {
      const database = getDb();
      if (query.wallet) {
        const byWallet = database.players.find((p) => p.wallet === query.wallet);
        if (byWallet) return byWallet;
      }
      if (query.username) {
        const cleanUser = query.username.trim().toLowerCase();
        const byName = database.players.find((p) => p.name.toLowerCase() === cleanUser);
        if (byName) return byName;
      }
      return null;
    },
    save(name: string, score: number, wallet?: string): { player: Player; all: Player[] } {
      const database = getDb();
      const cleanName = name.trim().replace(/[^a-zA-Z0-9_@.-]/g, '').slice(0, 20);
      const safeScore = Math.min(10000000, Math.max(0, score || 0));
      const now = Date.now();

      // Find by wallet first, then by handle
      const existingIndex = database.players.findIndex((p) => {
        if (wallet && p.wallet && p.wallet === wallet) return true;
        return p.name.toLowerCase() === cleanName.toLowerCase();
      });

      let updatedPlayer: Player;

      if (existingIndex !== -1) {
        database.players[existingIndex].score = Math.max(
          database.players[existingIndex].score,
          safeScore
        );
        if (cleanName) database.players[existingIndex].name = cleanName;
        if (wallet) database.players[existingIndex].wallet = wallet;
        database.players[existingIndex].updatedAt = now;
        updatedPlayer = database.players[existingIndex];
      } else {
        updatedPlayer = {
          id: `p_${now}_${Math.random().toString(36).substring(2, 7)}`,
          name: cleanName,
          score: safeScore,
          wallet,
          createdAt: now,
          updatedAt: now,
        };
        database.players.push(updatedPlayer);
      }

      // Sort descending and keep top 50
      database.players.sort((a, b) => b.score - a.score);
      database.players = database.players.slice(0, 50);

      saveDb(database);
      return { player: updatedPlayer, all: database.players };
    },
  },

  // Whitelist operations
  whitelist: {
    add(address: string): WhitelistEntry {
      const database = getDb();
      const existing = database.whitelist.find((w) => w.address === address);
      if (existing) return existing;

      const entry: WhitelistEntry = {
        address,
        createdAt: Date.now(),
      };
      database.whitelist.push(entry);
      saveDb(database);
      return entry;
    },
    getAll(): WhitelistEntry[] {
      const database = getDb();
      return database.whitelist;
    },
  },
};

import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  set,
  runTransaction,
  type Database,
  type Unsubscribe,
} from "firebase/database";
import type { TableState } from "../data/types";
import type { GameAction } from "../engine/actions";
import { newTable, applyAction } from "../engine/game";
import { tableRows } from "../engine/leaderboard";
import type { Sync, SyncHandlers } from "./socket";
import { fbConfig } from "./fbConfig";

// ─────────────────────────────────────────────────────────────────────────
// Firebase Realtime Database sync (transaction-authoritative).
// The shared table state is the single source of truth. EVERY client applies
// its own action atomically via a transaction (read → applyAction → write), so
// the game advances no matter which browser is open or focused — there is no
// "host" whose tab must stay active to process everyone else's moves. All
// clients render from a single onValue subscription. State & leaderboard are
// stored as JSON strings to preserve empty arrays and avoid RTDB quirks.
// No server to run — pairs with a static client on Vercel.
// ─────────────────────────────────────────────────────────────────────────

let app: FirebaseApp | null = null;
let db: Database | null = null;
function database(): Database {
  if (!app) app = initializeApp(fbConfig);
  if (!db) db = getDatabase(app);
  return db;
}

const enc = (o: unknown) => JSON.stringify(o);
const dec = <T,>(s: unknown): T | null => {
  if (typeof s !== "string") return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
};

export class FirebaseSync implements Sync {
  private handlers: SyncHandlers;
  private code = "";
  private unsubs: Unsubscribe[] = [];

  constructor(handlers: SyncHandlers) {
    this.handlers = handlers;
  }

  private stateRef(d: Database) {
    return ref(d, `tables/${this.code}/state`);
  }

  connect(code: string, playerId: string, name: string) {
    this.code = code.toUpperCase();
    const d = database();

    // Atomically create the table if it doesn't exist yet, then join it.
    runTransaction(this.stateRef(d), (cur) => {
      const t = cur == null ? newTable(this.code) : dec<TableState>(cur);
      if (!t) return cur; // unparseable — leave it alone
      if (cur == null) t.hostId = playerId; // first in is the nominal host (UI gating only)
      applyAction(t, { type: "join", playerId, name });
      return enc(t);
    })
      .then((res) => {
        this.handlers.onOpen?.();
        this.handlers.onJoined?.(playerId, this.code);
        this.subscribeState(d);
        this.subscribeLeaderboard(d);
        const state = dec<TableState>(res.snapshot.val());
        if (state) this.writeLeaderboard(d, state);
      })
      .catch((e) => this.handlers.onError?.(`Firebase: ${String(e)}`));
  }

  private subscribeState(d: Database) {
    const u = onValue(this.stateRef(d), (snap) => {
      const state = dec<TableState>(snap.val());
      if (state) this.handlers.onState?.(state);
    });
    this.unsubs.push(u);
  }

  private subscribeLeaderboard(d: Database) {
    const lbRef = ref(d, `leaderboard`);
    const u = onValue(lbRef, (snap) => {
      const val = (snap.val() ?? {}) as Record<string, string>;
      const rows = Object.values(val).flatMap((s) => dec<ReturnType<typeof tableRows>>(s) ?? []);
      rows.sort((a, b) => b.score - a.score);
      this.handlers.onLeaderboard?.(rows);
    });
    this.unsubs.push(u);
  }

  private writeLeaderboard(d: Database, state: TableState) {
    set(ref(d, `leaderboard/${this.code}`), enc(tableRows(state))).catch(() => {});
  }

  dispatch(action: GameAction) {
    const d = database();
    let lastError: string | undefined;
    runTransaction(this.stateRef(d), (cur) => {
      const t = dec<TableState>(cur);
      if (!t) return cur; // no table yet — nothing to act on
      lastError = applyAction(t, action).error;
      return enc(t);
    })
      .then((res) => {
        if (lastError) this.handlers.onError?.(lastError);
        const state = dec<TableState>(res.snapshot.val());
        if (state) this.writeLeaderboard(d, state);
      })
      .catch((e) => this.handlers.onError?.(`Firebase: ${String(e)}`));
  }

  close() {
    for (const u of this.unsubs) u();
    this.unsubs = [];
  }
}

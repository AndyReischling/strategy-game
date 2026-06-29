import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  set,
  push,
  remove,
  runTransaction,
  onChildAdded,
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
// Firebase Realtime Database sync (host-authoritative).
// The first player at a code becomes the host: their browser runs the engine
// and writes the table state. Everyone else reads that state and pushes their
// actions as "intents" that the host applies. State/intents/leaderboard are
// stored as JSON strings to preserve empty arrays & avoid RTDB's quirks.
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
  private isHost = false;
  private state: TableState | null = null;
  private unsubs: Unsubscribe[] = [];

  constructor(handlers: SyncHandlers) {
    this.handlers = handlers;
  }

  connect(code: string, playerId: string, name: string) {
    this.code = code.toUpperCase();
    const d = database();
    const stateRef = ref(d, `tables/${this.code}/state`);

    runTransaction(stateRef, (cur) => {
      if (cur == null) {
        const t = newTable(this.code);
        applyAction(t, { type: "join", playerId, name });
        t.hostId = playerId;
        return enc(t);
      }
      return; // table exists — don't clobber it
    })
      .then((res) => {
        const state = dec<TableState>(res.snapshot.val());
        this.isHost = state?.hostId === playerId;
        this.handlers.onOpen?.();
        this.handlers.onJoined?.(playerId, this.code);
        this.subscribeLeaderboard(d);
        if (this.isHost) {
          this.state = state;
          if (this.state) this.handlers.onState?.(this.state);
          this.startHostLoop(d);
          this.writeLeaderboard();
        } else {
          this.subscribeState(d);
          this.sendIntent({ type: "join", playerId, name });
        }
      })
      .catch((e) => this.handlers.onError?.(`Firebase: ${String(e)}`));
  }

  private subscribeState(d: Database) {
    const stateRef = ref(d, `tables/${this.code}/state`);
    const u = onValue(stateRef, (snap) => {
      const state = dec<TableState>(snap.val());
      if (state) {
        this.state = state;
        // a late host hand-off could make us host; keep rendering regardless
        this.handlers.onState?.(state);
      }
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

  private startHostLoop(d: Database) {
    const intentsRef = ref(d, `tables/${this.code}/intents`);
    const u = onChildAdded(intentsRef, (snap) => {
      const payload = dec<{ action: GameAction }>(snap.val());
      if (payload?.action && this.state) {
        applyAction(this.state, payload.action);
        this.writeState();
      }
      remove(snap.ref).catch(() => {});
    });
    this.unsubs.push(u);
  }

  private writeState() {
    if (!this.state) return;
    const d = database();
    set(ref(d, `tables/${this.code}/state`), enc(this.state)).catch(() => {});
    this.writeLeaderboard();
    this.handlers.onState?.(this.state);
  }

  private writeLeaderboard() {
    if (!this.state) return;
    const d = database();
    set(ref(d, `leaderboard/${this.code}`), enc(tableRows(this.state))).catch(() => {});
  }

  private sendIntent(action: GameAction) {
    const d = database();
    push(ref(d, `tables/${this.code}/intents`), enc({ action })).catch((e) =>
      this.handlers.onError?.(`Firebase: ${String(e)}`),
    );
  }

  dispatch(action: GameAction) {
    if (this.isHost && this.state) {
      applyAction(this.state, action);
      this.writeState();
    } else {
      this.sendIntent(action);
    }
  }

  close() {
    for (const u of this.unsubs) u();
    this.unsubs = [];
    this.state = null;
  }
}

import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import type { TableState } from "../src/data/types";
import type { GameAction } from "../src/engine/actions";
import { newTable, applyAction } from "../src/engine/game";
import { buildLeaderboard } from "../src/engine/leaderboard";

// ─────────────────────────────────────────────────────────────────────────
// SOVEREIGN STACK — authoritative realtime server (§9 Path A).
// Holds every table's state in memory, applies actions, and broadcasts.
// One process serves many parallel tables + one global leaderboard.
// ─────────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 8787);

// One shared event seed for the whole server run, so every table draws the SAME
// shuffled world-event deck (the same card each round) — random per event, but
// synchronized across all tables for a fair cross-table leaderboard.
// Pin it with EVENT_SEED=<number> to reproduce a specific event run.
const EVENT_SEED = Number(process.env.EVENT_SEED ?? Math.floor(Math.random() * 0xffffffff)) >>> 0;

const tables = new Map<string, TableState>();
const rooms = new Map<string, Set<WebSocket>>(); // code -> sockets
const everyone = new Set<WebSocket>();

interface ClientMeta {
  code?: string;
  playerId?: string;
}
const meta = new WeakMap<WebSocket, ClientMeta>();

function getTable(code: string): TableState {
  const key = code.toUpperCase();
  let t = tables.get(key);
  if (!t) {
    t = newTable(key, undefined, EVENT_SEED);
    tables.set(key, t);
  }
  return t;
}

function send(ws: WebSocket, msg: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function broadcastState(code: string) {
  const t = tables.get(code.toUpperCase());
  if (!t) return;
  const set = rooms.get(code.toUpperCase());
  if (set) for (const ws of set) send(ws, { t: "state", table: t });
}

function broadcastLeaderboard() {
  const rows = buildLeaderboard([...tables.values()]);
  for (const ws of everyone) send(ws, { t: "leaderboard", rows });
}

function joinRoom(ws: WebSocket, code: string) {
  const key = code.toUpperCase();
  const m = meta.get(ws);
  if (m?.code && m.code !== key) {
    rooms.get(m.code)?.delete(ws);
  }
  if (!rooms.has(key)) rooms.set(key, new Set());
  rooms.get(key)!.add(ws);
  meta.set(ws, { ...m, code: key });
}

const http = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, tables: tables.size }));
    return;
  }
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("Sovereign Stack server is running.");
});

const wss = new WebSocketServer({ server: http });

wss.on("connection", (ws) => {
  everyone.add(ws);
  meta.set(ws, {});
  // send current leaderboard immediately
  send(ws, { t: "leaderboard", rows: buildLeaderboard([...tables.values()]) });

  ws.on("message", (raw) => {
    let msg: { t: string; [k: string]: unknown };
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.t) {
      case "join": {
        const code = String(msg.code ?? "").toUpperCase();
        const playerId = String(msg.playerId ?? "");
        const name = String(msg.name ?? "Player");
        if (!code || !playerId) {
          send(ws, { t: "error", message: "Missing table code or player id." });
          return;
        }
        const table = getTable(code);
        const { error } = applyAction(table, { type: "join", playerId, name });
        joinRoom(ws, code);
        meta.set(ws, { code, playerId });
        send(ws, { t: "joined", playerId, code });
        if (error) send(ws, { t: "error", message: error });
        broadcastState(code);
        broadcastLeaderboard();
        break;
      }
      case "action": {
        const code = String(msg.code ?? "").toUpperCase();
        const action = msg.action as GameAction;
        if (!code || !action) return;
        const table = getTable(code);
        const { error } = applyAction(table, action);
        if (error) send(ws, { t: "error", message: error });
        broadcastState(code);
        broadcastLeaderboard();
        break;
      }
      case "resync": {
        const code = String(msg.code ?? "").toUpperCase();
        if (code) {
          joinRoom(ws, code);
          broadcastState(code);
        }
        send(ws, { t: "leaderboard", rows: buildLeaderboard([...tables.values()]) });
        break;
      }
      default:
        break;
    }
  });

  ws.on("close", () => {
    everyone.delete(ws);
    const m = meta.get(ws);
    if (m?.code) rooms.get(m.code)?.delete(ws);
  });
});

http.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`▶ Sovereign Stack server listening on :${PORT} (ws + http) · event seed ${EVENT_SEED}`);
});

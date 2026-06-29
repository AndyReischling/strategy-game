import type { TableState, LeaderboardRow } from "../data/types";
import type { GameAction } from "../engine/actions";

export function wsUrl(): string {
  // 1) Explicit override (split deploy: static client on Vercel + server elsewhere)
  const fromEnv = import.meta.env.VITE_WS_URL as string | undefined;
  if (fromEnv) return fromEnv;

  const proto = location.protocol === "https:" ? "wss" : "ws";
  // 2) Dev: Vite serves the client on :5173 while the server runs on :8787
  if (location.port === "5173") return `${proto}://${location.hostname}:8787`;
  // 3) Production single service: the server serves the client AND the WebSocket
  //    on the same origin, so connect right back to it.
  return `${proto}://${location.host}`;
}

type Handlers = {
  onState?: (table: TableState) => void;
  onLeaderboard?: (rows: LeaderboardRow[]) => void;
  onError?: (message: string) => void;
  onJoined?: (playerId: string, code: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

/** Thin reconnecting WebSocket client for the authoritative server. */
export class GameSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Handlers;
  private code = "";
  private playerId = "";
  private name = "";
  private shouldReconnect = true;
  private retry = 0;

  constructor(handlers: Handlers) {
    this.url = wsUrl();
    this.handlers = handlers;
  }

  connect(code: string, playerId: string, name: string) {
    this.code = code.toUpperCase();
    this.playerId = playerId;
    this.name = name;
    this.shouldReconnect = true;
    this.open();
  }

  private open() {
    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws.onopen = () => {
      this.retry = 0;
      this.handlers.onOpen?.();
      this.raw({ t: "join", code: this.code, playerId: this.playerId, name: this.name });
    };
    this.ws.onmessage = (ev) => {
      let msg: { t: string; [k: string]: unknown };
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      switch (msg.t) {
        case "state":
          this.handlers.onState?.(msg.table as TableState);
          break;
        case "leaderboard":
          this.handlers.onLeaderboard?.(msg.rows as LeaderboardRow[]);
          break;
        case "error":
          this.handlers.onError?.(String(msg.message));
          break;
        case "joined":
          this.handlers.onJoined?.(String(msg.playerId), String(msg.code));
          break;
      }
    };
    this.ws.onclose = () => {
      this.handlers.onClose?.();
      if (this.shouldReconnect) this.scheduleReconnect();
    };
    this.ws.onerror = () => this.ws?.close();
  }

  private scheduleReconnect() {
    this.retry = Math.min(this.retry + 1, 6);
    setTimeout(() => this.shouldReconnect && this.open(), 400 * this.retry);
  }

  private raw(msg: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  dispatch(action: GameAction) {
    this.raw({ t: "action", code: this.code, action });
  }

  close() {
    this.shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
  }
}

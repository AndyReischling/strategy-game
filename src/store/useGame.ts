import { create } from "zustand";
import type { TableState, LeaderboardRow, LayerId } from "../data/types";
import type { GameAction } from "../engine/actions";
import { newTable, applyAction } from "../engine/game";
import { buildLeaderboard } from "../engine/leaderboard";
import { GameSocket } from "../net/socket";

type Transport = "none" | "online" | "local";

function genId(): string {
  return (
    "p-" +
    (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36))
  );
}

// Keep identity in the URL so a refresh rejoins as the same player (no localStorage per spec).
function readUrl(): { code?: string; playerId?: string; name?: string } {
  const q = new URLSearchParams(location.search);
  return {
    code: q.get("code") ?? undefined,
    playerId: q.get("p") ?? undefined,
    name: q.get("n") ?? undefined,
  };
}
function writeUrl(code: string, playerId: string, name: string) {
  const q = new URLSearchParams(location.search);
  q.set("code", code);
  q.set("p", playerId);
  if (name) q.set("n", name);
  history.replaceState(null, "", `${location.pathname}?${q.toString()}`);
}

let socket: GameSocket | null = null;
let noticeTimer: ReturnType<typeof setTimeout> | null = null;

interface GameStore {
  transport: Transport;
  connected: boolean;
  table: TableState | null;
  leaderboard: LeaderboardRow[];
  playerId: string;
  code: string;
  name: string;
  error: string | null;
  notice: string | null;

  // UI-only state
  selectedLayer: LayerId | null;
  inspectPlayerId: string | null;
  showGlossary: boolean;
  showLeaderboard: boolean;

  setSelectedLayer: (l: LayerId | null) => void;
  setInspect: (id: string | null) => void;
  toggleGlossary: (v?: boolean) => void;
  toggleLeaderboard: (v?: boolean) => void;
  setNotice: (msg: string | null) => void;

  joinOnline: (code: string, name: string) => void;
  startLocal: (name: string) => void;
  dispatch: (action: GameAction) => void;
  me: () => TableState["players"][number] | undefined;
  leave: () => void;
  tryAutoRejoin: () => void;
}

export const useGame = create<GameStore>((set, get) => ({
  transport: "none",
  connected: false,
  table: null,
  leaderboard: [],
  playerId: "",
  code: "",
  name: "",
  error: null,
  notice: null,

  selectedLayer: null,
  inspectPlayerId: null,
  showGlossary: false,
  showLeaderboard: false,

  setSelectedLayer: (l) => set({ selectedLayer: l }),
  setInspect: (id) => set({ inspectPlayerId: id }),
  toggleGlossary: (v) => set((s) => ({ showGlossary: v ?? !s.showGlossary })),
  toggleLeaderboard: (v) => set((s) => ({ showLeaderboard: v ?? !s.showLeaderboard })),
  setNotice: (msg) => {
    set({ notice: msg });
    if (noticeTimer) clearTimeout(noticeTimer);
    if (msg) noticeTimer = setTimeout(() => set({ notice: null }), 4000);
  },

  joinOnline: (code, name) => {
    const url = readUrl();
    const playerId = url.playerId && url.code?.toUpperCase() === code.toUpperCase() ? url.playerId : genId();
    set({ transport: "online", code: code.toUpperCase(), name, playerId });
    writeUrl(code.toUpperCase(), playerId, name);

    socket?.close();
    socket = new GameSocket({
      onOpen: () => set({ connected: true, error: null }),
      onClose: () => set({ connected: false }),
      onState: (table) => set({ table }),
      onLeaderboard: (rows) => set({ leaderboard: rows }),
      onError: (message) => get().setNotice(message),
      onJoined: (pid) => set({ playerId: pid, inspectPlayerId: pid }),
    });
    socket.connect(code.toUpperCase(), playerId, name);
  },

  startLocal: (name) => {
    const playerId = genId();
    const table = newTable("SOLO");
    applyAction(table, { type: "join", playerId, name: name || "You" });
    set({
      transport: "local",
      connected: true,
      table: structuredClone(table),
      playerId,
      code: "SOLO",
      name,
      inspectPlayerId: playerId,
      leaderboard: buildLeaderboard([table]),
    });
  },

  dispatch: (action) => {
    const { transport, table } = get();
    if (transport === "online") {
      socket?.dispatch(action);
      return;
    }
    if (transport === "local" && table) {
      const next = structuredClone(table);
      const { error } = applyAction(next, action);
      if (error) get().setNotice(error);
      set({ table: next, leaderboard: buildLeaderboard([next]) });
    }
  },

  me: () => {
    const { table, playerId } = get();
    return table?.players.find((p) => p.id === playerId);
  },

  leave: () => {
    socket?.close();
    socket = null;
    set({ transport: "none", connected: false, table: null, leaderboard: [] });
    history.replaceState(null, "", location.pathname);
  },

  tryAutoRejoin: () => {
    const url = readUrl();
    if (url.code && url.playerId) {
      get().joinOnline(url.code, url.name ?? "Player");
    }
  },
}));

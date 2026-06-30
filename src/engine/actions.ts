import type { LayerId, DealKind, DealTerms } from "../data/types";

// Actions are the wire protocol: the client sends these, the server applies
// them authoritatively, and local/practice mode applies them in-browser.
// Same reducer, same result everywhere.

export type GameAction =
  | { type: "join"; playerId: string; name: string }
  | { type: "pickRegion"; playerId: string; regionId: string }
  | { type: "addBots"; count: number }
  | { type: "rename"; playerId: string; name: string }
  | { type: "startGame" }
  | { type: "setPick"; playerId: string; layer: LayerId; optionId: string; qty: number }
  | { type: "clearPick"; playerId: string; layer: LayerId; optionId: string }
  | { type: "pitchVC"; playerId: string; pitch: string } // deterministic VC (no LLM / fallback)
  | { type: "resolvePitch"; playerId: string; pitch: string; funded: boolean; amount: number; reason: string } // LLM verdict + engine guardrails
  | { type: "setEventFlavor"; flavor: Record<string, { name: string; flavor: string; effectText: string }> }
  | { type: "setGeneratedEvent"; round: number; event: { name: string; flavor: string; effectText: string; effects: unknown[] } }
  | {
      type: "proposeDeal";
      playerId: string; // proposer
      toPlayerId: string;
      kind: DealKind;
      terms: DealTerms;
      standing: boolean;
    }
  | { type: "confirmDeal"; playerId: string; dealId: string }
  | { type: "declineDeal"; playerId: string; dealId: string }
  | { type: "counterDeal"; playerId: string; dealId: string; terms: DealTerms }
  | { type: "cancelDeal"; playerId: string; dealId: string }
  | { type: "advancePhase"; playerId?: string }
  | { type: "resetTable" };

export const PHASE_ORDER = [
  "market-open",
  "world-event",
  "build",
  "trade",
  "off-switch",
  "score",
] as const;

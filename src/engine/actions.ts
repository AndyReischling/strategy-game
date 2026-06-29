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
  | { type: "setPick"; playerId: string; layer: LayerId; optionId: string }
  | { type: "clearPick"; playerId: string; layer: LayerId }
  | { type: "pitchVC"; playerId: string; pitch: string } // raise capital by pitching a VC
  | {
      type: "proposeDeal";
      playerId: string; // proposer
      toPlayerId: string;
      kind: DealKind;
      terms: DealTerms;
      standing: boolean;
    }
  | { type: "confirmDeal"; playerId: string; dealId: string }
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

import { useState } from "react";
import { useGame } from "../store/useGame";
import { useReducedMotion } from "../components/useReducedMotion";
import { WorldMap } from "../components/board/WorldMap";
import { BuildPanel } from "../components/panels/BuildPanel";
import { TradePanel } from "../components/panels/TradePanel";
import { ScorePanel } from "../components/panels/ScorePanel";
import { EventCard } from "../components/panels/EventCard";
import { OffSwitchOverlay } from "../components/panels/OffSwitchOverlay";
import { LeaderboardPanel } from "../components/panels/LeaderboardPanel";
import { FinalScreen } from "./FinalScreen";
import { CONFIG } from "../data/config";
import { credits } from "../components/util";
import { Term } from "../components/Term";

const PHASE_LABEL: Record<string, string> = {
  "market-open": "Market opens",
  "world-event": "World event",
  build: "Build / upgrade",
  trade: "Market & trade",
  "off-switch": "Off-switch die",
  score: "Score tick",
};

const PHASE_HINT: Record<string, string> = {
  "market-open": "Prices are posted with this round's modifiers. No income — you already have your budget.",
  "world-event": "One card flips for the whole table. It sets the round's weather.",
  build: "Spend Credits to set or change your five layer picks.",
  trade: "The heart of the game — buy from the market and strike deals with other players.",
  "off-switch": "The adversary's move. Exposed stacks crack; sovereign ones shrug it off.",
  score: "Running scores update and write to the live leaderboard.",
};

type Panel = "build" | "trade" | "score" | null;

export function GameScreen() {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const transport = useGame((s) => s.transport);
  const dispatch = useGame((s) => s.dispatch);
  const toggleGlossary = useGame((s) => s.toggleGlossary);
  const toggleLeaderboard = useGame((s) => s.toggleLeaderboard);
  const showLeaderboard = useGame((s) => s.showLeaderboard);
  const reduced = useReducedMotion();
  const [panel, setPanel] = useState<Panel>(null);

  const me = table.players.find((p) => p.id === playerId);
  const isHost = table.hostId === playerId || transport === "local";

  if (table.phase === "final") return <FinalScreen />;

  const advanceLabel =
    table.phase === "score"
      ? table.round < CONFIG.totalRounds ? `Next round →` : "Final results →"
      : "Next phase →";

  return (
    <div className="game">
      <WorldMap table={table} meId={playerId} reducedMotion={reduced} />

      {/* ── Top HUD ───────────────────────────────────────────── */}
      <header className="hud-top">
        <div className="hud-left card">
          <span className="mono tiny upper muted">{table.code}</span>
          <span className="round-badge display">R{table.round}<span className="muted">/{CONFIG.totalRounds}</span></span>
        </div>
        <div className="hud-phase card">
          <div className="phase-name display">{PHASE_LABEL[table.phase] ?? table.phase}</div>
          <div className="phase-hint tiny">{PHASE_HINT[table.phase]}</div>
        </div>
        <div className="hud-right">
          {me && (
            <div className={`money card c-${me.color}`}>
              <span className="tiny upper muted">Credits</span>
              <span className="money-amt tnum">{credits(me.credits)}</span>
            </div>
          )}
          <button className="btn btn-sm" onClick={() => toggleLeaderboard(true)}>🏆 Leaderboard</button>
          <button className="btn btn-sm" onClick={() => toggleGlossary(true)}>? Glossary</button>
        </div>
      </header>

      {/* ── Phase overlays ────────────────────────────────────── */}
      {table.phase === "world-event" && <EventCard />}
      {table.phase === "off-switch" && <OffSwitchOverlay />}

      {/* ── Bottom dock ───────────────────────────────────────── */}
      <footer className="hud-dock">
        <div className="dock-tabs">
          <button className={`dock-tab ${panel === "build" ? "on" : ""}`} onClick={() => setPanel(panel === "build" ? null : "build")}>
            🛠️ Build {me ? <span className="tiny mono">{Object.keys(me.picks).length}/5</span> : null}
          </button>
          <button className={`dock-tab ${panel === "trade" ? "on" : ""}`} onClick={() => setPanel(panel === "trade" ? null : "trade")}>
            🤝 Deals <span className="tiny mono">{table.deals.filter((d) => d.active && !d.broken).length}</span>
          </button>
          <button className={`dock-tab ${panel === "score" ? "on" : ""}`} onClick={() => setPanel(panel === "score" ? null : "score")}>
            📊 Score {me ? <span className="tiny mono tnum">{me.score.final}</span> : null}
          </button>
        </div>
        <div className="dock-advance">
          {isHost ? (
            <button className="btn btn-go" onClick={() => dispatch({ type: "advancePhase", playerId })}>{advanceLabel}</button>
          ) : (
            <span className="tiny muted">Host advances the phase</span>
          )}
        </div>
      </footer>

      {/* ── Slide-up panels ───────────────────────────────────── */}
      {panel === "build" && <BuildPanel onClose={() => setPanel(null)} />}
      {panel === "trade" && <TradePanel onClose={() => setPanel(null)} />}
      {panel === "score" && <ScorePanel onClose={() => setPanel(null)} />}
      {showLeaderboard && <LeaderboardPanel />}

      {!me && (
        <div className="spectator-note card">
          You're spectating <Term id="adoption">this table</Term>. Open a seat from the lobby to play.
        </div>
      )}
    </div>
  );
}

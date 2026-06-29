import { useState, useEffect } from "react";
import { useGame } from "../store/useGame";
import { PhaseRail } from "../components/dash/PhaseRail";
import { EventLog } from "../components/dash/EventLog";
import { RivalsPanel } from "../components/dash/RivalsPanel";
import { StackColumn } from "../components/dash/StackColumn";
import { OptionChooser } from "../components/dash/OptionChooser";
import { RegionBarometer } from "../components/dash/RegionBarometer";
import { TradePanel } from "../components/panels/TradePanel";
import { ScorePanel } from "../components/panels/ScorePanel";
import { EventCard } from "../components/panels/EventCard";
import { OffSwitchOverlay } from "../components/panels/OffSwitchOverlay";
import { LeaderboardPanel } from "../components/panels/LeaderboardPanel";
import { FinalScreen } from "./FinalScreen";
import { credits } from "../components/util";
import { Hammer, Handshake, ChartBar, Trophy, Question, Coins, X } from "../components/icons";
import type { LayerId } from "../data/types";

type Tab = "build" | "trade" | "score";

export function GameScreen() {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const toggleGlossary = useGame((s) => s.toggleGlossary);
  const toggleLeaderboard = useGame((s) => s.toggleLeaderboard);
  const showLeaderboard = useGame((s) => s.showLeaderboard);
  const leave = useGame((s) => s.leave);
  const [tab, setTab] = useState<Tab>("build");
  const [layer, setLayer] = useState<LayerId>("chips");

  const me = table.players.find((p) => p.id === playerId);

  // jump to the trade tab when the table enters the trade phase
  useEffect(() => {
    if (table.phase === "trade") setTab("trade");
    if (table.phase === "build" || table.phase === "market-open") setTab("build");
    if (table.phase === "score") setTab("score");
  }, [table.phase]);

  if (table.phase === "final") return <FinalScreen />;

  const activeDeals = table.deals.filter((d) => d.active && !d.broken).length;

  return (
    <div className="dash">
      <header className="dash-header">
        <div className="dh-brand display">Sovereign Stack <span className="dh-code mono">{table.code}</span></div>
        <div className="dh-spacer" />
        {me && (
          <div className={`dh-credits c-${me.color}`}>
            <Coins size={18} />
            <span className="tnum">{credits(me.credits)}</span>
          </div>
        )}
        <button className="btn btn-sm" onClick={() => toggleLeaderboard(true)}><Trophy size={15} /> Ranks</button>
        <button className="btn btn-sm" onClick={() => toggleGlossary(true)}><Question size={15} /> Glossary</button>
        <button className="btn btn-sm btn-ghost" onClick={leave}><X size={15} /></button>
      </header>

      <div className="dash-body">
        <aside className="rail rail-left">
          <PhaseRail />
          <EventLog />
        </aside>

        <main className="stage">
          <nav className="stage-tabs">
            <button className={`stab ${tab === "build" ? "on" : ""}`} onClick={() => setTab("build")}>
              <Hammer size={16} /> Build {me ? <span className="stab-n mono">{Object.keys(me.picks).length}/5</span> : null}
            </button>
            <button className={`stab ${tab === "trade" ? "on" : ""}`} onClick={() => setTab("trade")}>
              <Handshake size={16} /> Deals <span className="stab-n mono">{activeDeals}</span>
            </button>
            <button className={`stab ${tab === "score" ? "on" : ""}`} onClick={() => setTab("score")}>
              <ChartBar size={16} /> Score {me ? <span className="stab-n mono tnum">{me.score.final}</span> : null}
            </button>
          </nav>

          <div className="stage-body">
            {tab === "build" && (
              me ? (
                <div className="builder">
                  <div className="builder-stack">
                    <RegionBarometer regionId={me.regionId} />
                    <div className="bs-title tiny upper muted">Your stack</div>
                    <StackColumn player={me} interactive selectedLayer={layer} onSelect={setLayer} />
                  </div>
                  <div className="builder-choose">
                    <OptionChooser layer={layer} />
                  </div>
                </div>
              ) : (
                <p className="muted" style={{ padding: "1rem" }}>You're spectating this table.</p>
              )
            )}
            {tab === "trade" && <TradePanel />}
            {tab === "score" && <ScorePanel />}
          </div>
        </main>

        <aside className="rail rail-right">
          <RivalsPanel />
        </aside>
      </div>

      {table.phase === "world-event" && <EventCard />}
      {table.phase === "off-switch" && <OffSwitchOverlay />}
      {showLeaderboard && <LeaderboardPanel />}
    </div>
  );
}

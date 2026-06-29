import { useGame } from "../../store/useGame";
import { REGION_BY_ID } from "../../data/regions";
import { exposedLayers } from "../../engine/offswitch";
import { StackColumn } from "./StackColumn";
import { credits } from "../util";
import { Coins, Handshake, Warning } from "../icons";

export function RivalsPanel() {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const setInspect = useGame((s) => s.setInspect);

  const players = [...table.players.filter((p) => p.ready)].sort((a, b) => b.score.final - a.score.final);
  const activeDeals = table.deals.filter((d) => d.active && !d.broken);
  const actionPhase = table.phase === "build" || table.phase === "trade";

  return (
    <div className="rivals">
      <div className="rail-title">
        <span className="display">The table</span>
        <span className="tiny muted">live — what everyone's building</span>
      </div>
      {players.map((p, i) => {
        const region = REGION_BY_ID[p.regionId];
        const dealCount = activeDeals.filter((d) => d.fromPlayerId === p.id || d.toPlayerId === p.id).length;
        const expCount = exposedLayers(p).length;
        const isMe = p.id === playerId;
        return (
          <button key={p.id} className={`rival-card c-${p.color} ${isMe ? "me" : ""}`} onClick={() => setInspect(p.id)}>
            <div className="rival-top">
              <span className="rival-rank display">{i + 1}</span>
              <span className="np-dot spot-bg" />
              <span className="rival-name grow">
                {region?.flag} {p.name} {isMe && <span className="you-badge">you</span>}
                <span className="tiny muted rival-region"> · {region?.name}</span>
              </span>
              {actionPhase && (
                <span className={`turn-badge ${p.actionThisRound ? "moved" : "towait"}`}>
                  {p.actionThisRound ? "moved" : "to move"}
                </span>
              )}
              <span className="rival-score tnum display">{p.score.final}</span>
            </div>
            <StackColumn player={p} compact />
            <div className="rival-stats tiny">
              <span className="rs"><Coins size={13} /> {credits(p.credits)}</span>
              <span className="rs"><Handshake size={13} /> {dealCount}</span>
              {expCount > 0 && <span className="rs warn-text"><Warning size={13} /> {expCount} exposed</span>}
              <span className="rs grow" style={{ textAlign: "right" }}>{Object.keys(p.picks).length}/5 built</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

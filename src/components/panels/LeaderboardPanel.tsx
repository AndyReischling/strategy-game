import { useState } from "react";
import { useGame } from "../../store/useGame";
import { Trophy, X } from "../icons";

export function LeaderboardPanel() {
  const leaderboard = useGame((s) => s.leaderboard);
  const table = useGame((s) => s.table);
  const playerId = useGame((s) => s.playerId);
  const toggle = useGame((s) => s.toggleLeaderboard);
  const [scope, setScope] = useState<"global" | "table">("global");

  const rows = scope === "table" && table ? leaderboard.filter((r) => r.table === table.code) : leaderboard;

  return (
    <div className="drawer-backdrop" onClick={() => toggle(false)}>
      <aside className="drawer card lb-drawer" onClick={(e) => e.stopPropagation()} aria-label="Leaderboard">
        <div className="row between" style={{ marginBottom: "0.6rem" }}>
          <h2 style={{ fontSize: "1.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}><Trophy size={22} /> Leaderboard</h2>
          <button className="btn btn-sm" onClick={() => toggle(false)}><X size={14} /> Close</button>
        </div>
        <div className="kind-tabs">
          <button className={`kind-tab ${scope === "global" ? "on" : ""}`} onClick={() => setScope("global")}>All tables</button>
          <button className={`kind-tab ${scope === "table" ? "on" : ""}`} onClick={() => setScope("table")}>This table</button>
        </div>
        <ol className="lb-list">
          {rows.length === 0 && <li className="muted tiny">No scores yet — they appear after the first score tick.</li>}
          {rows.map((r, i) => (
            <li key={r.playerId} className={`lb-row card c-${r.color} ${r.playerId === playerId ? "me" : ""}`}>
              <span className="lb-rank display">{i + 1}</span>
              <span className="np-dot spot-bg" />
              <span className="lb-name grow">{r.flag} {r.name}<span className="tiny muted"> · {r.regionName} · {r.table}</span></span>
              <span className="lb-score tnum display">{r.score}</span>
            </li>
          ))}
        </ol>
        <p className="tiny muted">Live across every table. Best <span className="upper">final</span> across all players wins — the best AI coalition in the world.</p>
      </aside>
    </div>
  );
}

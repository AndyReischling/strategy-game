import { useState } from "react";
import { useGame } from "../../store/useGame";
import { REGION_BY_ID } from "../../data/regions";
import { Term } from "../Term";

export function ScorePanel({ onClose }: { onClose: () => void }) {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const [viewId, setViewId] = useState(playerId);
  const ready = table.players.filter((p) => p.ready);
  const p = ready.find((x) => x.id === viewId) ?? ready[0];
  if (!p) return null;
  const s = p.score;
  const region = REGION_BY_ID[p.regionId];

  return (
    <div className="sheet score-sheet" role="dialog" aria-label="Score breakdown">
      <div className="sheet-head">
        <div>
          <h2>Score breakdown</h2>
          <p className="tiny muted">Why you're winning or losing — the four components.</p>
        </div>
        <button className="btn btn-sm" onClick={onClose}>Close ✕</button>
      </div>

      <div className="score-switch row wrap gap-1">
        {ready.map((pl) => (
          <button key={pl.id} className={`chip-btn c-${pl.color} ${pl.id === p.id ? "on" : ""}`} onClick={() => setViewId(pl.id)}>
            <span className="np-dot spot-bg" />{pl.name}
          </button>
        ))}
      </div>

      <div className="score-final card offset" style={{ ["--spot" as string]: `var(--${p.color})` }}>
        <span className="tiny upper muted">{region?.flag} {region?.name} · final score</span>
        <span className="score-big display tnum">{s.final}</span>
      </div>

      <div className="score-formula tnum">
        <span className="sf"><b className="tnum">{s.rawAdoption}</b><small><Term id="adoption">Adoption</Term></small></span>
        <span className="op">×</span>
        <span className="sf"><b>{s.coherence.toFixed(2)}</b><small><Term id="coherence">Coherence</Term></small></span>
        <span className="op">×</span>
        <span className="sf"><b>{s.sovereignty.toFixed(2)}</b><small><Term id="sovereign">Sovereignty</Term></small></span>
        <span className="op">+</span>
        <span className="sf"><b>{s.deals}</b><small>Deals</small></span>
        {s.fragilityPenalty > 0 && (<><span className="op">−</span><span className="sf neg"><b>{s.fragilityPenalty}</b><small><Term id="fragility-mark">Fragility</Term></small></span></>)}
      </div>

      <ul className="score-notes">
        {s.notes.length === 0 && <li className="muted tiny">Build your stack to see how the pieces interact.</li>}
        {s.notes.map((n, i) => (
          <li key={i} className={n.startsWith("✕") ? "bad" : "good"}>{n}</li>
        ))}
      </ul>

      <p className="tiny muted score-lesson">
        A maxed-capability closed stack posts a huge <Term id="adoption">adoption</Term> number — but the{" "}
        <Term id="sovereign">sovereignty</Term> multiplier and the <Term id="off-switch">off-switch</Term> die crush it.
        A coherent open + sovereign stack backed by good deals wins the long game.
      </p>
    </div>
  );
}

import { useState } from "react";
import { useGame } from "../../store/useGame";
import { REGION_BY_ID } from "../../data/regions";
import { Term } from "../Term";

export function ScorePanel() {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const inspectId = useGame((s) => s.inspectPlayerId);
  const [viewId, setViewId] = useState(inspectId ?? playerId);
  const ready = table.players.filter((p) => p.ready);
  const p = ready.find((x) => x.id === viewId) ?? ready[0];
  if (!p) return null;
  const s = p.score;
  const region = REGION_BY_ID[p.regionId];

  return (
    <div className="stage-panel score-view" aria-label="Score breakdown">
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

      <details className="score-how">
        <summary>How scoring works — and how to build a coherent stack</summary>
        <div className="score-how-body tiny">
          <p><b>Final = Adoption × Coherence × Sovereignty + Deals − Fragility.</b> The two multipliers are the whole game: a giant adoption number gets cut down fast if your stack is incoherent or dependent.</p>
          <ul>
            <li><b><Term id="adoption">Adoption</Term> (users):</b> add up the adoption of all five picks. Empty layers add nothing — fill all five.</li>
            <li><b><Term id="coherence">Coherence</Term> (×0.7–1.3):</b> do your picks fit together? Matching choices earn a bonus; clashing ones a penalty. <i>This is the "coherent stack."</i></li>
            <li><b><Term id="sovereign">Sovereignty</Term> (×0.6–1.25):</b> how much you own vs. rent. Home-built, owned, open pieces push it up; rented or foreign pieces drag it down.</li>
            <li><b>Deals:</b> points for trades that fill a real gap — granting an unlock (access) is worth the most.</li>
            <li><b><Term id="fragility-mark">Fragility</Term>:</b> permanent dents when the off-switch cracks a rented/foreign layer.</li>
          </ul>
          <p><b>Building a coherent stack:</b> pick options whose tags reinforce each other. Good fits: open weights + fine-tuning, on-device + lean compute, sovereign compute + owned weights + sovereign hosting (nothing to switch off). Clashes to avoid: a sovereign storefront on a foreign cloud, open-sourcing a model you only rent, or frontier training on tiny compute.</p>
        </div>
      </details>

      <p className="tiny muted score-lesson">
        A maxed-capability closed stack posts a huge <Term id="adoption">adoption</Term> number — but the{" "}
        <Term id="sovereign">sovereignty</Term> multiplier and the <Term id="off-switch">off-switch</Term> die crush it.
        A coherent open + sovereign stack backed by good deals wins the long game.
      </p>
    </div>
  );
}

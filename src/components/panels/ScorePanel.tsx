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
        <span className="sf" title="How complete your stack is — every empty layer caps your whole reach"><b>{s.reach.toFixed(2)}</b><small>Reach</small></span>
        <span className="op">×</span>
        <span className="sf" title="Supply chain — your thinnest layer's units throttle the rest"><b>{s.balance.toFixed(2)}</b><small>Balance</small></span>
        <span className="op">×</span>
        <span className="sf"><b>{s.coherence.toFixed(2)}</b><small><Term id="coherence">Coherence</Term></small></span>
        <span className="op">×</span>
        <span className="sf"><b>{s.sovereignty.toFixed(2)}</b><small><Term id="sovereign">Sovereignty</Term></small></span>
        <span className="op">+</span>
        <span className="sf"><b>{s.deals}</b><small>Deals</small></span>
        {s.capital > 0 && (<><span className="op">+</span><span className="sf" title="Points for capital kept on hand"><b>{s.capital}</b><small>Capital</small></span></>)}
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
          <p><b>Final = Adoption × Reach × Balance × Coherence × Sovereignty + Deals + Capital − Fragility.</b> The multipliers are the whole game: a giant adoption number gets cut down fast if your stack is incomplete, lopsided, incoherent, or dependent.</p>
          <ul>
            <li><b><Term id="adoption">Adoption</Term> (users):</b> add up each pick's adoption × how many <b>units</b> you bought of it. Buying more units scales adoption (and cost).</li>
            <li><b>Reach (×0.15–1.0) — the interdependence gate:</b> your stack only reaches users as well as it's <i>complete</i>. Each built layer adds reach; <b>every empty layer caps your whole stack</b>. A brilliant model with no hosting reaches almost no one.</li>
            <li><b>Balance (×0.5–1.0) — the supply chain:</b> each layer's capacity is its total units. Output is throttled by your <b>thinnest layer</b> — buy 5 units of chips with 1 of hosting and the chips are wasted. To scale up, grow the whole chain together.</li>
            <li><b><Term id="coherence">Coherence</Term> (×0.55–1.5):</b> do your picks fit together? Matching choices earn a bonus; clashing ones a penalty. <i>The "coherent stack."</i></li>
            <li><b><Term id="sovereign">Sovereignty</Term> (×0.45–1.5):</b> how much you own vs. rent. Home-built, owned, open pieces push it up; rented or foreign pieces drag it down — and invite the off-switch.</li>
            <li><b>Deals:</b> points for trades that fill a real gap — granting an unlock (access) is worth the most. You're structurally short in some layers; the deal table is how you complete the chain.</li>
            <li><b>Capital:</b> points for credits kept on hand. A war chest is real value — dry powder for deals and resilience — so don't blow every dollar.</li>
            <li><b><Term id="fragility-mark">Fragility</Term>:</b> permanent dents when the off-switch cracks a rented/foreign layer.</li>
          </ul>
          <p><b>How the pieces interlock:</b> Reach rewards <i>finishing</i> the chain, Coherence rewards picks that <i>fit</i>, and Sovereignty rewards <i>owning</i> it. The non-obvious winning line: a complete, coherent, mostly-owned stack — usually impossible alone, so you fill your gaps at the deal table. Good fits: open weights + fine-tuning, on-device + lean compute, sovereign compute + owned weights + sovereign hosting. Clashes to avoid: a sovereign storefront on a foreign cloud, open-sourcing a model you only rent, or frontier training on tiny compute.</p>
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

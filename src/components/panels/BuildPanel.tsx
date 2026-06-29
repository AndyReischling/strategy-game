import { useState } from "react";
import { useGame } from "../../store/useGame";
import { LAYERS } from "../../data/layers";
import { REGION_BY_ID } from "../../data/regions";
import { EVENT_BY_ID } from "../../data/events";
import { priceFor } from "../../engine/pricing";
import { canBuild } from "../../engine/preconditions";
import { Term } from "../Term";
import { credits } from "../util";
import type { LayerId, LayerOption } from "../../data/types";

function Pips({ value, kind }: { value: number; kind: "adopt" | "sov" }) {
  const n = Math.abs(value);
  const neg = value < 0;
  return (
    <span className={`pips ${kind} ${neg ? "neg" : ""}`} title={`${kind === "adopt" ? "Adoption" : "Sovereignty"} ${value > 0 ? "+" : ""}${value}`}>
      {Array.from({ length: Math.max(1, n) }).map((_, i) => (
        <span key={i} className="pip" />
      ))}
    </span>
  );
}

export function BuildPanel({ onClose }: { onClose: () => void }) {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const dispatch = useGame((s) => s.dispatch);
  const me = table.players.find((p) => p.id === playerId);
  const [layer, setLayer] = useState<LayerId>("chips");

  if (!me) return null;
  const region = REGION_BY_ID[me.regionId];
  const event = table.eventId ? EVENT_BY_ID[table.eventId] : undefined;
  const activeLayer = LAYERS.find((l) => l.id === layer)!;

  const buy = (opt: LayerOption) => dispatch({ type: "setPick", playerId, layer: opt.layer, optionId: opt.id });

  return (
    <div className="sheet" role="dialog" aria-label="Build your stack">
      <div className="sheet-head">
        <div>
          <h2>Build your stack</h2>
          <p className="tiny muted">{region?.flag} {region?.name} · one pick per layer, built up over the rounds.</p>
        </div>
        <button className="btn btn-sm" onClick={onClose}>Close ✕</button>
      </div>

      <div className="layer-tabs">
        {LAYERS.map((l) => {
          const picked = me.picks[l.id];
          return (
            <button key={l.id} className={`layer-tab ${layer === l.id ? "on" : ""} ${picked ? "done" : ""}`} onClick={() => setLayer(l.id)}>
              <span className="lt-idx mono">{l.index}</span>
              <span className="lt-ico" aria-hidden>{l.icon}</span>
              <span className="lt-name">{l.name}</span>
              {picked ? <span className="lt-check">✓</span> : <span className="lt-empty tiny muted">empty</span>}
            </button>
          );
        })}
      </div>

      <div className="layer-intro">
        <span className="display">Step {activeLayer.index}: <Term id={activeLayer.id}>{activeLayer.name}</Term></span>
        <p className="tiny">{activeLayer.question}</p>
      </div>

      <div className="opt-list">
        {activeLayer.options.map((opt) => {
          const price = priceFor(opt, region, event);
          const check = canBuild(me, opt);
          const isPicked = me.picks[opt.layer] === opt.id;
          const refund = me.paid[opt.layer] ?? 0;
          const penalty = me.lockedLayers.includes(opt.layer) && me.picks[opt.layer] !== opt.id ? 1 : 0;
          const net = price.cost + penalty - refund;
          const affordable = me.credits + refund >= price.cost + penalty;
          const blocked = !check.ok || price.frozen;
          return (
            <div key={opt.id} className={`opt ${isPicked ? "picked" : ""} ${blocked ? "blocked" : ""}`}>
              <div className="opt-main">
                <div className="opt-title-row">
                  <span className="opt-name">{opt.name}</span>
                  {opt.actor && <span className="opt-actor tiny mono">{opt.actor}</span>}
                </div>
                <p className="opt-explainer">
                  <em>{opt.explainer}</em>
                </p>
                <div className="opt-catch tiny"><b>Catch:</b> {opt.catch}</div>
                <div className="opt-meta row wrap gap-1">
                  <Pips value={opt.adoption} kind="adopt" />
                  <Pips value={opt.sovereignty} kind="sov" />
                  {opt.exposure !== "none" && <span className="tag warn"><Term id="exposure">exposed</Term></span>}
                  {opt.sanctionRisk && <span className="tag warn"><Term id="sanction-risk">sanction</Term></span>}
                  {opt.recurring ? <span className="tag">recurring §{opt.recurring}/rd</span> : null}
                  {opt.terms?.slice(0, 1).map((t) => <span key={t} className="tag"><Term id={t} /></span>)}
                </div>
                {price.badges.length > 0 && (
                  <div className="opt-badges tiny">{price.badges.map((b, i) => <span key={i} className="badge">{b}</span>)}</div>
                )}
                {!check.ok && <div className="opt-need tiny warn-text">Requires {check.needs}{check.dealable ? " — strike a deal." : "."}</div>}
                {price.frozen && <div className="opt-need tiny warn-text">Frozen this round by the world event.</div>}
              </div>
              <div className="opt-buy">
                <div className="opt-price tnum">
                  {price.cost !== opt.baseCost && <span className="base-strike">§{opt.baseCost}</span>}
                  <span className="now">{credits(price.cost)}</span>
                  {price.splitNote && <span className="tiny muted">split</span>}
                </div>
                {isPicked ? (
                  <button className="btn btn-sm btn-danger" onClick={() => dispatch({ type: "clearPick", playerId, layer: opt.layer })}>Remove</button>
                ) : (
                  <button className="btn btn-sm btn-go" disabled={blocked || !affordable} onClick={() => buy(opt)}>
                    {affordable ? (net > 0 ? `Build ${credits(net)}` : "Build") : "Can't afford"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

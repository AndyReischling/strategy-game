import { useState } from "react";
import { useGame } from "../../store/useGame";
import { LAYER_BY_ID } from "../../data/layers";
import { REGION_BY_ID } from "../../data/regions";
import { currentEvent } from "../../engine/game";
import { priceFor } from "../../engine/pricing";
import { canBuild, playerCanGrant } from "../../engine/preconditions";
import { Term } from "../Term";
import { GLOSSARY_BY_ID } from "../../data/glossary";
import { credits } from "../util";
import { LAYER_ICON, Warning, Prohibit, ArrowsClockwise, Check, X, ArrowRight } from "../icons";
import { StrengthMeter } from "./StrengthMeter";
import type { LayerId, LayerOption, StrengthDim } from "../../data/types";

// Which barometer strength each layer leans on, and what to do if you're short.
const LAYER_STRENGTH: Record<LayerId, StrengthDim> = {
  chips: "chips", compute: "compute", model: "talent", weights: "weights", hosting: "market",
};
const SHORT_HINT: Record<LayerId, string> = {
  chips: "You're short on chips — buy from a partner or trade for spare units; building sovereign chips only pays off late.",
  compute: "You're short on compute — rent or lease capacity, or deal for cluster access, rather than building a big domestic cluster.",
  model: "You're short on talent — adapting an open model (fine-tune or localize) is far cheaper than training your own, or buy a model from a talent-rich partner like Canada.",
  weights: "You're short here — pick an open base you own and keep (below), or have a partner grant you one.",
  hosting: "You're short on market reach — deal for a market channel (Germany / India) to get your AI in front of users.",
};

export function OptionChooser({ layer }: { layer: LayerId }) {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const dispatch = useGame((s) => s.dispatch);
  const setDealDraft = useGame((s) => s.setDealDraft);
  const [qtySel, setQtySel] = useState<Record<string, number>>({});
  const me = table.players.find((p) => p.id === playerId);
  if (!me) return null;

  const others = table.players.filter((p) => p.ready && p.id !== me.id);

  const region = REGION_BY_ID[me.regionId];
  const event = currentEvent(table);
  const layerDef = LAYER_BY_ID[layer];
  const LIcon = LAYER_ICON[layer];

  // one action per round: locked unless you're refining the same layer you built this round
  const moveLocked = !!me.actionThisRound; // one build per round — once you've built (or pitched), no more this round
  const actedMsg =
    me.actionThisRound === "build"
      ? <>you built <b>{me.movedLayer ? LAYER_BY_ID[me.movedLayer].name : ""}</b></>
      : me.pitch && !me.pitch.funded
        ? <>your pitch to General Catalyst was declined — turn burned</>
        : <>you raised capital</>;

  const buy = (opt: LayerOption, qty: number) => dispatch({ type: "setPick", playerId, layer: opt.layer, optionId: opt.id, qty });

  return (
    <div className="chooser">
      <div className="chooser-head">
        <span className="ch-step"><LIcon size={22} /></span>
        <div>
          <div className="ch-title display">Layer {layerDef.index} of 5: <Term id={layer}>{layerDef.name}</Term></div>
          <div className="tiny">{layerDef.question} <span className="muted">· build the layers in any order you like</span></div>
        </div>
      </div>

      {region && region.strengths[LAYER_STRENGTH[layer]] <= -1 && (
        <div className="chooser-hint">
          <Warning size={15} /> <span>{SHORT_HINT[layer]}</span>
        </div>
      )}

      {moveLocked && (
        <div className="move-lock">
          <b>That's your one action this round — {actedMsg}.</b> You can still <i>accept</i> offers others send you on the <b>Deals</b> tab. End the round to act again next turn.
        </div>
      )}

      <div className="opt-grid">
        {layerDef.options.map((opt) => {
          const price = priceFor(opt, region, event);
          const check = canBuild(me, opt);
          const owned = me.qty[opt.layer]?.[opt.id] ?? 0;
          const isPicked = owned > 0;
          const undoable = me.movedOption === opt.id; // only this round's purchase can be undone
          const q = opt.countable ? Math.max(1, qtySel[opt.id] ?? 1) : 1;
          const buyCost = price.cost * q;
          const affordable = me.credits >= buyCost;
          const blocked = !check.ok || price.frozen;
          return (
            <div key={opt.id} className={`opt-card ${isPicked ? "picked" : ""} ${blocked ? "blocked" : ""}`}>
              <div className="oc-top">
                <span className="oc-name">{opt.name}</span>
                <span className="oc-price tnum">
                  {price.cost !== opt.baseCost
                    ? <Term id="list-price"><span className="base-strike">{credits(opt.baseCost)}</span><span className="now">{credits(price.cost)}</span></Term>
                    : <span className="now">{credits(price.cost)}</span>}
                </span>
              </div>
              {opt.actor && <div className="oc-actor tiny mono">{opt.actor}</div>}
              <p className="oc-explainer"><em>{opt.explainer}</em></p>
              <div className="oc-catch tiny"><b>Catch:</b> {opt.catch}</div>

              <div className="oc-meta">
                <StrengthMeter value={opt.adoption} kind="adopt" />
                <StrengthMeter value={opt.sovereignty} kind="sov" />
                {opt.exposure !== "none" && <Term id="exposure"><span className="chip-tag warn"><Warning size={12} /> exposed</span></Term>}
                {opt.sanctionRisk && <Term id="sanction-risk"><span className="chip-tag warn"><Prohibit size={12} /> sanction</span></Term>}
                {opt.recurring ? <Term id="recurring-cost"><span className="chip-tag"><ArrowsClockwise size={12} /> {credits(opt.recurring)}/rd</span></Term> : null}
                {opt.terms?.slice(0, 1).map((t) => <Term key={t} id={t}><span className="chip-tag">{GLOSSARY_BY_ID[t]?.term ?? t}</span></Term>)}
              </div>

              {price.badges.length > 0 && (
                <div className="oc-badges">{price.badges.map((b, i) => (
                  <span key={i} className={`badge badge-${b.tone}`}><Term id="price-shift">{b.text}</Term></span>
                ))}</div>
              )}
              {!check.ok && (
                <div className="oc-need tiny">
                  <div className="warn-text"><b>Locked</b> — needs {check.needs}.</div>
                  {check.dealable && (() => {
                    const req = opt.requires;
                    // Co-funded builds: any player can commit as a partner, and the
                    // cost is split — invite someone to cover part of it.
                    if (req === "co-funder-1" || req === "co-funders-2") {
                      const share = Math.max(1, Math.round(price.cost / 2));
                      const partner = others[0];
                      const inviteCoFund = () =>
                        setDealDraft({ toId: partner?.id, kind: "access", precond: req, theyPay: share });
                      return (
                        <div className="oc-fix oc-cofund">
                          <span className="oc-fix-text">
                            {others.length > 0
                              ? <><b>Co-funded build.</b> Split the {credits(price.cost)} cost — invite a partner to co-fund and they cover {credits(share)}. Once the deal is live, this unlocks.</>
                              : <><b>Co-funded build.</b> Needs a partner to co-fund — no one else is at the table yet.</>}
                          </span>
                          {partner && (
                            <button type="button" className="btn btn-sm btn-go oc-fix-btn" onClick={inviteCoFund}>
                              Invite a partner to co-fund <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      );
                    }
                    const granters = others.filter((p) => playerCanGrant(p, req));
                    const isAsmlAsset = req === "asml-token";
                    const partner = granters[0]; // only someone who can actually grant it
                    const fix = () => {
                      if (isAsmlAsset) setDealDraft({ toId: partner?.id, kind: "asset", assetId: "asml-token" });
                      else setDealDraft({ toId: partner?.id, kind: "access", precond: req });
                    };
                    return (
                      <div className="oc-fix">
                        <span className="oc-fix-text">
                          {granters.length > 0
                            ? <><b>How to unlock:</b> {granters.map((g) => `${REGION_BY_ID[g.regionId]?.flag ?? ""} ${g.name}`).join(", ")} can grant this — propose {isAsmlAsset ? "an asset deal for the ASML token" : "an access deal"}.</>
                            : <><b>How to unlock:</b> propose {isAsmlAsset ? "an asset deal for the ASML token" : "an access deal"} — no one can grant it yet, so you may need to negotiate or wait for a region that can.</>}
                        </span>
                        {partner && (
                          <button type="button" className="btn btn-sm btn-go oc-fix-btn" onClick={fix}>
                            Set up this deal <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              {price.frozen && <div className="oc-need tiny warn-text">Frozen this round by the world event.</div>}

              <div className="oc-action">
                {owned > 0 && opt.countable && <span className="oc-owned tiny mono" title="Units built">×{owned}</span>}
                {undoable ? (
                  <button className="btn btn-sm btn-danger" onClick={() => dispatch({ type: "clearPick", playerId, layer: opt.layer, optionId: opt.id })}><X size={14} /> Undo</button>
                ) : owned > 0 && !opt.countable ? (
                  <button className="btn btn-sm btn-ghost" disabled><Check size={14} /> Built</button>
                ) : (
                  <>
                    {opt.countable && !moveLocked && !blocked && (
                      <span className="qty-step" role="group" aria-label="Quantity">
                        <button type="button" className="qty-btn" disabled={q <= 1} onClick={() => setQtySel((s) => ({ ...s, [opt.id]: Math.max(1, q - 1) }))}>−</button>
                        <span className="qty-n tnum">{q}</span>
                        <button type="button" className="qty-btn" onClick={() => setQtySel((s) => ({ ...s, [opt.id]: q + 1 }))}>+</button>
                      </span>
                    )}
                    <button className="btn btn-sm btn-go" disabled={blocked || !affordable || moveLocked} onClick={() => buy(opt, q)}>
                      {moveLocked ? "Build used" : !affordable ? "Can't afford"
                        : opt.countable ? (<><Check size={14} /> {owned > 0 ? "Add" : "Build"} ×{q} · {credits(buyCost)}</>)
                        : (<><Check size={14} /> Build · {credits(price.cost)}</>)}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

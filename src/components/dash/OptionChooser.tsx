import { useGame } from "../../store/useGame";
import { LAYER_BY_ID } from "../../data/layers";
import { REGION_BY_ID } from "../../data/regions";
import { EVENT_BY_ID } from "../../data/events";
import { priceFor } from "../../engine/pricing";
import { canBuild, playerCanGrant } from "../../engine/preconditions";
import { Term } from "../Term";
import { GLOSSARY_BY_ID } from "../../data/glossary";
import { credits } from "../util";
import { LAYER_ICON, Warning, Prohibit, ArrowsClockwise, TrendUp, ShieldCheck, Check, X, ArrowRight } from "../icons";
import type { LayerId, LayerOption } from "../../data/types";

function Meter({ value, kind }: { value: number; kind: "adopt" | "sov" }) {
  const neg = value < 0;
  const Icon = kind === "adopt" ? TrendUp : ShieldCheck;
  const label = kind === "adopt" ? "adoption" : "sovereignty";
  return (
    <Term id={kind === "adopt" ? "adoption" : "sovereignty"}>
      <span className={`meter ${kind} ${neg ? "neg" : ""}`}>
        <Icon size={13} />
        <b>{value > 0 ? `+${value}` : value}</b>
        <span className="meter-label">{label}</span>
      </span>
    </Term>
  );
}

export function OptionChooser({ layer }: { layer: LayerId }) {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const dispatch = useGame((s) => s.dispatch);
  const setDealDraft = useGame((s) => s.setDealDraft);
  const me = table.players.find((p) => p.id === playerId);
  if (!me) return null;

  const others = table.players.filter((p) => p.ready && p.id !== me.id);

  const region = REGION_BY_ID[me.regionId];
  const event = table.eventId ? EVENT_BY_ID[table.eventId] : undefined;
  const layerDef = LAYER_BY_ID[layer];
  const LIcon = LAYER_ICON[layer];

  // one action per round: locked unless you're refining the same layer you built this round
  const moveLocked = !!me.actionThisRound && !(me.actionThisRound === "build" && me.movedLayer === layer);
  const actedMsg =
    me.actionThisRound === "build"
      ? <>you built <b>{me.movedLayer ? LAYER_BY_ID[me.movedLayer].name : ""}</b></>
      : me.pitch && !me.pitch.funded
        ? <>your pitch to General Catalyst was declined — turn burned</>
        : <>you raised capital</>;

  const buy = (opt: LayerOption) => dispatch({ type: "setPick", playerId, layer: opt.layer, optionId: opt.id });

  return (
    <div className="chooser">
      <div className="chooser-head">
        <span className="ch-step"><LIcon size={22} /></span>
        <div>
          <div className="ch-title display">Layer {layerDef.index} of 5: <Term id={layer}>{layerDef.name}</Term></div>
          <div className="tiny">{layerDef.question} <span className="muted">· build the layers in any order you like</span></div>
        </div>
      </div>

      {moveLocked && (
        <div className="move-lock">
          <b>That's your one action this round — {actedMsg}.</b> You can still <i>accept</i> offers others send you on the <b>Deals</b> tab. End the round to act again next turn.
        </div>
      )}

      <div className="opt-grid">
        {layerDef.options.map((opt) => {
          const price = priceFor(opt, region, event);
          const check = canBuild(me, opt);
          const isPicked = me.picks[opt.layer] === opt.id;
          const refund = me.paid[opt.layer] ?? 0;
          const penalty = me.lockedLayers.includes(opt.layer) && me.picks[opt.layer] !== opt.id ? 1 : 0;
          const net = price.cost + penalty - refund;
          const affordable = me.credits + refund >= price.cost + penalty;
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
                <Meter value={opt.adoption} kind="adopt" />
                <Meter value={opt.sovereignty} kind="sov" />
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
                {isPicked ? (
                  <button className="btn btn-sm btn-danger" disabled={moveLocked} onClick={() => dispatch({ type: "clearPick", playerId, layer: opt.layer })}><X size={14} /> Remove</button>
                ) : (
                  <button className="btn btn-sm btn-go" disabled={blocked || !affordable || moveLocked} onClick={() => buy(opt)}>
                    {moveLocked ? "Move used" : affordable ? (<><Check size={14} /> Build {net > 0 ? credits(net) : ""}</>) : "Can't afford"}
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

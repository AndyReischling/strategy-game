import { useState, useEffect } from "react";
import { useGame } from "../../store/useGame";
import { REGION_BY_ID } from "../../data/regions";
import { OPTION_BY_ID } from "../../data/layers";
import { Term } from "../Term";
import { credits } from "../util";
import { Bank, Check, X, Handshake } from "../icons";
import { judgePitch, stackSummary, llmEnabled } from "../../net/llm";
import { ASSET_LABEL, PRECOND_LABEL, summarizeDeal } from "../dealText";
import type { DealKind, Precondition, AssetId, Deal } from "../../data/types";

// Inputs are denominated in billions of USD. Format with thousands separators
// and parse anything the user types (commas, "$", "b") back to a plain number.
const fmtB = (n: number): string => (n > 0 ? n.toLocaleString("en-US") : "");
const parseB = (s: string): number => {
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
};
const inWords = (billions: number): string => {
  if (billions <= 0) return "$0";
  if (billions >= 1000) {
    const t = Math.round((billions / 1000) * 10) / 10;
    return `$${t.toLocaleString("en-US")} trillion`;
  }
  return `$${billions.toLocaleString("en-US")} billion`;
};

// Plain-language descriptions for each deal type, shown on the tabs themselves
// so players don't have to decode the jargon from a legend.
const KINDS: { id: DealKind; label: string; hint: string; term: string; desc: string }[] = [
  { id: "swap", label: "Cash", hint: "pay or get paid", term: "deal-swap", desc: "A one-time cash payment between you and another player — no strings attached." },
  { id: "asset", label: "Asset", hint: "hand over a holding", term: "deal-asset", desc: "Sell or lease a holding you own — like the ASML token, renewable sites, or a market channel." },
  { id: "supply", label: "Supply", hint: "trade built units", term: "deal-asset", desc: "Buy or sell units of a built layer — e.g. 2 of someone's spare NVIDIA chips. Cash and units flow opposite: the buyer pays, the owner hands over units." },
  { id: "access", label: "Access", hint: "open a door", term: "deal-access", desc: "Grant a partner an unlock so they can build a layer they're currently blocked on." },
  { id: "standing", label: "Standing", hint: "repeats each round", term: "standing-deal", desc: "An ongoing deal that auto-repeats every round until someone cancels it — or it breaks under pressure." },
];

export function TradePanel() {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const dispatch = useGame((s) => s.dispatch);
  const me = table.players.find((p) => p.id === playerId);
  const others = table.players.filter((p) => p.ready && p.id !== playerId);

  const [toId, setToId] = useState(others[0]?.id ?? "");
  const [kind, setKind] = useState<DealKind>("swap");
  const [iPay, setIPay] = useState(0);
  const [theyPay, setTheyPay] = useState(0);
  const [assetId, setAssetId] = useState<AssetId | "">("");
  const [supplySel, setSupplySel] = useState(""); // "me:optId" | "them:optId"
  const [supplyUnits, setSupplyUnits] = useState(1);
  const [lease, setLease] = useState(false);
  const [precond, setPrecond] = useState<Precondition>("deal-compute");
  const [standing, setStanding] = useState(false);
  const [investorCut, setInvestorCut] = useState(0);
  const [pitch, setPitch] = useState("");
  const [pitching, setPitching] = useState(false);

  // a blocked build can hand us a pre-filled deal (partner + access/asset + target)
  const dealDraft = useGame((s) => s.dealDraft);
  const setDealDraft = useGame((s) => s.setDealDraft);
  useEffect(() => {
    if (!dealDraft) return;
    if (dealDraft.toId) setToId(dealDraft.toId);
    setKind(dealDraft.kind);
    if (dealDraft.precond) setPrecond(dealDraft.precond);
    if (dealDraft.assetId) setAssetId(dealDraft.assetId);
    if (dealDraft.iPay != null) setIPay(dealDraft.iPay);
    if (dealDraft.theyPay != null) setTheyPay(dealDraft.theyPay);
    setDealDraft(null); // consume once
  }, [dealDraft, setDealDraft]);

  if (!me) return null;
  const to = table.players.find((p) => p.id === toId);

  const myAssets = me.assets;
  const theirAssets = to?.assets ?? [];
  const tradableAssets = kind === "asset" ? [...myAssets, ...theirAssets] : [];

  // built-option units each side holds, for the Supply deal
  const builtUnits = (pl: typeof to) =>
    pl ? Object.values(pl.qty).flatMap((m) => Object.entries(m ?? {})).map(([oid, n]) => ({ optionId: oid, units: n })) : [];
  const myBuilt = kind === "supply" ? builtUnits(me) : [];
  const theirBuilt = kind === "supply" ? builtUnits(to) : [];

  const propose = () => {
    if (!toId) return;
    const terms: Deal["terms"] = { creditsFromTo: iPay - theyPay };
    if (kind === "asset" && assetId) { terms.assetId = assetId as AssetId; terms.lease = lease; terms.fillsGap = true; }
    if (kind === "access") { terms.grantsPrecondition = precond; terms.fillsGap = true; }
    if (kind === "supply" && supplySel) { terms.optionId = supplySel.split(":")[1]; terms.units = supplyUnits; terms.fillsGap = true; }
    if (standing && investorCut > 0) { terms.investorCut = investorCut / 100; }
    dispatch({ type: "proposeDeal", playerId, toPlayerId: toId, kind, terms, standing: standing || kind === "standing" });
    setIPay(0); setTheyPay(0); setAssetId(""); setInvestorCut(0); setSupplySel(""); setSupplyUnits(1);
  };

  const onPitch = async () => {
    if (pitching || !me) return;
    setPitching(true);
    try {
      const verdict = await judgePitch(pitch, stackSummary(me)); // Claude, if enabled
      if (verdict) {
        dispatch({ type: "resolvePitch", playerId, pitch, funded: verdict.funded, amount: verdict.amount, reason: verdict.reason });
      } else {
        dispatch({ type: "pitchVC", playerId, pitch }); // deterministic fallback
      }
    } finally {
      setPitching(false);
    }
  };

  const myDeals = table.deals.filter((d) => d.fromPlayerId === playerId || d.toPlayerId === playerId);
  const pending = myDeals.filter((d) => !d.active && !d.broken && !d.declined && ((d.toPlayerId === playerId && !d.confirmedTo) || (d.fromPlayerId === playerId && !d.confirmedFrom)));
  const active = table.deals.filter((d) => d.active && !d.broken);

  // A pair of reciprocal standing deals between the same two players reads as a
  // single "alliance" — bundle them so the board shows the partnership, not two
  // disconnected auto-repeating favors.
  const standingActive = active.filter((d) => d.standing);
  const alliances: { a: string; b: string; legs: Deal[] }[] = [];
  const inAlliance = new Set<string>();
  for (let i = 0; i < standingActive.length; i++) {
    for (let j = i + 1; j < standingActive.length; j++) {
      const d1 = standingActive[i];
      const d2 = standingActive[j];
      const reciprocal = d1.fromPlayerId === d2.toPlayerId && d1.toPlayerId === d2.fromPlayerId;
      if (reciprocal && !inAlliance.has(d1.id) && !inAlliance.has(d2.id)) {
        alliances.push({ a: d1.fromPlayerId, b: d1.toPlayerId, legs: [d1, d2] });
        inAlliance.add(d1.id);
        inAlliance.add(d2.id);
      }
    }
  }
  const looseActive = active.filter((d) => !inAlliance.has(d.id));

  const dealSummary = (d: Deal) => summarizeDeal(d, table);
  const playerLabel = (id: string) => {
    const p = table.players.find((x) => x.id === id);
    return `${REGION_BY_ID[p?.regionId ?? ""]?.flag ?? ""} ${p?.name ?? "—"}`.trim();
  };

  return (
    <div className="stage-panel trade-view" aria-label="Deals">
      <p className="tiny muted" style={{ marginTop: 0 }}>Bilateral trades. Both sides confirm; the app moves capital, assets & unlocks. <Term id="standing-deal">Standing deals</Term> auto-repeat — and can break under pressure.</p>

      <div className="trade-grid">
        <div className="trade-left">
          <section className="propose card">
            <h3 className="tiny upper">Propose a deal</h3>
            {others.length === 0 && <p className="tiny muted">No other players yet — a deal needs a partner. You can still pitch General Catalyst below.</p>}
            <label className="field"><span>With</span>
              <select value={toId} onChange={(e) => setToId(e.target.value)}>
                {others.map((p) => <option key={p.id} value={p.id}>{REGION_BY_ID[p.regionId]?.flag} {p.name} — {REGION_BY_ID[p.regionId]?.name}</option>)}
              </select>
            </label>
            <div className="kind-tabs">
              {KINDS.map((k) => (
                <button key={k.id} className={`kind-tab ${kind === k.id ? "on" : ""}`} onClick={() => setKind(k.id)}>
                  <span className="kind-tab-label">{k.label}</span>
                  <span className="kind-tab-hint">{k.hint}</span>
                </button>
              ))}
            </div>
            {(() => {
              const active = KINDS.find((k) => k.id === kind)!;
              return (
                <p className="tiny muted kind-legend">
                  <b><Term id={active.term}>{active.label}</Term> deal</b> — {active.desc}
                </p>
              );
            })()}

            <div className="row gap-2">
              <label className="field grow"><span>You pay</span>
                <div className="money-input">
                  <span className="money-pre">$</span>
                  <input type="text" inputMode="numeric" placeholder="0" value={fmtB(iPay)} onChange={(e) => setIPay(Math.max(0, parseB(e.target.value)))} />
                  <span className="money-suf">billion</span>
                </div>
                {iPay > 0 && <span className="tiny muted money-readout">{inWords(iPay)}</span>}
              </label>
              <label className="field grow"><span>They pay</span>
                <div className="money-input">
                  <span className="money-pre">$</span>
                  <input type="text" inputMode="numeric" placeholder="0" value={fmtB(theyPay)} onChange={(e) => setTheyPay(Math.max(0, parseB(e.target.value)))} />
                  <span className="money-suf">billion</span>
                </div>
                {theyPay > 0 && <span className="tiny muted money-readout">{inWords(theyPay)}</span>}
              </label>
            </div>

            {kind === "asset" && (
              <div className="row gap-2 wrap">
                <label className="field grow"><span><Term id="deal-asset">Asset</Term></span>
                  <select value={assetId} onChange={(e) => setAssetId(e.target.value as AssetId)}>
                    <option value="">— choose —</option>
                    {tradableAssets.map((a) => <option key={a} value={a}>{ASSET_LABEL[a]} {myAssets.includes(a) ? "(yours)" : "(theirs)"}</option>)}
                  </select>
                </label>
                <label className="check"><input type="checkbox" checked={lease} onChange={(e) => setLease(e.target.checked)} /> <Term id="lease">Lease</Term> (recurring)</label>
              </div>
            )}

            {kind === "supply" && (
              <div className="row gap-2 wrap">
                <label className="field grow"><span>Built units to trade</span>
                  <select value={supplySel} onChange={(e) => setSupplySel(e.target.value)}>
                    <option value="">— choose —</option>
                    {myBuilt.map((b) => <option key={`m-${b.optionId}`} value={`me:${b.optionId}`}>{OPTION_BY_ID[b.optionId]?.name ?? b.optionId} (yours ×{b.units})</option>)}
                    {theirBuilt.map((b) => <option key={`t-${b.optionId}`} value={`them:${b.optionId}`}>{OPTION_BY_ID[b.optionId]?.name ?? b.optionId} (theirs ×{b.units})</option>)}
                  </select>
                </label>
                <label className="field"><span>How many units</span>
                  <input type="number" min={1} value={supplyUnits} onChange={(e) => setSupplyUnits(Math.max(1, +e.target.value))} />
                </label>
                {supplySel && (
                  <p className="tiny muted" style={{ flexBasis: "100%", margin: 0 }}>
                    {supplySel.startsWith("them:") ? "You're buying — set \"You pay\" above." : "You're selling — set \"They pay\" above."}
                  </p>
                )}
              </div>
            )}

            {kind === "access" && (
              <label className="field"><span><Term id="deal-access">Unlock</Term> this deal opens <span className="muted">(both of you can use it)</span></span>
                <select value={precond} onChange={(e) => setPrecond(e.target.value as Precondition)}>
                  {Object.entries(PRECOND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            )}

            {(standing || kind === "standing") && (
              <label className="field"><span>Backer's cut of their score % (<Term id="standing-investment">standing investment</Term>)</span>
                <input type="number" min={0} max={50} value={investorCut} onChange={(e) => setInvestorCut(Math.max(0, Math.min(50, +e.target.value)))} />
              </label>
            )}

            {kind !== "standing" && kind !== "supply" && (
              <label className="check"><input type="checkbox" checked={standing} onChange={(e) => setStanding(e.target.checked)} /> Make it a <Term id="standing-deal">standing</Term> deal (auto-repeats)</label>
            )}

            <p className="tiny muted" style={{ margin: "0.5rem 0 0" }}>Deals are free — they don't use your build for the round, so you can strike one and still build what it unlocks.</p>
            <button className="btn btn-go" style={{ width: "100%", marginTop: "0.5rem" }} onClick={propose} disabled={!toId}>Propose →</button>
          </section>

          <section className="raise card">
            <h3 className="tiny upper"><Bank size={14} /> Raise capital — pitch General Catalyst</h3>
            <p className="tiny muted">Two sentences on why to fund your stack. {llmEnabled() ? "General Catalyst reads your pitch — a sharp one can win funding even for a middling stack." : "General Catalyst backs a coherent, defensible plan — and turns down a weak or over-exposed one."} <b className="warn-text">A pitch is your whole turn: get declined and you've burned the round.</b></p>
            <textarea className="pitch-box" rows={3} maxLength={240} value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="In two sentences: what are you building, and why is it the one to back?" />
            {me.actionThisRound ? (
              <p className="tiny warn-text" style={{ margin: "0 0 0.4rem" }}>
                You've already used your one action this round ({me.actionThisRound === "build" ? "built a layer" : me.pitch && !me.pitch.funded ? "General Catalyst declined" : "raised capital"}). Pitching opens again next round — advance the table from the left rail.
              </p>
            ) : pitch.trim().length < 12 ? (
              <p className="tiny muted" style={{ margin: "0 0 0.4rem" }}>Write at least a sentence ({pitch.trim().length}/12 characters) to pitch.</p>
            ) : null}
            <button className="btn btn-go" style={{ width: "100%" }} disabled={!!me.actionThisRound || pitch.trim().length < 12 || pitching} onClick={onPitch}>
              {pitching ? "General Catalyst is pondering…" : me.actionThisRound ? "Action already used this round" : "Pitch General Catalyst →"}
            </button>
            {pitching && (
              <div className="vc-pondering">
                <span className="vc-dots"><i /><i /><i /></span>
                <span>General Catalyst reads your pitch, sizes up your stack…</span>
              </div>
            )}
            {!pitching && me.pitch && me.pitch.round === table.round && (
              <div className={`pitch-result ${me.pitch.funded ? "funded" : "declined"}`}>
                {me.pitch.funded
                  ? <span className="row gap-1"><Check size={14} /> <span><b>Funded {credits(me.pitch.amount)}.</b> {me.pitch.reason}</span></span>
                  : <span className="row gap-1"><X size={14} /> <span><b>Declined — turn burned.</b> {me.pitch.reason}</span></span>}
              </div>
            )}
          </section>
        </div>

          <section className="deals-list">
            {pending.length > 0 && <h3 className="tiny upper">Awaiting confirmation</h3>}
            {pending.map((d) => (
              <div key={d.id} className="deal-row card pending">
                <div className="grow">
                  <div className="deal-sum tiny">{dealSummary(d)}</div>
                  <div className="tiny muted">{d.standing ? "standing" : "one-off"} · {d.toPlayerId === playerId ? "they proposed to you" : "you proposed"}</div>
                </div>
                {d.toPlayerId === playerId && !d.confirmedTo ? (
                  <>
                    <button className="btn btn-sm btn-go" onClick={() => dispatch({ type: "confirmDeal", playerId, dealId: d.id })}>Accept</button>
                    <button className="btn btn-sm btn-danger" onClick={() => dispatch({ type: "declineDeal", playerId, dealId: d.id })}>Decline</button>
                  </>
                ) : (
                  <>
                    <span className="tag">sent</span>
                    <button className="btn btn-sm btn-danger" onClick={() => dispatch({ type: "cancelDeal", playerId, dealId: d.id })}>✕</button>
                  </>
                )}
              </div>
            ))}

            <h3 className="tiny upper">Active deals ({active.length})</h3>
            {active.length === 0 && <p className="tiny muted">No deals yet. Find what others need and fill a real gap — that scores most.</p>}
            {alliances.map((al) => (
              <div key={`al-${al.legs[0].id}`} className="deal-row card alliance">
                <div className="grow">
                  <div className="deal-sum tiny"><Handshake size={13} /> Alliance · {playerLabel(al.a)} ↔ {playerLabel(al.b)}</div>
                  {al.legs.map((l) => <div key={l.id} className="tiny muted">↻ {dealSummary(l)}</div>)}
                </div>
              </div>
            ))}
            {looseActive.map((d) => (
              <div key={d.id} className={`deal-row card ${d.standing ? "standing" : ""}`}>
                <div className="grow">
                  <div className="deal-sum tiny">{dealSummary(d)}</div>
                  <div className="tiny muted">{d.standing ? "↻ standing · locked in" : "agreed · locked in"}{d.terms.fillsGap ? " · fills a gap" : ""}</div>
                </div>
              </div>
            ))}
          </section>
      </div>
    </div>
  );
}

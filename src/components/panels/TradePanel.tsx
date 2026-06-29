import { useState, useEffect } from "react";
import { useGame } from "../../store/useGame";
import { REGION_BY_ID } from "../../data/regions";
import { Term } from "../Term";
import { credits } from "../util";
import { Bank, Check, X } from "../icons";
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
    setDealDraft(null); // consume once
  }, [dealDraft, setDealDraft]);

  if (!me) return null;
  const to = table.players.find((p) => p.id === toId);

  const myAssets = me.assets;
  const theirAssets = to?.assets ?? [];
  const tradableAssets = kind === "asset" ? [...myAssets, ...theirAssets] : [];

  const propose = () => {
    if (!toId) return;
    const terms: Deal["terms"] = { creditsFromTo: iPay - theyPay };
    if (kind === "asset" && assetId) { terms.assetId = assetId as AssetId; terms.lease = lease; terms.fillsGap = true; }
    if (kind === "access") { terms.grantsPrecondition = precond; terms.fillsGap = true; }
    if (standing && investorCut > 0) { terms.investorCut = investorCut / 100; }
    dispatch({ type: "proposeDeal", playerId, toPlayerId: toId, kind, terms, standing: standing || kind === "standing" });
    setIPay(0); setTheyPay(0); setAssetId(""); setInvestorCut(0);
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

  const dealSummary = (d: Deal) => summarizeDeal(d, table);

  return (
    <div className="stage-panel trade-view" aria-label="Deals">
      <p className="tiny muted" style={{ marginTop: 0 }}>Bilateral trades. Both sides confirm; the app moves capital, assets & unlocks. <Term id="standing-deal">Standing deals</Term> auto-repeat — and can break under pressure.</p>

      <div className="trade-grid">
        <div className="trade-left">
          <section className="propose card">
            <h3 className="tiny upper">Propose a deal</h3>
            {others.length === 0 && <p className="tiny muted">No other players yet — a deal needs a partner. You can still pitch a VC below.</p>}
            <label className="field"><span>With</span>
              <select value={toId} onChange={(e) => setToId(e.target.value)}>
                {others.map((p) => <option key={p.id} value={p.id}>{REGION_BY_ID[p.regionId]?.flag} {p.name} — {REGION_BY_ID[p.regionId]?.name}</option>)}
              </select>
            </label>
            <div className="kind-tabs">
              {(["swap", "asset", "access", "standing"] as DealKind[]).map((k) => (
                <button key={k} className={`kind-tab ${kind === k ? "on" : ""}`} onClick={() => setKind(k)}>{k}</button>
              ))}
            </div>
            <p className="tiny muted kind-legend">
              <Term id="deal-swap">Swap</Term> cash · <Term id="deal-asset">Asset</Term> hand over a holding · <Term id="deal-access">Access</Term> grant an unlock · <Term id="standing-deal">Standing</Term> auto-repeats
            </p>

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

            {kind === "access" && (
              <label className="field"><span><Term id="deal-access">Unlock</Term> you grant them</span>
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

            {kind !== "standing" && (
              <label className="check"><input type="checkbox" checked={standing} onChange={(e) => setStanding(e.target.checked)} /> Make it a <Term id="standing-deal">standing</Term> deal (auto-repeats)</label>
            )}

            {me.actionThisRound && (
              <p className="tiny warn-text" style={{ margin: "0.5rem 0 0" }}>
                You've used your action this round ({me.actionThisRound === "build" ? "built a layer" : me.actionThisRound === "deal" ? "proposed a deal" : me.pitch && !me.pitch.funded ? "VC pitch declined" : "raised capital"}). You can still accept offers below.
              </p>
            )}
            <button className="btn btn-go" style={{ width: "100%", marginTop: "0.5rem" }} onClick={propose} disabled={!toId || !!me.actionThisRound}>Propose →</button>
          </section>

          <section className="raise card">
            <h3 className="tiny upper"><Bank size={14} /> Raise capital — pitch a VC</h3>
            <p className="tiny muted">Two sentences on why to fund your stack. {llmEnabled() ? "A real VC reads your pitch — a sharp one can win funding even for a middling stack." : "The VC backs a coherent, defensible plan — and turns down a weak or over-exposed one."} <b className="warn-text">A pitch is your whole turn: get declined and you've burned the round.</b></p>
            <textarea className="pitch-box" rows={3} maxLength={240} value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="In two sentences: what are you building, and why is it the one to back?" />
            {me.actionThisRound ? (
              <p className="tiny warn-text" style={{ margin: "0 0 0.4rem" }}>
                You've already used your one action this round ({me.actionThisRound === "build" ? "built a layer" : me.actionThisRound === "deal" ? "proposed a deal" : me.pitch && !me.pitch.funded ? "VC pitch declined" : "raised capital"}). Pitching opens again next round — advance the table from the left rail.
              </p>
            ) : pitch.trim().length < 12 ? (
              <p className="tiny muted" style={{ margin: "0 0 0.4rem" }}>Write at least a sentence ({pitch.trim().length}/12 characters) to pitch.</p>
            ) : null}
            <button className="btn btn-go" style={{ width: "100%" }} disabled={!!me.actionThisRound || pitch.trim().length < 12 || pitching} onClick={onPitch}>
              {pitching ? "The VC is pondering…" : me.actionThisRound ? "Action already used this round" : "Pitch to the VC →"}
            </button>
            {pitching && (
              <div className="vc-pondering">
                <span className="vc-dots"><i /><i /><i /></span>
                <span>The VC reads your pitch, sizes up your stack…</span>
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
            {active.map((d) => (
              <div key={d.id} className={`deal-row card ${d.standing ? "standing" : ""}`}>
                <div className="grow">
                  <div className="deal-sum tiny">{dealSummary(d)}</div>
                  <div className="tiny muted">{d.standing ? "↻ standing" : "one-off"}{d.terms.fillsGap ? " · fills a gap" : ""}</div>
                </div>
                {(d.fromPlayerId === playerId || d.toPlayerId === playerId) && (
                  <button className="btn btn-sm btn-ghost" onClick={() => dispatch({ type: "cancelDeal", playerId, dealId: d.id })}>cancel</button>
                )}
              </div>
            ))}
          </section>
      </div>
    </div>
  );
}

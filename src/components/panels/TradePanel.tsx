import { useState } from "react";
import { useGame } from "../../store/useGame";
import { REGION_BY_ID } from "../../data/regions";
import { Term } from "../Term";
import { credits } from "../util";
import type { DealKind, Precondition, AssetId, Deal } from "../../data/types";

const ASSET_LABEL: Record<string, string> = {
  "asml-token": "ASML token", "mistral-license": "Mistral license", "cohere-license": "Cohere license",
  "nscale-capacity": "Nscale capacity", "enterprise-channel": "Enterprise channel", "consumer-channel": "Consumer channel",
  "open-weights-grant": "Open-weights grant", "renewable-sites": "Renewable sites", "chip-allocation": "Chip allocation",
  "swf-financing": "SWF financing", "industrial-demand": "Industrial demand",
};

const PRECOND_LABEL: Partial<Record<Precondition, string>> = {
  "deal-compute": "Cluster access (compute)",
  "supply-allocation": "Chip supply allocation",
  "high-power": "High-power base",
  "renewable-power": "Renewable-power base",
  "open-weights": "Open weights (free L4)",
  "market-channel": "Market channel (L5 reach)",
  "political-standing": "Political cover / standing",
  "co-funder-1": "Shared-build commitment",
  "co-funders-2": "Coalition co-funder",
  "oss-grant": "OSS open-weights grant",
};

export function TradePanel({ onClose }: { onClose: () => void }) {
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

  const myDeals = table.deals.filter((d) => d.fromPlayerId === playerId || d.toPlayerId === playerId);
  const pending = myDeals.filter((d) => !d.active && !d.broken && ((d.toPlayerId === playerId && !d.confirmedTo) || (d.fromPlayerId === playerId && !d.confirmedFrom)));
  const active = table.deals.filter((d) => d.active && !d.broken);

  const dealSummary = (d: Deal) => {
    const from = table.players.find((p) => p.id === d.fromPlayerId);
    const t = table.players.find((p) => p.id === d.toPlayerId);
    const parts: string[] = [];
    const c = d.terms.creditsFromTo ?? 0;
    if (c > 0) parts.push(`${from?.name} pays ${credits(c)} → ${t?.name}`);
    if (c < 0) parts.push(`${t?.name} pays ${credits(-c)} → ${from?.name}`);
    if (d.terms.assetId) parts.push(`${d.terms.lease ? "leases" : "sells"} ${ASSET_LABEL[d.terms.assetId]}`);
    if (d.terms.grantsPrecondition) parts.push(`unlocks ${PRECOND_LABEL[d.terms.grantsPrecondition] ?? d.terms.grantsPrecondition}`);
    if (d.terms.investorCut) parts.push(`${from?.name} backs ${t?.name} for ${Math.round(d.terms.investorCut * 100)}%`);
    return parts.join(" · ") || "favor";
  };

  return (
    <div className="sheet trade-sheet" role="dialog" aria-label="Deals">
      <div className="sheet-head">
        <div>
          <h2>Deals</h2>
          <p className="tiny muted">Bilateral trades. Both sides confirm; the app moves Credits, assets & unlocks, and draws a road. <Term id="standing-deal">Standing deals</Term> pulse — and can break.</p>
        </div>
        <button className="btn btn-sm" onClick={onClose}>Close ✕</button>
      </div>

      {others.length === 0 ? (
        <p className="muted">No one else at the table yet. Deals need a partner.</p>
      ) : (
        <div className="trade-grid">
          <section className="propose card">
            <h3 className="tiny upper">Propose a deal</h3>
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

            <div className="row gap-2">
              <label className="field grow"><span>You pay §</span><input type="number" min={0} value={iPay} onChange={(e) => setIPay(Math.max(0, +e.target.value))} /></label>
              <label className="field grow"><span>They pay §</span><input type="number" min={0} value={theyPay} onChange={(e) => setTheyPay(Math.max(0, +e.target.value))} /></label>
            </div>

            {kind === "asset" && (
              <div className="row gap-2 wrap">
                <label className="field grow"><span>Asset</span>
                  <select value={assetId} onChange={(e) => setAssetId(e.target.value as AssetId)}>
                    <option value="">— choose —</option>
                    {tradableAssets.map((a) => <option key={a} value={a}>{ASSET_LABEL[a]} {myAssets.includes(a) ? "(yours)" : "(theirs)"}</option>)}
                  </select>
                </label>
                <label className="check"><input type="checkbox" checked={lease} onChange={(e) => setLease(e.target.checked)} /> Lease (recurring)</label>
              </div>
            )}

            {kind === "access" && (
              <label className="field"><span>Unlock you grant them</span>
                <select value={precond} onChange={(e) => setPrecond(e.target.value as Precondition)}>
                  {Object.entries(PRECOND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            )}

            {(standing || kind === "standing") && (
              <label className="field"><span>Backer's cut of their score % (standing investment)</span>
                <input type="number" min={0} max={50} value={investorCut} onChange={(e) => setInvestorCut(Math.max(0, Math.min(50, +e.target.value)))} />
              </label>
            )}

            {kind !== "standing" && (
              <label className="check"><input type="checkbox" checked={standing} onChange={(e) => setStanding(e.target.checked)} /> Make it a <Term id="standing-deal">standing</Term> deal (auto-repeats)</label>
            )}

            <button className="btn btn-go" style={{ width: "100%", marginTop: "0.5rem" }} onClick={propose} disabled={!toId}>Propose →</button>
          </section>

          <section className="deals-list">
            {pending.length > 0 && <h3 className="tiny upper">Awaiting confirmation</h3>}
            {pending.map((d) => (
              <div key={d.id} className="deal-row card pending">
                <div className="grow">
                  <div className="deal-sum tiny">{dealSummary(d)}</div>
                  <div className="tiny muted">{d.standing ? "standing" : "one-off"} · {d.toPlayerId === playerId ? "they proposed to you" : "you proposed"}</div>
                </div>
                {d.toPlayerId === playerId && !d.confirmedTo ? (
                  <button className="btn btn-sm btn-go" onClick={() => dispatch({ type: "confirmDeal", playerId, dealId: d.id })}>Accept</button>
                ) : <span className="tag">sent</span>}
                <button className="btn btn-sm btn-danger" onClick={() => dispatch({ type: "cancelDeal", playerId, dealId: d.id })}>✕</button>
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
      )}
    </div>
  );
}

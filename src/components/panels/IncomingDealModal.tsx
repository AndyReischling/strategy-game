import { useState } from "react";
import { useGame } from "../../store/useGame";
import { REGION_BY_ID } from "../../data/regions";
import { summarizeDeal } from "../dealText";
import { Handshake, Check, X, ArrowsClockwise } from "../icons";

// A deal that's waiting on YOU blocks the screen until you answer. Nothing else
// in the game proceeds (and the host can't end the round) until every offer on
// the table has been accepted, declined, or countered.
export function IncomingDealModal() {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const dispatch = useGame((s) => s.dispatch);
  const [countering, setCountering] = useState(false);
  const [youPay, setYouPay] = useState(0);
  const [theyPay, setTheyPay] = useState(0);

  // deals where it's my turn to answer (as recipient OR as the original proposer
  // who's just been countered)
  const waiting = table.deals.filter(
    (d) => !d.active && !d.broken && !d.declined &&
      ((d.toPlayerId === playerId && !d.confirmedTo) || (d.fromPlayerId === playerId && !d.confirmedFrom)),
  );
  if (waiting.length === 0) return null;

  const d = waiting[0];
  const iAmTo = d.toPlayerId === playerId;
  const otherId = iAmTo ? d.fromPlayerId : d.toPlayerId;
  const other = table.players.find((p) => p.id === otherId);
  const region = other ? REGION_BY_ID[other.regionId] : undefined;
  const countered = (d.counters ?? 0) > 0;

  const sendCounter = () => {
    // translate "you pay / they pay" into creditsFromTo (from-pays-to, in $B)
    const creditsFromTo = iAmTo ? theyPay - youPay : youPay - theyPay;
    dispatch({ type: "counterDeal", playerId, dealId: d.id, terms: { ...d.terms, creditsFromTo } });
    setCountering(false); setYouPay(0); setTheyPay(0);
  };

  return (
    <div className="event-overlay inspect-overlay deal-overlay">
      <div className="incoming-deal card offset c-yellow" role="dialog" aria-label="Deal on the table">
        <div className="event-kicker mono upper tiny"><Handshake size={14} /> {countered ? "Counter-offer" : "Incoming offer"}{waiting.length > 1 ? ` · ${waiting.length} waiting` : ""}</div>
        <h2 className="event-name">{region?.flag} {other?.name} {countered ? "countered" : "wants a deal"}</h2>
        <p className="incoming-terms">{summarizeDeal(d, table)}</p>
        <p className="tiny muted">{d.standing ? "Standing deal — it repeats every round until it breaks." : "One-off deal, this round only."}</p>

        {!countering ? (
          <>
            <p className="tiny muted">Answer to continue — the game waits on you.</p>
            <div className="incoming-actions">
              <button className="btn btn-go grow" onClick={() => dispatch({ type: "confirmDeal", playerId, dealId: d.id })}>
                <Check size={16} /> Accept
              </button>
              <button className="btn btn-danger grow" onClick={() => dispatch({ type: "declineDeal", playerId, dealId: d.id })}>
                <X size={16} /> Decline
              </button>
            </div>
            {(d.counters ?? 0) < 4 && (
              <button className="btn btn-sm btn-ghost incoming-counter-toggle" onClick={() => setCountering(true)}>
                <ArrowsClockwise size={14} /> Counter the price
              </button>
            )}
          </>
        ) : (
          <div className="incoming-counter">
            <p className="tiny muted">Propose new cash terms (everything else stays the same):</p>
            <div className="row gap-2">
              <label className="field grow"><span>You pay $B</span>
                <input type="number" min={0} value={youPay} onChange={(e) => setYouPay(Math.max(0, +e.target.value))} />
              </label>
              <label className="field grow"><span>They pay $B</span>
                <input type="number" min={0} value={theyPay} onChange={(e) => setTheyPay(Math.max(0, +e.target.value))} />
              </label>
            </div>
            <div className="incoming-actions">
              <button className="btn btn-go grow" onClick={sendCounter}>Send counter →</button>
              <button className="btn btn-ghost" onClick={() => setCountering(false)}>Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useGame } from "../../store/useGame";
import { REGION_BY_ID } from "../../data/regions";
import { summarizeDeal } from "../dealText";
import { Handshake, Check, X } from "../icons";

// A deal proposed to a human blocks their screen until they answer — nothing
// else in the game proceeds for them (and the host can't end the round) until
// every pending offer has an accept or decline.
export function IncomingDealModal() {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const dispatch = useGame((s) => s.dispatch);

  const incoming = table.deals.filter(
    (d) => d.toPlayerId === playerId && !d.confirmedTo && !d.active && !d.broken && !d.declined,
  );
  if (incoming.length === 0) return null;

  const d = incoming[0];
  const from = table.players.find((p) => p.id === d.fromPlayerId);
  const region = from ? REGION_BY_ID[from.regionId] : undefined;

  return (
    <div className="event-overlay inspect-overlay deal-overlay">
      <div className="incoming-deal card offset c-yellow" role="dialog" aria-label="Incoming deal">
        <div className="event-kicker mono upper tiny"><Handshake size={14} /> Incoming offer{incoming.length > 1 ? ` · ${incoming.length} waiting` : ""}</div>
        <h2 className="event-name">{region?.flag} {from?.name} wants a deal</h2>
        <p className="incoming-terms">{summarizeDeal(d, table)}</p>
        <p className="tiny muted">{d.standing ? "This is a standing deal — it repeats every round until it breaks." : "One-off deal, this round only."}</p>
        <p className="tiny muted">Answer to continue — the game waits on you.</p>
        <div className="incoming-actions">
          <button className="btn btn-go grow" onClick={() => dispatch({ type: "confirmDeal", playerId, dealId: d.id })}>
            <Check size={16} /> Accept
          </button>
          <button className="btn btn-danger grow" onClick={() => dispatch({ type: "declineDeal", playerId, dealId: d.id })}>
            <X size={16} /> Decline
          </button>
        </div>
      </div>
    </div>
  );
}

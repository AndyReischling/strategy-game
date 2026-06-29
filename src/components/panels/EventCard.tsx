import { useState } from "react";
import { useGame } from "../../store/useGame";
import { EVENT_BY_ID } from "../../data/events";
import { Term } from "../Term";
import { X, Check } from "../icons";

export function EventCard() {
  const table = useGame((s) => s.table)!;
  const [dismissed, setDismissed] = useState(false);
  const event = table.eventId ? EVENT_BY_ID[table.eventId] : undefined;
  if (!event || dismissed) return null;
  // LLM-generated, real-world-grounded flavor (mechanics unchanged) if present
  const fx = table.eventId ? table.eventFlavor?.[table.eventId] : undefined;
  const name = fx?.name || event.name;
  const flavor = fx?.flavor || event.flavor;
  const effectText = fx?.effectText || event.effectText;
  return (
    <div className="event-overlay">
      <div className="event-card card offset c-orange">
        <button className="event-x btn btn-sm btn-ghost" onClick={() => setDismissed(true)} aria-label="Dismiss"><X size={16} /></button>
        <div className="event-kicker mono upper tiny">Round {table.round} · World event{fx ? " · live" : ""}</div>
        <h2 className="event-name">{name}</h2>
        <p className="event-flavor">“{flavor}”</p>
        <div className="event-effect">
          <span className="tag warn">Effect</span>
          <p>{effectText}</p>
        </div>
        {event.terms && (
          <div className="row wrap gap-1 event-terms">
            {event.terms.map((t) => <span key={t} className="tag"><Term id={t} /></span>)}
          </div>
        )}
        <p className="tiny muted">The same card is drawn for every table this round, so the leaderboard stays fair.</p>
        <button className="btn btn-go event-continue" onClick={() => setDismissed(true)}>Got it, continue <Check size={16} /></button>
      </div>
    </div>
  );
}

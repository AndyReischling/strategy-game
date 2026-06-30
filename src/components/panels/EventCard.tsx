import { useGame } from "../../store/useGame";
import { currentEvent } from "../../engine/game";
import { Term } from "../Term";
import { X, Check } from "../icons";

export function EventCard({ onClose }: { onClose: () => void }) {
  const table = useGame((s) => s.table)!;
  const event = currentEvent(table);
  if (!event) return null;
  // A board-reactive generated event is already bespoke; otherwise apply any
  // LLM flavor override to the static card (mechanics unchanged).
  const generated = !!table.generatedEvents?.[table.round];
  const fx = !generated && table.eventId ? table.eventFlavor?.[table.eventId] : undefined;
  const live = generated || !!fx;
  const name = fx?.name || event.name;
  const flavor = fx?.flavor || event.flavor;
  const effectText = fx?.effectText || event.effectText;
  return (
    <div className="event-overlay">
      <div className="event-card card offset c-orange">
        <button className="event-x btn btn-sm btn-ghost" onClick={onClose} aria-label="Dismiss"><X size={16} /></button>
        <div className="event-kicker mono upper tiny">Round {table.round} · World event{live ? " · live" : ""}</div>
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
        <button className="btn btn-go event-continue" onClick={onClose}>Got it, continue <Check size={16} /></button>
      </div>
    </div>
  );
}

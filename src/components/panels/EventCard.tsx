import { useGame } from "../../store/useGame";
import { EVENT_BY_ID } from "../../data/events";
import { Term } from "../Term";

export function EventCard() {
  const table = useGame((s) => s.table)!;
  const event = table.eventId ? EVENT_BY_ID[table.eventId] : undefined;
  if (!event) return null;
  return (
    <div className="event-overlay">
      <div className="event-card card offset c-orange">
        <div className="event-kicker mono upper tiny">Round {table.round} · World event</div>
        <h2 className="event-name">{event.name}</h2>
        <p className="event-flavor">“{event.flavor}”</p>
        <div className="event-effect">
          <span className="tag warn">Effect</span>
          <p>{event.effectText}</p>
        </div>
        {event.terms && (
          <div className="row wrap gap-1 event-terms">
            {event.terms.map((t) => <span key={t} className="tag"><Term id={t} /></span>)}
          </div>
        )}
        <p className="tiny muted">The same card is drawn for every table this round, so the leaderboard stays fair.</p>
      </div>
    </div>
  );
}

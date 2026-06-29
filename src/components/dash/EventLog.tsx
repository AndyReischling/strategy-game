import { useGame } from "../../store/useGame";
import type { LogKind } from "../../data/types";
import { Megaphone, Power, Handshake, Hammer, Flag, Sparkle } from "../icons";
import type { Icon } from "../icons";

const KIND_ICON: Record<LogKind, Icon> = {
  round: Flag,
  event: Megaphone,
  offswitch: Power,
  deal: Handshake,
  build: Hammer,
  score: Sparkle,
  game: Sparkle,
};

export function EventLog() {
  const table = useGame((s) => s.table)!;
  const entries = [...table.log].reverse();

  return (
    <div className="event-log">
      <div className="rail-title">
        <span className="display">Dispatches</span>
        <span className="tiny muted">the round-by-round record</span>
      </div>
      <ol className="log-list">
        {entries.length === 0 && <li className="tiny muted log-empty">The game hasn't started yet.</li>}
        {entries.map((e) => {
          const Icon = KIND_ICON[e.kind];
          return (
            <li key={e.id} className={`log-row k-${e.kind}`}>
              <span className="log-ico"><Icon size={15} /></span>
              <span className="log-body">
                <span className="log-round mono tiny">R{e.round || "0"}</span>
                <span className="log-text">{e.text}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

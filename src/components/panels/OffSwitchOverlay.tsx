import { useGame } from "../../store/useGame";
import { OUTCOME_BY_ID } from "../../data/events";
import { REGION_BY_ID } from "../../data/regions";
import { CONFIG } from "../../data/config";
import { Term } from "../Term";
import { DICE, Check, Warning, X } from "../icons";

export function OffSwitchOverlay({ onClose }: { onClose: () => void }) {
  const table = useGame((s) => s.table)!;
  const roll = table.lastRoll;
  if (!roll) return null;
  const outcome = roll.outcomeId ? OUTCOME_BY_ID[roll.outcomeId] : undefined;

  return (
    <div className="event-overlay">
      <div className={`offswitch-card card offset ${roll.triggered ? "c-orange" : "c-green"}`}>
        <button className="event-x btn btn-sm btn-ghost" onClick={onClose} aria-label="Dismiss"><X size={16} /></button>
        <div className="event-kicker mono upper tiny">End of round {roll.round} · the cut-off roll</div>
        <p className="tiny muted" style={{ margin: "0 0 0.4rem" }}>
          Each round we roll a die. On a <b>{CONFIG.offSwitch.triggerMin}, 5 or 6</b>, a foreign power "<Term id="off-switch">switches off</Term>" tech you rent or borrow. Owning your stack keeps you safe.
        </p>
        <div className="dice-row">
          {roll.rolls.map((v, i) => {
            const Die = DICE[v] ?? DICE[1];
            return <Die key={i} size={64} weight="fill" className={`die ${v >= CONFIG.offSwitch.triggerMin ? "hot" : ""}`} />;
          })}
        </div>

        {!roll.triggered ? (
          <>
            <h2 className="event-name">No one got cut off</h2>
            <p className="event-flavor">The dice came up low, so no foreign power pulled the plug this round. Anyone leaning on rented or foreign tech got lucky — this time.</p>
          </>
        ) : outcome ? (
          <>
            <h2 className="event-name">{outcome.name}</h2>
            <p className="event-flavor">“{outcome.flavor}”</p>
            <div className="hit-list">
              {roll.results.map((r) => {
                const p = table.players.find((x) => x.id === r.playerId);
                if (!p) return null;
                const region = REGION_BY_ID[p.regionId];
                return (
                  <div key={r.playerId} className={`hit-row ${r.spared ? "spared" : "hit"}`}>
                    <span className={`np c-${p.color}`}><span className="np-dot spot-bg" />{region?.flag} {p.name}</span>
                    {r.falseAlarm ? (
                      <span className="tiny">flagged — a free warning</span>
                    ) : r.spared ? (
                      <span className="tiny good-text row gap-1"><Check size={14} /> shrugged it off</span>
                    ) : (
                      <span className="tiny warn-text row gap-1"><Warning size={14} /> −{r.adoptionLost} adoption · {r.damagedLayers.join(", ")} cracked</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
        {table.brokenDeals && table.brokenDeals.length > 0 && (
          <p className="tiny warn-text">A standing deal snapped under the pressure — both sides paid a penalty.</p>
        )}
        <button className="btn btn-go event-continue" onClick={onClose}>Got it, continue <Check size={16} /></button>
      </div>
    </div>
  );
}

import { useGame } from "../../store/useGame";
import { OUTCOME_BY_ID } from "../../data/events";
import { REGION_BY_ID } from "../../data/regions";
import { CONFIG } from "../../data/config";
import { Term } from "../Term";

const PIPS = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export function OffSwitchOverlay() {
  const table = useGame((s) => s.table)!;
  const roll = table.lastRoll;
  if (!roll) return null;
  const outcome = roll.outcomeId ? OUTCOME_BY_ID[roll.outcomeId] : undefined;

  return (
    <div className="event-overlay">
      <div className={`offswitch-card card offset ${roll.triggered ? "c-orange" : "c-green"}`}>
        <div className="event-kicker mono upper tiny"><Term id="off-switch">Off-switch</Term> die · trigger {CONFIG.offSwitch.triggerMin}–6</div>
        <div className="dice-row">
          {roll.rolls.map((v, i) => (
            <span key={i} className={`die ${v >= CONFIG.offSwitch.triggerMin ? "hot" : ""}`}>{PIPS[v]}</span>
          ))}
        </div>

        {!roll.triggered ? (
          <>
            <h2 className="event-name">The lever doesn't fall</h2>
            <p className="event-flavor">A low roll. No move from the adversary this round — exposed stacks live to gamble another day.</p>
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
                      <span className="tiny good-text">✓ shrugged it off</span>
                    ) : (
                      <span className="tiny warn-text">⚡ −{r.adoptionLost} adoption · {r.damagedLayers.join(", ")} cracked</span>
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
      </div>
    </div>
  );
}

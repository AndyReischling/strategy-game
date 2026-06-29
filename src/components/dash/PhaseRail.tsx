import { useGame } from "../../store/useGame";
import { CONFIG } from "../../data/config";
import { ArrowRight, TrendUp, ShieldCheck, Handshake } from "../icons";
import { Term } from "../Term";

export function PhaseRail() {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const transport = useGame((s) => s.transport);
  const dispatch = useGame((s) => s.dispatch);
  const isHost = table.hostId === playerId || transport === "local";
  const me = table.players.find((p) => p.id === playerId);

  // bots take their single action automatically at round start, so they always
  // count as "moved"; we only wait on human players.
  const ready = table.players.filter((p) => p.ready);
  const moved = ready.filter((p) => p.actionThisRound || !p.isHuman).length;
  const waiting = ready.length - moved;
  const allMoved = waiting === 0;
  const lastRound = table.round >= CONFIG.totalRounds;

  return (
    <div className="phase-rail">
      <div className="pr-round">
        <span className="tiny upper mono muted">Round</span>
        <span className="pr-round-n display">{table.round}<span className="muted">/{CONFIG.totalRounds}</span></span>
      </div>

      {me && (
        <div className="pr-score">
          <span className="tiny upper muted">Your score</span>
          <span className="pr-score-n display tnum">{me.score.final}</span>
          <div className="pr-score-parts tiny">
            <span title="Adoption (users)"><TrendUp size={13} /> {me.score.rawAdoption}</span>
            <span title="Sovereignty multiplier"><ShieldCheck size={13} /> ×{me.score.sovereignty.toFixed(2)}</span>
            <span title="Deal points"><Handshake size={13} /> {me.score.deals}</span>
          </div>
        </div>
      )}

      <p className="pr-hint tiny">
        Take your <b>one action</b> this round — build a layer, strike a deal, or pitch a VC — anywhere across your stack. When everyone's moved, the round ends: the <Term id="off-switch">off-switch</Term> dice roll and scores update.
      </p>

      {ready.length > 0 && (
        <div className={`pr-turns ${allMoved ? "done" : "waiting"}`}>
          {allMoved ? `Everyone's moved (${moved}/${ready.length})` : `${moved}/${ready.length} have moved`}
        </div>
      )}

      <div className="pr-advance">
        {isHost ? (
          <>
            <span className="pr-advance-cap tiny upper muted">{lastRound ? "Finish the game" : "End the round"}</span>
            <button
              className="btn btn-go"
              onClick={() => dispatch({ type: "advancePhase", playerId })}
              disabled={!allMoved}
            >
              {lastRound ? "See final results" : `Next round (${table.round + 1})`} <ArrowRight size={16} />
            </button>
            {!allMoved && (
              <span className="tiny warn-text pr-waiting">{waiting} {waiting === 1 ? "player" : "players"} still to move</span>
            )}
          </>
        ) : (
          <span className="tiny muted">{allMoved ? "The host starts the next round." : "Take your move — then the host ends the round."}</span>
        )}
      </div>
    </div>
  );
}

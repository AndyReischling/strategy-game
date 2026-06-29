import { useGame } from "../store/useGame";
import { REGION_BY_ID } from "../data/regions";
import { tableRows } from "../engine/leaderboard";

export function FinalScreen() {
  const table = useGame((s) => s.table)!;
  const leaderboard = useGame((s) => s.leaderboard);
  const dispatch = useGame((s) => s.dispatch);
  const leave = useGame((s) => s.leave);
  const playerId = useGame((s) => s.playerId);
  const isHost = table.hostId === playerId || useGame.getState().transport === "local";

  const local = tableRows(table).sort((a, b) => b.score - a.score);
  const global = [...leaderboard].sort((a, b) => b.score - a.score);
  const globalWinner = global[0];
  const podium = local.slice(0, 3);

  return (
    <div className="final">
      <div className="final-grain halftone" aria-hidden />
      <h1 className="final-title">Round 5.<br />Scores lock.</h1>

      {globalWinner && (
        <div className="final-crown card offset c-yellow">
          <span className="tiny upper mono">Best AI coalition in the world</span>
          <div className="crown-name display">{globalWinner.flag} {globalWinner.name}</div>
          <div className="tiny muted">{globalWinner.regionName} · table {globalWinner.table} · <span className="tnum">{globalWinner.score}</span></div>
        </div>
      )}

      <h2 className="final-sub">Table {table.code} podium</h2>
      <div className="podium">
        {podium.map((r, i) => (
          <div key={r.playerId} className={`podium-col card c-${r.color} place-${i + 1}`}>
            <div className="podium-rank display">{i + 1}</div>
            <div className="podium-flag">{r.flag}</div>
            <div className="podium-name">{r.name}</div>
            <div className="tiny muted">{REGION_BY_ID[r.regionId]?.name}</div>
            <div className="podium-score tnum display">{r.score}</div>
          </div>
        ))}
      </div>

      <div className="row gap-2 center" style={{ marginTop: "1.4rem" }}>
        {isHost && <button className="btn btn-primary" onClick={() => dispatch({ type: "resetTable" })}>Play again</button>}
        <button className="btn btn-ghost" onClick={leave}>Leave table</button>
      </div>
      <p className="tiny muted final-lesson">
        You don't win by being richest or smartest. You win by building something you actually own,
        that real people use, with partners you can count on.
      </p>
    </div>
  );
}

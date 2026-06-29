import { useGame } from "../store/useGame";
import { REGIONS } from "../data/regions";
import { credits } from "../components/util";
import { CONFIG } from "../data/config";
import { Question } from "../components/icons";

export function Lobby() {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const transport = useGame((s) => s.transport);
  const dispatch = useGame((s) => s.dispatch);
  const leave = useGame((s) => s.leave);

  const toggleHowTo = useGame((s) => s.toggleHowTo);
  const me = table.players.find((p) => p.id === playerId);
  const isHost = table.hostId === playerId || transport === "local";
  const takenBy = (regionId: string) => table.players.find((p) => p.regionId === regionId);
  const readyCount = table.players.filter((p) => p.ready).length;

  return (
    <div className="lobby">
      <div className="lobby-top">
        <div>
          <div className="mono upper tiny muted">Table</div>
          <h1 className="lobby-code">{table.code}</h1>
        </div>
        <div className="lobby-roster card">
          <div className="upper tiny muted" style={{ marginBottom: "0.3rem" }}>Seated ({table.players.length}/{CONFIG.maxPlayersPerTable})</div>
          <div className="row wrap gap-1">
            {table.players.map((p) => (
              <span key={p.id} className={`seat-chip c-${p.color} ${p.id === playerId ? "me" : ""}`}>
                <span className="seat-dot spot-bg" />
                {p.name}{p.regionId ? ` · ${REGIONS.find((r) => r.id === p.regionId)?.flag ?? ""}` : " · choosing…"}
              </span>
            ))}
            {table.players.length === 0 && <span className="tiny muted">No one yet.</span>}
          </div>
        </div>
        <button className="btn btn-sm" onClick={() => toggleHowTo(true)}><Question size={14} /> How to play</button>
        <button className="btn btn-sm btn-ghost" onClick={leave}>← Leave</button>
      </div>

      <p className="lobby-hint">
        Pick a token. There are <b>ten</b> regions but only six seats — like choosing the top-hat
        over the thimble, unchosen tokens sit out. Everyone starts with the same{" "}
        <b>{credits(CONFIG.startingBudget)}</b>; your edge is <b>what your region has</b>.
      </p>

      <div className="region-grid">
        {REGIONS.map((r) => {
          const owner = takenBy(r.id);
          const mine = owner?.id === playerId;
          const disabled = !!owner && !mine;
          return (
            <button
              key={r.id}
              className={`region-card card c-${r.color} ${mine ? "picked" : ""} ${disabled ? "taken" : ""}`}
              disabled={disabled || table.phase !== "lobby"}
              onClick={() => dispatch({ type: "pickRegion", playerId, regionId: r.id })}
            >
              <div className="region-head">
                <span className="region-flag">{r.flag}</span>
                <span className="region-name display">{r.name}</span>
                {r.advanced && <span className="tag warn">Advanced</span>}
                {r.creditBonus > 0 && <span className="tag coin">+{credits(r.creditBonus)}</span>}
              </div>
              <div className="region-body">
                <div className="rc-line"><b>Powers</b><span>{r.powers[0]}</span></div>
                <div className="rc-line"><b>Holds</b><span>{r.assets.map((a) => a.name).join(", ")}</span></div>
                <div className="rc-line"><b>Short on</b><span className="warn-text">{r.shortOn}</span></div>
                <div className="rc-move tiny">▸ {r.signatureMove}</div>
              </div>
              <div className="region-foot tiny mono">
                {owner ? (mine ? "✓ Your pick" : `Taken by ${owner.name}`) : "Tap to claim"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="lobby-actions">
        {isHost && transport === "local" && (
          <div className="row gap-1">
            <span className="tiny upper muted">Add rivals:</span>
            {[1, 2, 3, 5].map((n) => (
              <button key={n} className="btn btn-sm" onClick={() => dispatch({ type: "addBots", count: n })}>+{n} bot</button>
            ))}
          </div>
        )}
        <div className="grow" />
        {me?.ready ? (
          <span className="tiny good-text">You're in as {REGIONS.find((r) => r.id === me.regionId)?.name}.</span>
        ) : (
          <span className="tiny muted">Choose a region to lock in.</span>
        )}
        {isHost ? (
          <button className="btn btn-go" disabled={readyCount === 0} onClick={() => dispatch({ type: "startGame" })}>
            Start game · {readyCount} player{readyCount === 1 ? "" : "s"}
          </button>
        ) : (
          <span className="tiny muted">Waiting for the host to start…</span>
        )}
      </div>
    </div>
  );
}

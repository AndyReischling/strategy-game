import { useGame } from "../../store/useGame";
import { CONFIG } from "../../data/config";
import { PHASE_ORDER } from "../../engine/actions";
import { ArrowRight, Check, Megaphone, Hammer, Handshake, Power, Sparkle, ShoppingCart } from "../icons";
import type { Icon } from "../icons";

const PHASE_META: Record<string, { label: string; icon: Icon; hint: string }> = {
  "market-open": { label: "Market", icon: ShoppingCart, hint: "Prices are posted with this round's modifiers. You already have your budget." },
  "world-event": { label: "Event", icon: Megaphone, hint: "One card flips for the whole table — it sets the round's weather." },
  build: { label: "Build", icon: Hammer, hint: "Your one action this round: buy a piece of infrastructure (one layer) — or spend it on a VC pitch or a deal instead." },
  trade: { label: "Trade", icon: Handshake, hint: "Spend your action on ONE deal or a VC pitch; accepting offers others send you is always free." },
  "off-switch": { label: "Off-switch", icon: Power, hint: "The adversary's move. Exposed stacks crack; sovereign ones shrug it off." },
  score: { label: "Score", icon: Sparkle, hint: "Running scores update and write to the live leaderboard." },
};

export function PhaseRail() {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const transport = useGame((s) => s.transport);
  const dispatch = useGame((s) => s.dispatch);
  const isHost = table.hostId === playerId || transport === "local";

  const currentIdx = PHASE_ORDER.indexOf(table.phase as (typeof PHASE_ORDER)[number]);
  const meta = PHASE_META[table.phase];

  const advanceLabel =
    table.phase === "score"
      ? table.round < CONFIG.totalRounds ? "Begin next round" : "See final results"
      : `Go to ${PHASE_META[PHASE_ORDER[currentIdx + 1]]?.label ?? "next"}`;

  return (
    <div className="phase-rail">
      <div className="pr-round">
        <span className="tiny upper mono muted">Round</span>
        <span className="pr-round-n display">{table.round}<span className="muted">/{CONFIG.totalRounds}</span></span>
      </div>

      <ol className="pr-steps">
        {PHASE_ORDER.map((ph, i) => {
          const m = PHASE_META[ph];
          const Icon = m.icon;
          const state = i < currentIdx ? "done" : i === currentIdx ? "now" : "next";
          return (
            <li key={ph} className={`pr-step ${state}`}>
              <span className="pr-bullet">{state === "done" ? <Check size={13} /> : <Icon size={14} />}</span>
              <span className="pr-label">{m.label}</span>
            </li>
          );
        })}
      </ol>

      {meta && <p className="pr-hint tiny">{meta.hint}</p>}

      <div className="pr-advance">
        {isHost ? (
          <button className="btn btn-go" onClick={() => dispatch({ type: "advancePhase", playerId })}>
            {advanceLabel} <ArrowRight size={16} />
          </button>
        ) : (
          <span className="tiny muted">The host moves the table to the next step.</span>
        )}
      </div>
    </div>
  );
}

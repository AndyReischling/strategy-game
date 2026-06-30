import { useGame } from "../../store/useGame";
import { currentEvent } from "../../engine/game";
import { REGION_BY_ID } from "../../data/regions";
import { CONFIG } from "../../data/config";
import { exposedLayers } from "../../engine/offswitch";
import type { StrengthDim } from "../../data/types";
import { Question, CaretRight } from "../icons";

const DIM_LABEL: Record<StrengthDim, string> = {
  chips: "chips",
  compute: "compute",
  talent: "talent",
  weights: "owned models",
  market: "market reach",
  capital: "capital",
};

// A non-intrusive, collapsed-by-default plain-language read-out of what's
// happening right now — the current event, your progress, and your next move.
export function SituationExplainer() {
  const table = useGame((s) => s.table)!;
  const playerId = useGame((s) => s.playerId);
  const me = table.players.find((p) => p.id === playerId);
  if (!me) return null;

  const region = REGION_BY_ID[me.regionId];
  const event = currentEvent(table);
  const covered = Object.keys(me.picks).length;
  const exposed = exposedLayers(me).length;
  const short = (Object.entries(region?.strengths ?? {}) as [StrengthDim, number][])
    .filter(([, v]) => v <= -1)
    .map(([d]) => DIM_LABEL[d]);
  const myDeals = table.deals.filter((d) => d.active && !d.broken && (d.fromPlayerId === me.id || d.toPlayerId === me.id)).length;

  const lines: string[] = [];
  lines.push(`It's round ${table.round} of ${CONFIG.totalRounds}.`);
  if (event) lines.push(`This round: ${event.name} — ${event.effectText}`);
  lines.push(
    covered >= 5
      ? "Your five-layer stack is complete — now deepen it and defend it."
      : `You've built ${covered}/5 layers. Every empty layer caps how many users your whole stack reaches, so fill them all.`,
  );
  if (short.length) lines.push(`Your region is short on ${short.join(", ")}. You can't build those well — cover them at the deal table.`);
  if (exposed > 0) lines.push(`${exposed} of your pieces are rented or foreign — the off-switch dice can knock them out. Owned/sovereign picks are safe.`);
  if (myDeals > 0) lines.push(`You're in ${myDeals} active deal${myDeals === 1 ? "" : "s"}.`);
  lines.push(
    me.actionThisRound
      ? "You've used your build this round — but deals are free, so you can still trade and accept offers."
      : "Your move: build one layer, strike a deal (free — you can still build after), or pitch General Catalyst for cash.",
  );

  return (
    <details className="situation card">
      <summary>
        <Question size={15} /> What's going on?
        <CaretRight size={14} className="se-caret" />
      </summary>
      <div className="situation-body">
        {lines.map((l, i) => (
          <p key={i} className="se-line">{l}</p>
        ))}
      </div>
    </details>
  );
}
